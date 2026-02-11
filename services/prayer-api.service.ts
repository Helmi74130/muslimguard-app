/**
 * AlAdhan API Service - MuslimGuard
 * Wrapper for the AlAdhan Prayer Times REST API
 * API Documentation: https://aladhan.com/prayer-times-api
 */

const API_BASE_URL = 'https://api.aladhan.com/v1';

/**
 * API Response Types
 */
export interface AlAdhanTimings {
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  // Additional times (not used but present in API)
  Imsak?: string;
  Midnight?: string;
  Firstthird?: string;
  Lastthird?: string;
}

export interface AlAdhanHijriMonth {
  number: number;
  en: string;
  ar: string;
}

export interface AlAdhanHijriDate {
  date: string; // DD-MM-YYYY format
  day: string;
  month: AlAdhanHijriMonth;
  year: string;
  designation: {
    abbreviated: string;
    expanded: string;
  };
}

export interface AlAdhanGregorianDate {
  date: string;
  day: string;
  month: {
    number: number;
    en: string;
  };
  year: string;
}

export interface AlAdhanMethod {
  id: number;
  name: string;
}

export interface AlAdhanMeta {
  latitude: number;
  longitude: number;
  timezone: string;
  method: AlAdhanMethod;
}

export interface AlAdhanData {
  timings: AlAdhanTimings;
  date: {
    readable: string;
    timestamp: string;
    gregorian: AlAdhanGregorianDate;
    hijri: AlAdhanHijriDate;
  };
  meta: AlAdhanMeta;
}

export interface AlAdhanResponse {
  code: number;
  status: string;
  data: AlAdhanData;
}

export interface AlAdhanError {
  code: number;
  status: string;
  data?: string;
}

/**
 * Format a Date object to DD-MM-YYYY for the API
 */
function formatDateForApi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Fetch prayer times from AlAdhan API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param date - Date for prayer times
 * @param methodId - Calculation method ID (see PRAYER_METHODS)
 * @returns API response or null on error
 */
async function fetchPrayerTimes(
  latitude: number,
  longitude: number,
  date: Date,
  methodId: number
): Promise<AlAdhanResponse | null> {
  const formattedDate = formatDateForApi(date);

  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    method: methodId.toString(),
    // school: '0', // Shafi (default) - we don't need to specify
  });

  const url = `${API_BASE_URL}/timings/${formattedDate}?${params.toString()}`;
  console.log('[PrayerAPI] Fetching:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('[PrayerAPI] Response status:', response.status);

    if (!response.ok) {
      console.error(`[PrayerAPI] HTTP error: ${response.status}`);
      return null;
    }

    const data: AlAdhanResponse = await response.json();

    if (data.code !== 200 || data.status !== 'OK') {
      console.error(`[PrayerAPI] API error: ${data.status}`);
      return null;
    }

    console.log('[PrayerAPI] Success for date:', formattedDate);
    return data;
  } catch (error) {
    console.error('[PrayerAPI] Network error:', error);
    return null;
  }
}

/**
 * Fetch prayer times for multiple dates (batch)
 * Useful for prefetching a week of prayer times
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param dates - Array of dates to fetch
 * @param methodId - Calculation method ID
 * @returns Map of date string (YYYY-MM-DD) to API response
 */
async function fetchPrayerTimesMultiple(
  latitude: number,
  longitude: number,
  dates: Date[],
  methodId: number
): Promise<Map<string, AlAdhanResponse>> {
  const results = new Map<string, AlAdhanResponse>();

  // Fetch all dates in parallel
  const promises = dates.map(async (date) => {
    const response = await fetchPrayerTimes(latitude, longitude, date, methodId);
    if (response) {
      const dateKey = formatDateToKey(date);
      results.set(dateKey, response);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Format a Date to YYYY-MM-DD for cache key
 */
function formatDateToKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get dates for the next N days starting from today
 */
function getNextDays(count: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = 0; i < count; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(date);
  }

  return dates;
}

/**
 * Prayer API Service
 */
export const PrayerApiService = {
  fetchPrayerTimes,
  fetchPrayerTimesMultiple,
  formatDateForApi,
  formatDateToKey,
  getNextDays,
};
