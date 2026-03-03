/**
 * Screen Time Service for MuslimGuard
 * Tracks per-page usage time with 7-day history
 */

import { ScreenTimeEntry, STORAGE_KEYS } from '@/types/storage.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX_DAYS = 7;

/** Map sub-pages to their parent page for grouping */
const PAGE_GROUP_MAP: Record<string, string> = {
  'quiz-play': 'quiz',
  'quiz-result': 'quiz',
  'quiz-difficulty': 'quiz',
  'note-edit': 'notes',
  'anger-release': 'emotions',
  'cold-reset': 'emotions',
  'cardiac-metronome': 'emotions',
  'screen-time-limit': '_system', // Don't count the limit screen itself
  'blocked': '_system',
};

function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function normalizePageId(rawPageId: string): string {
  // Remove /child/ prefix if present
  const cleaned = rawPageId.replace(/^\/child\//, '').replace(/^\//, '');
  return PAGE_GROUP_MAP[cleaned] || cleaned;
}

export const ScreenTimeService = {
  /**
   * Get all screen time entries (up to 7 days)
   */
  async getScreenTimeData(): Promise<ScreenTimeEntry[]> {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEYS.SCREEN_TIME_DATA);
      if (!json) return [];
      return JSON.parse(json);
    } catch {
      return [];
    }
  },

  /**
   * Get today's screen time entry
   */
  async getTodayScreenTime(): Promise<ScreenTimeEntry> {
    const data = await this.getScreenTimeData();
    const today = getTodayDateString();
    return data.find(e => e.date === today) || { date: today, pages: {}, totalSeconds: 0 };
  },

  /**
   * Get today's total seconds (for limit comparison)
   */
  async getTodayTotalSeconds(): Promise<number> {
    const entry = await this.getTodayScreenTime();
    return entry.totalSeconds;
  },

  /**
   * Add time for a specific page
   */
  async addTime(rawPageId: string, seconds: number): Promise<void> {
    if (seconds <= 0) return;

    const pageId = normalizePageId(rawPageId);
    if (pageId === '_system') return; // Don't track system screens

    const data = await this.getScreenTimeData();
    const today = getTodayDateString();

    let todayEntry = data.find(e => e.date === today);
    if (!todayEntry) {
      todayEntry = { date: today, pages: {}, totalSeconds: 0 };
      data.unshift(todayEntry);
    }

    todayEntry.pages[pageId] = (todayEntry.pages[pageId] || 0) + seconds;
    todayEntry.totalSeconds += seconds;

    // Keep only last MAX_DAYS entries
    const trimmed = data.slice(0, MAX_DAYS);
    await AsyncStorage.setItem(STORAGE_KEYS.SCREEN_TIME_DATA, JSON.stringify(trimmed));
  },

  /**
   * Get screen time data for the last N days (filled with zeros for missing days)
   */
  async getWeekData(): Promise<ScreenTimeEntry[]> {
    const data = await this.getScreenTimeData();
    const result: ScreenTimeEntry[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const existing = data.find(e => e.date === dateStr);
      result.push(existing || { date: dateStr, pages: {}, totalSeconds: 0 });
    }

    return result;
  },

  /**
   * Clean up entries older than 7 days
   */
  async cleanupOldEntries(): Promise<void> {
    const data = await this.getScreenTimeData();
    if (data.length <= MAX_DAYS) return;
    const trimmed = data.slice(0, MAX_DAYS);
    await AsyncStorage.setItem(STORAGE_KEYS.SCREEN_TIME_DATA, JSON.stringify(trimmed));
  },
};

export default ScreenTimeService;
