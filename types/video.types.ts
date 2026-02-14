/**
 * Video Types for MuslimGuard
 * Types for the curated video feature (YouTube videos from backend)
 */

export interface VideoCategory {
  id: number;
  name: string;
  icon: string; // MaterialCommunityIcons name
  order: number;
}

export interface Video {
  id: number;
  youtubeId: string;
  title: string;
  thumbnailUrl: string | null;
  hasSound: boolean;
  order: number;
}

// API response types
export interface CategoriesResponse {
  categories: VideoCategory[];
}

export interface VideosResponse {
  videos: Video[];
}
