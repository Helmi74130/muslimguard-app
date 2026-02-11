/**
 * Prayer Cache Service - MuslimGuard
 * Manages local caching of prayer times from AlAdhan API
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { CityCoordinates, HijriDateInfo, DailyPrayerTimes } from '@/types/storage.types';
import { PrayerApiService, AlAdhanResponse } from './prayer-api.service';

/**
 * Cache storage keys
 */
const CACHE_KEYS = {
  PRAYER_DATA: 'cache.prayerData',
  CACHE_METADATA: 'cache.metadata',
};

/**
 * Cache validity duration in milliseconds (24 hours)
 */
const CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000;

/**
 * Number of days to prefetch
 */
const PREFETCH_DAYS = 7;

/**
 * Cached prayer data for a single day
 */
export interface CachedDayData {
  times: DailyPrayerTimes;
  hijri: HijriDateInfo;
  fetchedAt: number;
}

/**
 * Full cache structure
 */
interface PrayerCache {
  city: {
    latitude: number;
    longitude: number;
  };
  method: number;
  data: Record<string, CachedDayData>; // Key: YYYY-MM-DD
}

/**
 * Convert AlAdhan API response to cached day data
 */
function apiResponseToCachedData(response: AlAdhanResponse): CachedDayData {
  const { timings, date } = response.data;

  return {
    times: {
      date: date.gregorian.date,
      fajr: timings.Fajr,
      sunrise: timings.Sunrise,
      dhuhr: timings.Dhuhr,
      asr: timings.Asr,
      maghrib: timings.Maghrib,
      isha: timings.Isha,
    },
    hijri: {
      day: parseInt(date.hijri.day, 10),
      month: date.hijri.month.number,
      year: parseInt(date.hijri.year, 10),
      monthNameAr: date.hijri.month.ar,
      monthNameEn: date.hijri.month.en,
      formatted: `${date.hijri.day} ${date.hijri.month.ar} ${date.hijri.year} H`,
    },
    fetchedAt: Date.now(),
  };
}

/**
 * Get the full cache from storage
 */
async function getCache(): Promise<PrayerCache | null> {
  try {
    const json = await AsyncStorage.getItem(CACHE_KEYS.PRAYER_DATA);
    if (!json) return null;
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Save the full cache to storage
 */
async function setCache(cache: PrayerCache): Promise<void> {
  await AsyncStorage.setItem(CACHE_KEYS.PRAYER_DATA, JSON.stringify(cache));
}

/**
 * Check if cache is valid for the given city and method
 */
async function isCacheValid(city: CityCoordinates, methodId: number): Promise<boolean> {
  const cache = await getCache();
  if (!cache) return false;

  // Check if city and method match
  const sameCity =
    Math.abs(cache.city.latitude - city.latitude) < 0.01 &&
    Math.abs(cache.city.longitude - city.longitude) < 0.01;
  const sameMethod = cache.method === methodId;

  return sameCity && sameMethod;
}

/**
 * Get cached prayer times for a specific date
 * @param dateKey - Date in YYYY-MM-DD format
 * @returns Cached data or null if not cached or expired
 */
async function getCachedTimes(dateKey: string): Promise<CachedDayData | null> {
  const cache = await getCache();
  if (!cache) return null;

  const dayData = cache.data[dateKey];
  if (!dayData) return null;

  // Check if cache is still valid (24 hours)
  const age = Date.now() - dayData.fetchedAt;
  if (age > CACHE_VALIDITY_MS) {
    return null;
  }

  return dayData;
}

/**
 * Cache prayer times for a specific date
 */
async function cacheTimes(
  dateKey: string,
  data: CachedDayData,
  city: CityCoordinates,
  methodId: number
): Promise<void> {
  let cache = await getCache();

  // If cache doesn't exist or settings changed, create new cache
  if (!cache || !(await isCacheValid(city, methodId))) {
    cache = {
      city: {
        latitude: city.latitude,
        longitude: city.longitude,
      },
      method: methodId,
      data: {},
    };
  }

  // Add or update the day data
  cache.data[dateKey] = data;

  // Clean up old entries (keep only last 14 days)
  const today = new Date();
  const fourteenDaysAgo = new Date(today);
  fourteenDaysAgo.setDate(today.getDate() - 14);
  const cutoffKey = PrayerApiService.formatDateToKey(fourteenDaysAgo);

  const cleanedData: Record<string, CachedDayData> = {};
  for (const [key, value] of Object.entries(cache.data)) {
    if (key >= cutoffKey) {
      cleanedData[key] = value;
    }
  }
  cache.data = cleanedData;

  await setCache(cache);
}

/**
 * Clear all cached prayer data
 */
async function clearCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEYS.PRAYER_DATA);
  await AsyncStorage.removeItem(CACHE_KEYS.CACHE_METADATA);
}

