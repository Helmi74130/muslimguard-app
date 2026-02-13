/**
 * Weather Service for MuslimGuard
 * Uses WeatherAPI.com (free tier) with local caching
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/types/storage.types';
import { StorageService } from './storage.service';

const API_KEY = 'b13aaac1cf3f43c9ac475717261302';
const BASE_URL = 'https://api.weatherapi.com/v1';

/** Cache duration: 3 hours */
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000;

/** Minimum time between manual refreshes: 30 minutes */
const REFRESH_COOLDOWN_MS = 30 * 60 * 1000;

export interface WeatherData {
  /** Temperature in Celsius */
  tempC: number;
  /** Feels like temperature in Celsius */
  feelsLikeC: number;
  /** Weather condition text (e.g. "Partly cloudy") */
  conditionText: string;
  /** Weather condition icon URL (https) */
  conditionIcon: string;
  /** WeatherAPI condition code (for mapping to custom icons) */
  conditionCode: number;
  /** Humidity percentage */
  humidity: number;
  /** Wind speed in km/h */
  windKph: number;
  /** Wind direction (e.g. "NNE") */
  windDir: string;
  /** City name */
  cityName: string;
  /** Country */
  country: string;
  /** Is it daytime */
  isDay: boolean;
  /** Timestamp when data was fetched */
  fetchedAt: number;
}

interface CachedWeather {
  data: WeatherData;
  lastRefreshAt: number;
  /** Coordinates used to fetch this data (to detect city change) */
  latitude: number;
  longitude: number;
}

/**
 * Map WeatherAPI condition code to a MaterialCommunityIcons name
 */
export function getWeatherIcon(code: number, isDay: boolean): string {
  // https://www.weatherapi.com/docs/weather_conditions.json
  if (code === 1000) return isDay ? 'weather-sunny' : 'weather-night';
  if (code === 1003) return isDay ? 'weather-partly-cloudy' : 'weather-night-partly-cloudy';
  if (code === 1006 || code === 1009) return 'weather-cloudy';
  if (code === 1030 || code === 1135 || code === 1147) return 'weather-fog';
  if ([1063, 1150, 1153, 1180, 1183].includes(code)) return 'weather-partly-rainy';
  if ([1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return 'weather-rainy';
  if ([1066, 1210, 1213, 1216, 1219, 1222, 1225, 1255, 1258].includes(code)) return 'weather-snowy';
  if ([1069, 1072, 1168, 1171, 1198, 1201, 1204, 1207, 1237, 1249, 1252].includes(code)) return 'weather-snowy-rainy';
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return 'weather-lightning-rainy';
  if ([1114, 1117].includes(code)) return 'weather-snowy-heavy';
  if (code === 1261 || code === 1264) return 'weather-hail';
  return 'weather-cloudy';
}

/**
 * Map WeatherAPI condition code to a kid-friendly color
 */
export function getWeatherColor(code: number, isDay: boolean): string {
  if (code === 1000) return isDay ? '#F59E0B' : '#6366F1'; // sunny / clear night
  if (code === 1003) return isDay ? '#60A5FA' : '#818CF8';
  if (code === 1006 || code === 1009) return '#94A3B8'; // cloudy
  if (code === 1030 || code === 1135 || code === 1147) return '#CBD5E1'; // fog
  if (code >= 1063 && code <= 1246) return '#3B82F6'; // rain
  if (code >= 1066 && code <= 1258) return '#A5B4FC'; // snow
  if (code === 1087 || code >= 1273) return '#7C3AED'; // thunder
  return '#60A5FA';
}

export const WeatherService = {
  /**
   * Get current weather data (from cache or API)
   */
  async getCurrentWeather(forceRefresh = false): Promise<WeatherData | null> {
    const settings = await StorageService.getSettings();
    if (!settings.city) return null;

    const { latitude, longitude } = settings.city;
    const cached = await this.getCachedWeather();

    // Invalidate cache if city changed
    const cityChanged = cached
      && (cached.latitude !== latitude || cached.longitude !== longitude);

    // Check cache first (skip if city changed)
    if (!forceRefresh && !cityChanged) {
      if (cached && Date.now() - cached.data.fetchedAt < CACHE_DURATION_MS) {
        return cached.data;
      }
    }

    // Check refresh cooldown (only for manual refresh, skip if city changed)
    if (forceRefresh && !cityChanged) {
      if (cached && Date.now() - cached.lastRefreshAt < REFRESH_COOLDOWN_MS) {
        return cached.data; // Return cached data, cooldown active
      }
    }

    // Fetch from API
    try {
      const url = `${BASE_URL}/current.json?key=${API_KEY}&q=${latitude},${longitude}&lang=fr`;
      const response = await fetch(url);

      if (!response.ok) {
        // Return cached data on error
        const cached = await this.getCachedWeather();
        return cached?.data || null;
      }

      const json = await response.json();
      const current = json.current;
      const location = json.location;

      const weatherData: WeatherData = {
        tempC: Math.round(current.temp_c),
        feelsLikeC: Math.round(current.feelslike_c),
        conditionText: current.condition.text,
        conditionIcon: current.condition.icon.replace('//cdn', 'https://cdn'),
        conditionCode: current.condition.code,
        humidity: current.humidity,
        windKph: Math.round(current.wind_kph),
        windDir: current.wind_dir,
        cityName: location.name,
        country: location.country,
        isDay: current.is_day === 1,
        fetchedAt: Date.now(),
      };

      // Save to cache with current coordinates
      await this.setCachedWeather({
        data: weatherData,
        lastRefreshAt: Date.now(),
        latitude,
        longitude,
      });

      return weatherData;
    } catch {
      // Return cached data on network error
      const cached = await this.getCachedWeather();
      return cached?.data || null;
    }
  },

  /**
   * Check if refresh cooldown is active
   */
  async isRefreshOnCooldown(): Promise<boolean> {
    const cached = await this.getCachedWeather();
    if (!cached) return false;
    return Date.now() - cached.lastRefreshAt < REFRESH_COOLDOWN_MS;
  },

  /**
   * Get cached weather data
   */
  async getCachedWeather(): Promise<CachedWeather | null> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.WEATHER_CACHE);
      if (!json) return null;
      return JSON.parse(json);
    } catch {
      return null;
    }
  },

  /**
   * Save weather data to cache
   */
  async setCachedWeather(cached: CachedWeather): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.WEATHER_CACHE, JSON.stringify(cached));
  },
};
