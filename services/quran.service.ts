/**
 * Quran API Service - MuslimGuard
 * Handles all API calls to the Quran API (https://quranapi.pages.dev/api/)
 */

const BASE_URL = 'https://quranapi.pages.dev/api';

// Available reciters (excluding Mishary as requested)
export const RECITERS = {
  4: 'Yasser Al Dosari', // Default
  2: 'Abu Bakr Al Shatri',
  3: 'Nasser Al Qatami',
  5: 'Hani Ar Rifai',
} as const;

export type ReciterId = keyof typeof RECITERS;

export const DEFAULT_RECITER: ReciterId = 4; // Yasser Al Dosari

// Types for API responses
export interface SurahInfo {
  surahName: string;
  surahNameArabic: string;
  surahNameArabicLong: string;
  surahNameTranslation: string;
  revelationPlace: string;
  totalAyah: number;
}

export interface SurahDetails extends SurahInfo {
  surahNo: number;
  audio: {
    [key: string]: string; // reciterId: audioUrl
  };
  english: { [ayahNo: string]: string };
  arabic1: { [ayahNo: string]: string }; // With diacritics
  arabic2: { [ayahNo: string]: string }; // Without diacritics
}

export interface AyahDetails {
  surahNo: number;
  ayahNo: number;
  audio: {
    [key: string]: string; // reciterId: audioUrl
  };
  english: string;
  arabic1: string; // With diacritics
  arabic2: string; // Without diacritics
}

export interface AudioReciterInfo {
  reciter: string;
  url: string;
  originalUrl: string;
}

export interface AudioInfo {
  [reciterId: string]: AudioReciterInfo;
}

class QuranServiceClass {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data if valid, otherwise return null
   */
  private getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data as T;
    }
    return null;
  }

  /**
   * Set cache data
   */
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Fetch with error handling
   */
  private async fetchApi<T>(endpoint: string): Promise<T> {
    const cacheKey = endpoint;
    const cached = this.getCached<T>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get list of all surahs
   */
  async getAllSurahs(): Promise<SurahInfo[]> {
    return this.fetchApi<SurahInfo[]>('/surah.json');
  }

  /**
   * Get a complete surah with all ayahs
   */
  async getSurah(surahNo: number): Promise<SurahDetails> {
    const data = await this.fetchApi<any>(`/${surahNo}.json`);
    return {
      ...data,
      surahNo,
    };
  }

  /**
   * Get a specific ayah (verse)
   */
  async getAyah(surahNo: number, ayahNo: number): Promise<AyahDetails> {
    return this.fetchApi<AyahDetails>(`/${surahNo}/${ayahNo}.json`);
  }

  /**
   * Get audio URLs for a surah
   */
  async getSurahAudio(surahNo: number): Promise<AudioInfo> {
    return this.fetchApi<AudioInfo>(`/audio/${surahNo}.json`);
  }

  /**
   * Get audio URLs for a specific ayah
   */
  async getAyahAudio(surahNo: number, ayahNo: number): Promise<AudioInfo> {
    return this.fetchApi<AudioInfo>(`/audio/${surahNo}/${ayahNo}.json`);
  }

  /**
   * Get list of available reciters
   */
  getReciters(): typeof RECITERS {
    return RECITERS;
  }

  /**
   * Get reciter name by ID
   */
  getReciterName(reciterId: ReciterId): string {
    return RECITERS[reciterId] || 'Unknown';
  }

  /**
   * Search surahs by name (Arabic or English)
   */
  searchSurahs(surahs: SurahInfo[], query: string): (SurahInfo & { surahNo: number })[] {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      return surahs.map((surah, index) => ({ ...surah, surahNo: index + 1 }));
    }

    return surahs
      .map((surah, index) => ({ ...surah, surahNo: index + 1 }))
      .filter((surah) => {
        return (
          surah.surahName.toLowerCase().includes(lowerQuery) ||
          surah.surahNameArabic.includes(query) ||
          surah.surahNameTranslation.toLowerCase().includes(lowerQuery) ||
          surah.surahNo.toString() === lowerQuery
        );
      });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const QuranService = new QuranServiceClass();
