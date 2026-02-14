/**
 * Storage Service for MuslimGuard
 * AsyncStorage + SecureStore wrapper for local data storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import {
  AppSettings,
  BlocklistData,
  ScheduleData,
  HistoryEntry,
  BlockedAttempt,
  PinLockoutState,
  NoteEntry,
  MAX_NOTES,
  DEFAULT_SETTINGS,
  DEFAULT_SCHEDULE,
  DEFAULT_LOCKOUT_STATE,
  STORAGE_KEYS,
} from '@/types/storage.types';
import {
  LocalSubscriptionState,
  DEFAULT_SUBSCRIPTION_STATE,
} from '@/types/subscription.types';

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

  // ==================== UTILITY ====================

  /**
   * Reset all data (factory reset)
   */
  async resetAll(): Promise<void> {
    await AsyncStorage.clear();
    await SecureStore.deleteItemAsync('pin.hash');
    await SecureStore.deleteItemAsync('pin.salt');
    await SecureStore.deleteItemAsync('auth.token');
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
