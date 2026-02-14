/**
 * Video Service for MuslimGuard
 * Fetches curated YouTube video categories and videos from the backend API.
 * Includes in-memory cache to avoid redundant requests.
 */

import {
  VideoCategory,
  Video,
  CategoriesResponse,
  VideosResponse,
} from '@/types/video.types';

const API_BASE_URL = 'https://muslim-guard.com/api/muslimguard';
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// In-memory cache
let categoriesCache: CacheEntry<VideoCategory[]> | null = null;
const videosByCategory: Record<string, CacheEntry<Video[]>> = {};

function isCacheValid<T>(entry: CacheEntry<T> | null): entry is CacheEntry<T> {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION_MS;
}

function getThumbnailUrl(video: Video): string {
  return (
    video.thumbnailUrl ||
    `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`
  );
}

async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export const VideoService = {
  /**
   * Fetch all active video categories
   */
  async getCategories(forceRefresh = false): Promise<VideoCategory[]> {
    if (!forceRefresh && isCacheValid(categoriesCache)) {
      return categoriesCache.data;
    }

    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/categories`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: CategoriesResponse = await response.json();
      categoriesCache = { data: data.categories, timestamp: Date.now() };
      return data.categories;
    } catch (error) {
      // Return cached data if available (even expired)
      if (categoriesCache) {
        return categoriesCache.data;
      }
      throw error;
    }
  },

  /**
   * Fetch videos for a specific category (or all if no categoryId)
   */
  async getVideos(
    categoryId?: number,
    forceRefresh = false
  ): Promise<Video[]> {
    const cacheKey = categoryId ? String(categoryId) : 'all';

    if (!forceRefresh && isCacheValid(videosByCategory[cacheKey])) {
      return videosByCategory[cacheKey].data;
    }

    try {
      const url = categoryId
        ? `${API_BASE_URL}/videos?categoryId=${categoryId}`
        : `${API_BASE_URL}/videos`;

      const response = await fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: VideosResponse = await response.json();
      videosByCategory[cacheKey] = {
        data: data.videos,
        timestamp: Date.now(),
      };
      return data.videos;
    } catch (error) {
      // Return cached data if available (even expired)
      if (videosByCategory[cacheKey]) {
        return videosByCategory[cacheKey].data;
      }
      throw error;
    }
  },

  /**
   * Get thumbnail URL (custom or YouTube default)
   */
  getThumbnailUrl,

  /**
   * Clear all caches
   */
  clearCache(): void {
    categoriesCache = null;
    Object.keys(videosByCategory).forEach(
      (key) => delete videosByCategory[key]
    );
  },
};
