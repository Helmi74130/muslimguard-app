/**
 * Prayer Service for MuslimGuard
 * Fetches prayer times from AlAdhan API with local caching
 */

import { format, differenceInMinutes, differenceInSeconds, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { StorageService } from './storage.service';
import { PrayerCacheService, CachedDayData } from './prayer-cache.service';
import { PrayerApiService } from './prayer-api.service';
import {
  PrayerName,
  CityCoordinates,
  PrayerMethodId,
  HijriDateInfo,
} from '@/types/storage.types';

// Prayer names in French
export const PRAYER_NAMES_FR: Record<PrayerName, string> = {
  fajr: 'Fajr',
  sunrise: 'Lever du soleil',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

// Interface for prayer time data
export interface PrayerTimeInfo {
  name: PrayerName;
  nameFr: string;
  time: Date;
  timeFormatted: string;
  isPassed: boolean;
  isCurrent: boolean;
}

export interface NextPrayerInfo {
  name: PrayerName;
  nameFr: string;
  time: Date;
  timeFormatted: string;
  minutesRemaining: number;
  secondsRemaining: number;
}

/**
 * Parse time string (HH:mm) to Date object for today
 */
function parseTimeToDate(timeStr: string, date: Date = new Date()): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Determine current prayer based on prayer times
 */
function getCurrentPrayer(times: CachedDayData, now: Date): PrayerName | null {
  const prayerOrder: PrayerName[] = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const prayerTimes: { name: PrayerName; time: Date }[] = [
    { name: 'fajr', time: parseTimeToDate(times.times.fajr, now) },
    { name: 'sunrise', time: parseTimeToDate(times.times.sunrise, now) },
    { name: 'dhuhr', time: parseTimeToDate(times.times.dhuhr, now) },
    { name: 'asr', time: parseTimeToDate(times.times.asr, now) },
    { name: 'maghrib', time: parseTimeToDate(times.times.maghrib, now) },
    { name: 'isha', time: parseTimeToDate(times.times.isha, now) },
  ];

  // Find current prayer (last prayer that has passed)
  let currentPrayer: PrayerName | null = null;
  for (const prayer of prayerTimes) {
    if (now >= prayer.time) {
      currentPrayer = prayer.name;
    }
  }

  return currentPrayer;
}

/**
 * Get next prayer after current time
 */
function getNextPrayerFromTimes(
  times: CachedDayData,
  now: Date
): { name: PrayerName; time: Date } | null {
  const prayerTimes: { name: PrayerName; time: Date }[] = [
    { name: 'fajr', time: parseTimeToDate(times.times.fajr, now) },
    { name: 'sunrise', time: parseTimeToDate(times.times.sunrise, now) },
    { name: 'dhuhr', time: parseTimeToDate(times.times.dhuhr, now) },
    { name: 'asr', time: parseTimeToDate(times.times.asr, now) },
    { name: 'maghrib', time: parseTimeToDate(times.times.maghrib, now) },
    { name: 'isha', time: parseTimeToDate(times.times.isha, now) },
  ];

  // Find next prayer (first prayer after now)
  for (const prayer of prayerTimes) {
    if (prayer.time > now) {
      return prayer;
    }
  }

  return null; // All prayers have passed
}

/**
 * Prayer Service
 */
export const PrayerService = {
  /**
   * Get all prayer times for today with formatted info
   */
  async getTodayPrayerTimes(): Promise<PrayerTimeInfo[] | null> {
    const settings = await StorageService.getSettings();
    if (!settings.city) return null;

    const today = new Date();
    const cachedData = await PrayerCacheService.fetchAndCacheTimes(
      today,
      settings.city,
      settings.prayerMethod
    );

    if (!cachedData) return null;

    const now = new Date();
    const currentPrayer = getCurrentPrayer(cachedData, now);

    // Define prayer sequence
    const prayerSequence: { name: PrayerName; timeStr: string }[] = [
      { name: 'fajr', timeStr: cachedData.times.fajr },
      { name: 'sunrise', timeStr: cachedData.times.sunrise },
      { name: 'dhuhr', timeStr: cachedData.times.dhuhr },
      { name: 'asr', timeStr: cachedData.times.asr },
      { name: 'maghrib', timeStr: cachedData.times.maghrib },
      { name: 'isha', timeStr: cachedData.times.isha },
    ];

    const prayers: PrayerTimeInfo[] = [];

    for (const prayer of prayerSequence) {
      const time = parseTimeToDate(prayer.timeStr, now);
      const isPassed = time < now;
      const isCurrent = currentPrayer === prayer.name;

      prayers.push({
        name: prayer.name,
        nameFr: PRAYER_NAMES_FR[prayer.name],
        time,
        timeFormatted: prayer.timeStr,
        isPassed,
        isCurrent,
      });
    }

    return prayers;
  },

  /**
   * Get next prayer info
   */
  async getNextPrayer(): Promise<NextPrayerInfo | null> {
    const settings = await StorageService.getSettings();
    if (!settings.city) return null;

    const today = new Date();
    const now = new Date();

    // Get today's prayer times
    const cachedData = await PrayerCacheService.fetchAndCacheTimes(
      today,
      settings.city,
      settings.prayerMethod
    );

    if (!cachedData) return null;

    const nextPrayer = getNextPrayerFromTimes(cachedData, now);

    if (nextPrayer) {
      return {
        name: nextPrayer.name,
        nameFr: PRAYER_NAMES_FR[nextPrayer.name],
        time: nextPrayer.time,
        timeFormatted: format(nextPrayer.time, 'HH:mm'),
        minutesRemaining: differenceInMinutes(nextPrayer.time, now),
        secondsRemaining: differenceInSeconds(nextPrayer.time, now),
      };
    }

    // All prayers passed for today, get Fajr for tomorrow
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowData = await PrayerCacheService.fetchAndCacheTimes(
      tomorrow,
      settings.city,
      settings.prayerMethod
    );

    if (tomorrowData) {
      const fajrTime = parseTimeToDate(tomorrowData.times.fajr, tomorrow);
      return {
        name: 'fajr',
        nameFr: PRAYER_NAMES_FR.fajr,
        time: fajrTime,
        timeFormatted: format(fajrTime, 'HH:mm'),
        minutesRemaining: differenceInMinutes(fajrTime, now),
        secondsRemaining: differenceInSeconds(fajrTime, now),
      };
    }

    return null;
  },

  /**
   * Get Hijri date from cached data
   */
  async getHijriDate(date: Date = new Date()): Promise<HijriDateInfo | null> {
    const settings = await StorageService.getSettings();
    if (!settings.city) return null;

    const cachedData = await PrayerCacheService.fetchAndCacheTimes(
      date,
      settings.city,
      settings.prayerMethod
    );

    if (!cachedData) return null;

    return cachedData.hijri;
  },

  /**
   * Check if currently in prayer time pause window
   */
  async isInPrayerPauseWindow(): Promise<{
    isPaused: boolean;
    currentPrayer?: PrayerName;
    minutesRemaining?: number;
  }> {
    const settings = await StorageService.getSettings();

    // Check if auto-pause is enabled
    if (!settings.autoPauseDuringPrayer || !settings.city) {
      return { isPaused: false };
    }

    const today = new Date();
    const now = new Date();

    const cachedData = await PrayerCacheService.fetchAndCacheTimes(
      today,
      settings.city,
      settings.prayerMethod
    );

    if (!cachedData) return { isPaused: false };

    const pauseDuration = settings.pauseDurationMinutes;

    // Check each prayer time (excluding sunrise)
    const prayers: { name: PrayerName; time: Date }[] = [
      { name: 'fajr', time: parseTimeToDate(cachedData.times.fajr, now) },
      { name: 'dhuhr', time: parseTimeToDate(cachedData.times.dhuhr, now) },
      { name: 'asr', time: parseTimeToDate(cachedData.times.asr, now) },
      { name: 'maghrib', time: parseTimeToDate(cachedData.times.maghrib, now) },
      { name: 'isha', time: parseTimeToDate(cachedData.times.isha, now) },
    ];

    for (const prayer of prayers) {
      const prayerStart = prayer.time;
      const prayerEnd = new Date(prayer.time.getTime() + pauseDuration * 60 * 1000);

      if (now >= prayerStart && now <= prayerEnd) {
        const minutesRemaining = differenceInMinutes(prayerEnd, now);
        return {
          isPaused: true,
          currentPrayer: prayer.name,
          minutesRemaining: Math.max(0, minutesRemaining),
        };
      }
    }

    return { isPaused: false };
  },

  /**
   * Format time remaining as string
   */
  formatTimeRemaining(totalSeconds: number): string {
    if (totalSeconds <= 0) return '0:00';

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, '0')}min`;
    }
    if (minutes > 0) {
      return `${minutes}min ${seconds.toString().padStart(2, '0')}s`;
    }
    return `${seconds}s`;
  },

  /**
   * Get formatted date in French
   */
  getFormattedDate(date: Date = new Date()): string {
    return format(date, 'EEEE d MMMM yyyy', { locale: fr });
  },

  /**
   * Update city in settings and clear cache
   */
  async setCity(city: CityCoordinates): Promise<void> {
    console.log('[PrayerService] setCity called:', city.name, city.country);

    // Clear cache when city changes
    await PrayerCacheService.clearCache();
    console.log('[PrayerService] Cache cleared');

    await StorageService.updateSettings({ city });
    console.log('[PrayerService] Settings updated');

    // Prefetch new prayer times in background
    const settings = await StorageService.getSettings();
    console.log('[PrayerService] Starting prefetch for method:', settings.prayerMethod);

    PrayerCacheService.prefetchWeek(city, settings.prayerMethod)
      .then(() => {
        console.log('[PrayerService] Prefetch completed successfully');
      })
      .catch((error) => {
        console.error('[PrayerService] Prefetch failed:', error);
      });
  },

  /**
   * Update calculation method and clear cache
   */
  async setCalculationMethod(methodId: PrayerMethodId): Promise<void> {
    // Clear cache when method changes
    await PrayerCacheService.clearCache();
    await StorageService.updateSettings({ prayerMethod: methodId });

    // Prefetch new prayer times in background
    const settings = await StorageService.getSettings();
    if (settings.city) {
      PrayerCacheService.prefetchWeek(settings.city, methodId).catch(() => {});
    }
  },

  /**
   * Toggle auto-pause during prayer
   */
  async setAutoPause(enabled: boolean): Promise<void> {
    await StorageService.updateSettings({ autoPauseDuringPrayer: enabled });
  },

  /**
   * Set pause duration
   */
  async setPauseDuration(minutes: number): Promise<void> {
    await StorageService.updateSettings({ pauseDurationMinutes: minutes });
  },

  /**
   * Initialize prayer cache (call on app start)
   */
  async initialize(): Promise<void> {
    const settings = await StorageService.getSettings();
    if (settings.city) {
      // Prefetch prayer times for the week in background
      PrayerCacheService.prefetchWeek(settings.city, settings.prayerMethod).catch(() => {});
    }
  },
};

export default PrayerService;
