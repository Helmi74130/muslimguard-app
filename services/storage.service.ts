/**
 * Storage Service for MuslimGuard
 * AsyncStorage + SecureStore wrapper for local data storage
 */

import {
  AppSettings,
  BlockedAttempt,
  BlocklistData,
  DEFAULT_LOCKOUT_STATE,
  DEFAULT_PEDOMETER_DATA,
  DEFAULT_RECOVERY_LOCKOUT_STATE,
  DEFAULT_SCHEDULE,
  DEFAULT_SETTINGS,
  EmotionEntry,
  HistoryEntry,
  LocalVideo,
  MAX_CUSTOM_VIDEOS,
  MAX_EMOTION_ENTRIES,
  MAX_NOTES,
  NoteEntry,
  PedometerData,
  PinLockoutState,
  RecoveryLockoutState,
  ScheduleData,
  STORAGE_KEYS,
} from '@/types/storage.types';
import {
  DEFAULT_SUBSCRIPTION_STATE,
  LocalSubscriptionState,
} from '@/types/subscription.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Storage Service - Provides typed access to all app data
 * Note: All methods are now async due to AsyncStorage/SecureStore
 */
export const StorageService = {
  // ==================== SETTINGS ====================

  /**
   * Get all app settings
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!json) return DEFAULT_SETTINGS;

      const parsed = JSON.parse(json);
      // Merge with defaults to handle new settings added in updates
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  /**
   * Save all app settings
   */
  async setSettings(settings: AppSettings): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  /**
   * Update specific settings
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...updates };
    await this.setSettings(updated);
    return updated;
  },

  /**
   * Check if onboarding is complete
   */
  async isOnboardingComplete(): Promise<boolean> {
    const settings = await this.getSettings();
    return settings.isOnboardingComplete;
  },

  /**
   * Mark onboarding as complete
   */
  async completeOnboarding(): Promise<void> {
    await this.updateSettings({ isOnboardingComplete: true });
  },

  // ==================== PIN (Secure Storage) ====================

  /**
   * Save PIN hash and salt (encrypted with SecureStore)
   */
  async savePinCredentials(pinHash: string, pinSalt: string): Promise<void> {
    await SecureStore.setItemAsync('pin.hash', pinHash);
    await SecureStore.setItemAsync('pin.salt', pinSalt);
    // Also update settings for quick access to know if PIN exists
    await this.updateSettings({ pinHash, pinSalt });
  },

  /**
   * Get PIN hash (encrypted storage)
   */
  async getPinHash(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('pin.hash');
    } catch {
      return null;
    }
  },

  /**
   * Get PIN salt (encrypted storage)
   */
  async getPinSalt(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('pin.salt');
    } catch {
      return null;
    }
  },

  /**
   * Check if PIN is set
   */
  async hasPinSet(): Promise<boolean> {
    const hash = await this.getPinHash();
    return !!hash;
  },

  // ==================== LOCKOUT ====================

  /**
   * Get PIN lockout state
   */
  async getLockoutState(): Promise<PinLockoutState> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.PIN_LOCKOUT);
      if (!json) return DEFAULT_LOCKOUT_STATE;

      return { ...DEFAULT_LOCKOUT_STATE, ...JSON.parse(json) };
    } catch {
      return DEFAULT_LOCKOUT_STATE;
    }
  },

  /**
   * Save PIN lockout state
   */
  async setLockoutState(state: PinLockoutState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PIN_LOCKOUT, JSON.stringify(state));
  },

  /**
   * Reset lockout state
   */
  async resetLockout(): Promise<void> {
    await this.setLockoutState(DEFAULT_LOCKOUT_STATE);
  },

  // ==================== BLOCKLIST ====================

  /**
   * Get blocked domains
   */
  async getBlockedDomains(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKLIST_DOMAINS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Set blocked domains
   */
  async setBlockedDomains(domains: string[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKLIST_DOMAINS, JSON.stringify(domains));
  },

  /**
   * Add a domain to blocklist
   */
  async addBlockedDomain(domain: string): Promise<void> {
    const domains = await this.getBlockedDomains();
    const normalized = domain.toLowerCase().trim();
    if (!domains.includes(normalized)) {
      domains.push(normalized);
      await this.setBlockedDomains(domains);
    }
  },

  /**
   * Remove a domain from blocklist
   */
  async removeBlockedDomain(domain: string): Promise<void> {
    const domains = await this.getBlockedDomains();
    const normalized = domain.toLowerCase().trim();
    const filtered = domains.filter((d) => d !== normalized);
    await this.setBlockedDomains(filtered);
  },

  /**
   * Get blocked keywords
   */
  async getBlockedKeywords(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKLIST_KEYWORDS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Set blocked keywords
   */
  async setBlockedKeywords(keywords: string[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKLIST_KEYWORDS, JSON.stringify(keywords));
  },

  /**
   * Add a keyword to blocklist
   */
  async addBlockedKeyword(keyword: string): Promise<void> {
    const keywords = await this.getBlockedKeywords();
    const normalized = keyword.toLowerCase().trim();
    if (!keywords.includes(normalized)) {
      keywords.push(normalized);
      await this.setBlockedKeywords(keywords);
    }
  },

  /**
   * Remove a keyword from blocklist
   */
  async removeBlockedKeyword(keyword: string): Promise<void> {
    const keywords = await this.getBlockedKeywords();
    const normalized = keyword.toLowerCase().trim();
    const filtered = keywords.filter((k) => k !== normalized);
    await this.setBlockedKeywords(filtered);
  },

  /**
   * Get full blocklist data
   */
  async getBlocklistData(): Promise<BlocklistData> {
    return {
      domains: await this.getBlockedDomains(),
      keywords: await this.getBlockedKeywords(),
    };
  },

  // ==================== BLOCKLIST CATEGORIES ====================

  /**
   * Get disabled category IDs (all enabled by default)
   */
  async getDisabledCategories(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKLIST_DISABLED_CATEGORIES);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Set disabled category IDs
   */
  async setDisabledCategories(categoryIds: string[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKLIST_DISABLED_CATEGORIES, JSON.stringify(categoryIds));
  },

  /**
   * Get custom domains added by parent
   */
  async getCustomDomains(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKLIST_CUSTOM_DOMAINS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Set custom domains
   */
  async setCustomDomains(domains: string[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKLIST_CUSTOM_DOMAINS, JSON.stringify(domains));
  },

  /**
   * Get custom keywords added by parent
   */
  async getCustomKeywords(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKLIST_CUSTOM_KEYWORDS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Set custom keywords
   */
  async setCustomKeywords(keywords: string[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKLIST_CUSTOM_KEYWORDS, JSON.stringify(keywords));
  },

  // ==================== WHITELIST (STRICT MODE) ====================

  /**
   * Get whitelisted domains
   */
  async getWhitelistDomains(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.WHITELIST_DOMAINS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Set whitelisted domains
   */
  async setWhitelistDomains(domains: string[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.WHITELIST_DOMAINS, JSON.stringify(domains));
  },

  /**
   * Add a domain to whitelist
   */
  async addWhitelistDomain(domain: string): Promise<void> {
    const domains = await this.getWhitelistDomains();
    const normalized = domain.toLowerCase().trim();
    if (!domains.includes(normalized)) {
      domains.push(normalized);
      await this.setWhitelistDomains(domains);
    }
  },

  /**
   * Remove a domain from whitelist
   */
  async removeWhitelistDomain(domain: string): Promise<void> {
    const domains = await this.getWhitelistDomains();
    const normalized = domain.toLowerCase().trim();
    const filtered = domains.filter((d) => d !== normalized);
    await this.setWhitelistDomains(filtered);
  },

  // ==================== CHILD BACKGROUND ====================

  /**
   * Get selected background ID
   */
  async getChildBackground(): Promise<string> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.CHILD_BACKGROUND);
      return value || 'default';
    } catch {
      return 'default';
    }
  },

  /**
   * Set selected background ID
   */
  async setChildBackground(backgroundId: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CHILD_BACKGROUND, backgroundId);
  },

  /**
   * Get custom photo URI for background
   */
  async getChildBackgroundUri(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.CHILD_BACKGROUND_URI);
    } catch {
      return null;
    }
  },

  /**
   * Set custom photo URI for background
   */
  async setChildBackgroundUri(uri: string): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.CHILD_BACKGROUND_URI, uri);
  },

  // ==================== SCHEDULE ====================

  /**
   * Get schedule data
   */
  async getSchedule(): Promise<ScheduleData> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SCHEDULE);
      if (!json) return DEFAULT_SCHEDULE;

      return { ...DEFAULT_SCHEDULE, ...JSON.parse(json) };
    } catch {
      return DEFAULT_SCHEDULE;
    }
  },

  /**
   * Set schedule data
   */
  async setSchedule(schedule: ScheduleData): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SCHEDULE, JSON.stringify(schedule));
  },

  /**
   * Update schedule data
   */
  async updateSchedule(updates: Partial<ScheduleData>): Promise<ScheduleData> {
    const current = await this.getSchedule();
    const updated = { ...current, ...updates };
    await this.setSchedule(updated);
    return updated;
  },

  // ==================== HISTORY ====================

  /**
   * Get browsing history
   */
  async getHistory(): Promise<HistoryEntry[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY_ENTRIES);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Add entry to history
   */
  async addHistoryEntry(entry: Omit<HistoryEntry, 'id'>): Promise<void> {
    const history = await this.getHistory();

    // Normalize URL for comparison (remove trailing slash)
    const normalizeUrl = (url: string) => url.replace(/\/$/, '').toLowerCase();
    const normalizedNewUrl = normalizeUrl(entry.url);

    // De-duplication: Check if the last entry is for the same normalized URL
    const lastEntry = history[0];
    if (lastEntry) {
      const normalizedLastUrl = normalizeUrl(lastEntry.url);

      if (normalizedLastUrl === normalizedNewUrl) {
        const timeDiff = Date.now() - lastEntry.timestamp;

        // If same URL within 20 seconds, don't add a new one
        if (timeDiff < 20000) {
          // Update title if the new one is more descriptive
          const isBetterTitle = entry.title &&
            entry.title !== entry.url &&
            (lastEntry.title === lastEntry.url || !lastEntry.title);

          if (isBetterTitle) {
            lastEntry.title = entry.title;
            await AsyncStorage.setItem(STORAGE_KEYS.HISTORY_ENTRIES, JSON.stringify(history));
          }
          return;
        }
      }
    }

    const newEntry: HistoryEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    history.unshift(newEntry); // Add to beginning

    // Keep only last 1000 entries
    const trimmed = history.slice(0, 1000);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY_ENTRIES, JSON.stringify(trimmed));
  },

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY_ENTRIES, JSON.stringify([]));
  },

  /**
   * Get blocked attempts log
   */
  async getBlockedAttempts(): Promise<BlockedAttempt[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.BLOCKED_ATTEMPTS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Log a blocked attempt
   */
  async logBlockedAttempt(attempt: Omit<BlockedAttempt, 'id'>): Promise<void> {
    const attempts = await this.getBlockedAttempts();
    const newAttempt: BlockedAttempt = {
      ...attempt,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    attempts.unshift(newAttempt);

    // Keep only last 500 attempts
    const trimmed = attempts.slice(0, 500);
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_ATTEMPTS, JSON.stringify(trimmed));
  },

  /**
   * Clear blocked attempts log
   */
  async clearBlockedAttempts(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_ATTEMPTS, JSON.stringify([]));
  },

  // ==================== SUBSCRIPTION ====================

  /**
   * Get subscription state
   */
  async getSubscriptionState(): Promise<LocalSubscriptionState> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SUBSCRIPTION_STATE);
      if (!json) return DEFAULT_SUBSCRIPTION_STATE;
      return { ...DEFAULT_SUBSCRIPTION_STATE, ...JSON.parse(json) };
    } catch {
      return DEFAULT_SUBSCRIPTION_STATE;
    }
  },

  /**
   * Save subscription state
   */
  async setSubscriptionState(state: LocalSubscriptionState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SUBSCRIPTION_STATE, JSON.stringify(state));
  },

  /**
   * Update subscription state partially
   */
  async updateSubscriptionState(
    updates: Partial<LocalSubscriptionState>
  ): Promise<LocalSubscriptionState> {
    const current = await this.getSubscriptionState();
    const updated = { ...current, ...updates };
    await this.setSubscriptionState(updated);
    return updated;
  },

  /**
   * Clear subscription state (logout)
   */
  async clearSubscriptionState(): Promise<void> {
    await this.setSubscriptionState(DEFAULT_SUBSCRIPTION_STATE);
    // Also clear the auth token from secure storage
    try {
      await SecureStore.deleteItemAsync('auth.token');
    } catch {
      // Ignore errors
    }
  },

  /**
   * Save auth token securely
   */
  async saveAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync('auth.token', token);
  },

  /**
   * Get auth token from secure storage
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('auth.token');
    } catch {
      return null;
    }
  },

  /**
   * Delete auth token
   */
  async deleteAuthToken(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('auth.token');
    } catch {
      // Ignore errors
    }
  },

  // ==================== DEV / TESTING ====================

  /**
   * Get dev premium toggle state
   */
  async getDevPremium(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.DEV_PREMIUM);
      return value === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Set dev premium toggle state
   */
  async setDevPremium(enabled: boolean): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.DEV_PREMIUM, enabled ? 'true' : 'false');
  },

  // ==================== NOTES ====================

  /**
   * Get all notes
   */
  async getNotes(): Promise<NoteEntry[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.NOTES_ENTRIES);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Save a note (create or update)
   */
  async saveNote(note: NoteEntry): Promise<boolean> {
    const notes = await this.getNotes();
    const existingIndex = notes.findIndex(n => n.id === note.id);

    if (existingIndex >= 0) {
      notes[existingIndex] = { ...note, updatedAt: Date.now() };
    } else {
      if (notes.length >= MAX_NOTES) return false;
      notes.unshift(note);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.NOTES_ENTRIES, JSON.stringify(notes));
    return true;
  },

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<void> {
    const notes = await this.getNotes();
    const filtered = notes.filter(n => n.id !== id);
    await AsyncStorage.setItem(STORAGE_KEYS.NOTES_ENTRIES, JSON.stringify(filtered));
  },

  // ==================== QUIZ ====================

  /**
   * Get quiz best scores (key -> bestScore)
   * Keys are "categoryId_difficulty" (e.g. "prophets_easy")
   * Also supports legacy keys without difficulty for backward compatibility
   */
  async getQuizScores(): Promise<Record<string, number>> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_SCORES);
      if (!json) return {};
      return JSON.parse(json);
    } catch {
      return {};
    }
  },

  /**
   * Save quiz score if it's better than the previous best
   * Uses composite key "categoryId_difficulty"
   */
  async saveQuizScore(categoryId: string, score: number, total: number, difficulty?: string): Promise<void> {
    const scores = await this.getQuizScores();
    const percentage = Math.round((score / total) * 100);
    const key = difficulty ? `${categoryId}_${difficulty}` : categoryId;
    const currentBest = scores[key] || 0;
    if (percentage > currentBest) {
      scores[key] = percentage;
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_SCORES, JSON.stringify(scores));
    }
  },

  // ==================== QUIZ GAMIFICATION ====================

  async getQuizTotalXp(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_TOTAL_XP);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  async addQuizXp(amount: number): Promise<void> {
    const current = await this.getQuizTotalXp();
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_TOTAL_XP, String(current + amount));
  },

  async getQuizTotalCorrect(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_TOTAL_CORRECT);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  async addQuizCorrect(amount: number): Promise<void> {
    const current = await this.getQuizTotalCorrect();
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_TOTAL_CORRECT, String(current + amount));
  },

  async getQuizBestStreak(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_BEST_STREAK);
      return val ? parseInt(val, 10) : 0;
    } catch {
      return 0;
    }
  },

  async updateQuizBestStreak(streak: number): Promise<void> {
    const current = await this.getQuizBestStreak();
    if (streak > current) {
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_BEST_STREAK, String(streak));
    }
  },

  async getQuizBadges(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_BADGES);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  /** Returns true if the badge was newly unlocked */
  async unlockQuizBadge(badgeId: string): Promise<boolean> {
    const badges = await this.getQuizBadges();
    if (badges.includes(badgeId)) return false;
    badges.push(badgeId);
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_BADGES, JSON.stringify(badges));
    return true;
  },

  async getQuizPerfectCount(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_PERFECT_COUNT);
      return val ? parseInt(val, 10) : 0;
    } catch { return 0; }
  },

  async incrementQuizPerfectCount(): Promise<number> {
    const current = await this.getQuizPerfectCount();
    const next = current + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_PERFECT_COUNT, String(next));
    return next;
  },

  async getQuizHardPerfectCount(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_HARD_PERFECT_COUNT);
      return val ? parseInt(val, 10) : 0;
    } catch { return 0; }
  },

  async incrementQuizHardPerfectCount(): Promise<number> {
    const current = await this.getQuizHardPerfectCount();
    const next = current + 1;
    await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_HARD_PERFECT_COUNT, String(next));
    return next;
  },

  async getQuizCategoriesPlayed(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.QUIZ_CATEGORIES_PLAYED);
      return json ? JSON.parse(json) : [];
    } catch { return []; }
  },

  async addQuizCategoryPlayed(categoryId: string): Promise<string[]> {
    const played = await this.getQuizCategoriesPlayed();
    if (!played.includes(categoryId)) {
      played.push(categoryId);
      await AsyncStorage.setItem(STORAGE_KEYS.QUIZ_CATEGORIES_PLAYED, JSON.stringify(played));
    }
    return played;
  },

  // ==================== PEDOMETER ====================

  async getPedometerData(): Promise<PedometerData> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.PEDOMETER_DATA);
      if (!json) return DEFAULT_PEDOMETER_DATA;
      return { ...DEFAULT_PEDOMETER_DATA, ...JSON.parse(json) };
    } catch {
      return DEFAULT_PEDOMETER_DATA;
    }
  },

  async setPedometerData(data: PedometerData): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.PEDOMETER_DATA, JSON.stringify(data));
  },

  // ==================== EMOTIONS ====================

  async getEmotionEntries(): Promise<EmotionEntry[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.EMOTION_ENTRIES);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  async addEmotionEntry(emotionId: string): Promise<void> {
    const entries = await this.getEmotionEntries();
    const newEntry: EmotionEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      emotionId,
      timestamp: Date.now(),
    };
    entries.unshift(newEntry);
    const trimmed = entries.slice(0, MAX_EMOTION_ENTRIES);
    await AsyncStorage.setItem(STORAGE_KEYS.EMOTION_ENTRIES, JSON.stringify(trimmed));
  },

  // ==================== FAVORITE VIDEOS ====================

  /**
   * Get favorite video IDs
   */
  async getFavoriteVideos(): Promise<number[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_VIDEOS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Add a video to favorites
   */
  async addFavoriteVideo(videoId: number): Promise<void> {
    const favorites = await this.getFavoriteVideos();
    if (!favorites.includes(videoId)) {
      favorites.push(videoId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_VIDEOS, JSON.stringify(favorites));
    }
  },

  /**
   * Remove a video from favorites
   */
  async removeFavoriteVideo(videoId: number): Promise<void> {
    const favorites = await this.getFavoriteVideos();
    const filtered = favorites.filter(id => id !== videoId);
    await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_VIDEOS, JSON.stringify(filtered));
  },

  /**
   * Toggle favorite status for a video
   */
  async toggleFavoriteVideo(videoId: number): Promise<boolean> {
    const favorites = await this.getFavoriteVideos();
    const isFavorite = favorites.includes(videoId);

    if (isFavorite) {
      await this.removeFavoriteVideo(videoId);
      return false;
    } else {
      await this.addFavoriteVideo(videoId);
      return true;
    }
  },


  // ==================== CUSTOM VIDEOS ====================

  /**
   * Get custom videos added by parents
   */
  async getCustomVideos(): Promise<LocalVideo[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_VIDEOS);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Add a custom video
   */
  async addCustomVideo(video: LocalVideo): Promise<{ success: boolean; error?: string }> {
    try {
      const videos = await this.getCustomVideos();

      // Limit is checked in the UI (premium-aware), not here

      // Check for duplicates
      if (videos.some(v => v.youtubeId === video.youtubeId)) {
        return { success: false, error: 'duplicate' };
      }

      videos.unshift(video); // Add to beginning
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_VIDEOS, JSON.stringify(videos));
      return { success: true };
    } catch (error) {
      return { success: false, error: 'storage_error' };
    }
  },

  /**
   * Remove a custom video
   */
  async removeCustomVideo(videoId: string): Promise<void> {
    const videos = await this.getCustomVideos();
    const filtered = videos.filter(v => v.id !== videoId);
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_VIDEOS, JSON.stringify(filtered));
  },

  // ==================== VIDEO WATCH TIME ====================

  /**
   * Get today's video watch time in seconds.
   * Resets automatically if the stored date is not today.
   */
  async getVideoWatchTime(): Promise<number> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.VIDEO_WATCH_TIME);
      if (!json) return 0;
      const data = JSON.parse(json);
      const today = new Date().toDateString();
      if (data.date !== today) return 0; // New day, reset
      return data.seconds || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Add seconds to today's video watch time.
   */
  async addVideoWatchTime(seconds: number): Promise<number> {
    const today = new Date().toDateString();
    const current = await this.getVideoWatchTime();
    const updated = current + seconds;
    await AsyncStorage.setItem(
      STORAGE_KEYS.VIDEO_WATCH_TIME,
      JSON.stringify({ date: today, seconds: updated })
    );
    return updated;
  },

  // ==================== RECOVERY (Master Key + Security Question) ====================

  /**
   * Save master key hash (encrypted with SecureStore)
   */
  async saveMasterKeyHash(hash: string): Promise<void> {
    await SecureStore.setItemAsync('recovery.masterkey.hash', hash);
  },

  /**
   * Get master key hash
   */
  async getMasterKeyHash(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('recovery.masterkey.hash');
    } catch {
      return null;
    }
  },

  /**
   * Save master key salt
   */
  async saveMasterKeySalt(salt: string): Promise<void> {
    await SecureStore.setItemAsync('recovery.masterkey.salt', salt);
  },

  /**
   * Get master key salt
   */
  async getMasterKeySalt(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('recovery.masterkey.salt');
    } catch {
      return null;
    }
  },

  /**
   * Save security question index
   */
  async saveSecurityQuestionIndex(index: number): Promise<void> {
    await SecureStore.setItemAsync('recovery.question.index', String(index));
  },

  /**
   * Get security question index
   */
  async getSecurityQuestionIndex(): Promise<number | null> {
    try {
      const val = await SecureStore.getItemAsync('recovery.question.index');
      return val !== null ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  },

  /**
   * Save security answer hash (encrypted with SecureStore)
   */
  async saveSecurityAnswerHash(hash: string): Promise<void> {
    await SecureStore.setItemAsync('recovery.answer.hash', hash);
  },

  /**
   * Get security answer hash
   */
  async getSecurityAnswerHash(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('recovery.answer.hash');
    } catch {
      return null;
    }
  },

  /**
   * Save security answer salt
   */
  async saveSecurityAnswerSalt(salt: string): Promise<void> {
    await SecureStore.setItemAsync('recovery.answer.salt', salt);
  },

  /**
   * Get security answer salt
   */
  async getSecurityAnswerSalt(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync('recovery.answer.salt');
    } catch {
      return null;
    }
  },

  /**
   * Check if recovery is set up
   */
  async hasRecoverySetup(): Promise<boolean> {
    const mkHash = await this.getMasterKeyHash();
    const ansHash = await this.getSecurityAnswerHash();
    return !!mkHash && !!ansHash;
  },

  /**
   * Get recovery lockout state
   */
  async getRecoveryLockoutState(): Promise<RecoveryLockoutState> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.RECOVERY_LOCKOUT);
      if (!json) return DEFAULT_RECOVERY_LOCKOUT_STATE;
      return { ...DEFAULT_RECOVERY_LOCKOUT_STATE, ...JSON.parse(json) };
    } catch {
      return DEFAULT_RECOVERY_LOCKOUT_STATE;
    }
  },

  /**
   * Save recovery lockout state
   */
  async setRecoveryLockoutState(state: RecoveryLockoutState): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.RECOVERY_LOCKOUT, JSON.stringify(state));
  },

  /**
   * Reset recovery lockout
   */
  async resetRecoveryLockout(): Promise<void> {
    await this.setRecoveryLockoutState(DEFAULT_RECOVERY_LOCKOUT_STATE);
  },

  // ==================== UTILITY ====================

  /**
   * Reset all data (factory reset)
   */
  async resetAll(): Promise<void> {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync('pin.hash');
    await SecureStore.deleteItemAsync('pin.salt');
    await SecureStore.deleteItemAsync('auth.token');
    await SecureStore.deleteItemAsync('recovery.masterkey.hash');
    await SecureStore.deleteItemAsync('recovery.masterkey.salt');
    await SecureStore.deleteItemAsync('recovery.question.index');
    await SecureStore.deleteItemAsync('recovery.answer.hash');
    await SecureStore.deleteItemAsync('recovery.answer.salt');
  },

  /**
   * Clean up old history entries (older than 30 days)
   */
  async cleanupOldHistory(): Promise<void> {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

    // Clean history
    const history = await this.getHistory();
    const filteredHistory = history.filter((h) => h.timestamp > thirtyDaysAgo);
    await AsyncStorage.setItem(STORAGE_KEYS.HISTORY_ENTRIES, JSON.stringify(filteredHistory));

    // Clean blocked attempts
    const attempts = await this.getBlockedAttempts();
    const filteredAttempts = attempts.filter((a) => a.timestamp > thirtyDaysAgo);
    await AsyncStorage.setItem(STORAGE_KEYS.BLOCKED_ATTEMPTS, JSON.stringify(filteredAttempts));
  },
};

export default StorageService;