/**
 * Prefetch prayer times for the next 7 days
 * This runs in the background when the app starts
 */
async function prefetchWeek(city: CityCoordinates, methodId: number): Promise<void> {
  console.log('[PrayerCache] prefetchWeek started for:', city.name, 'method:', methodId);

  const dates = PrayerApiService.getNextDays(PREFETCH_DAYS);
  console.log('[PrayerCache] Dates to check:', dates.length);

  // Check which dates need fetching
  const datesToFetch: Date[] = [];
  for (const date of dates) {
    const dateKey = PrayerApiService.formatDateToKey(date);
    const cached = await getCachedTimes(dateKey);
    if (!cached) {
      datesToFetch.push(date);
    }
  }

  console.log('[PrayerCache] Dates to fetch from API:', datesToFetch.length);

  if (datesToFetch.length === 0) {
    console.log('[PrayerCache] All dates already cached, skipping API call');
    return; // All dates are already cached
  }

  // Fetch missing dates
  console.log('[PrayerCache] Calling API for', datesToFetch.length, 'dates...');
  const responses = await PrayerApiService.fetchPrayerTimesMultiple(
    city.latitude,
    city.longitude,
    datesToFetch,
    methodId
  );

  console.log('[PrayerCache] API returned', responses.size, 'responses');

  // Cache the responses
  for (const [dateKey, response] of responses.entries()) {
    const cachedData = apiResponseToCachedData(response);
    await cacheTimes(dateKey, cachedData, city, methodId);
  }

  console.log('[PrayerCache] prefetchWeek completed');
}

/**
 * Fetch and cache prayer times for a specific date
 * Returns cached data if available, otherwise fetches from API
 */
async function fetchAndCacheTimes(
  date: Date,
  city: CityCoordinates,
  methodId: number
): Promise<CachedDayData | null> {
  const dateKey = PrayerApiService.formatDateToKey(date);

  // Check cache first
  const isValid = await isCacheValid(city, methodId);
  if (isValid) {
    const cached = await getCachedTimes(dateKey);
    if (cached) {
      return cached;
    }
  }

  // Fetch from API
  const response = await PrayerApiService.fetchPrayerTimes(
    city.latitude,
    city.longitude,
    date,
    methodId
  );

  if (!response) {
    // API failed, try to return stale cache if any
    const staleCache = await getCache();
    if (staleCache?.data[dateKey]) {
      console.warn('[PrayerCache] Using stale cache due to API failure');
      return staleCache.data[dateKey];
    }
    return null;
  }

  // Convert and cache
  const cachedData = apiResponseToCachedData(response);
  await cacheTimes(dateKey, cachedData, city, methodId);

  return cachedData;
}

/**
 * Prayer Cache Service
 */
export const PrayerCacheService = {
  getCachedTimes,
  cacheTimes,
  isCacheValid,
  clearCache,
  prefetchWeek,
  fetchAndCacheTimes,
  apiResponseToCachedData,
};
