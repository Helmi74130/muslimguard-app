/**
 * Storage Schema Types for MuslimGuard
 * Defines the structure of all data stored in MMKV
 */

// App mode
export type AppMode = 'child' | 'parent';

// City coordinates for prayer times
export interface CityCoordinates {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// App settings stored in MMKV
export interface AppSettings {
  isOnboardingComplete: boolean;
  currentMode: AppMode;
  pinHash: string;
  pinSalt: string;
  city: CityCoordinates | null;
  prayerMethod: number; // Adhan calculation method ID
  autoPauseDuringPrayer: boolean;
  pauseDurationMinutes: number;
  notificationsEnabled: boolean;
  prayerNotificationsEnabled: boolean;
  blockedNotificationsEnabled: boolean;
  launcherModeEnabled: boolean;
  scheduleEnabled: boolean;
  kioskModeEnabled: boolean;
  kioskHideStatusBar: boolean;
  strictModeEnabled: boolean; // Whitelist mode - only allow approved sites
  childBackground: string; // Background ID for child home screen
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  isOnboardingComplete: false,
  currentMode: 'child',
  pinHash: '',
  pinSalt: '',
  city: null,
  prayerMethod: 12, // France (UOIF) - default method
  autoPauseDuringPrayer: true,
  pauseDurationMinutes: 15,
  notificationsEnabled: true,
  prayerNotificationsEnabled: true,
  blockedNotificationsEnabled: false,
  launcherModeEnabled: false,
  scheduleEnabled: false,
  kioskModeEnabled: false,
  kioskHideStatusBar: true,
  strictModeEnabled: false, // Whitelist mode disabled by default
  childBackground: 'default', // Default background
};

// Blocklist data
export interface BlocklistData {
  domains: string[];
  keywords: string[];
}

// Schedule rule for time restrictions
export interface ScheduleRule {
  id: string;
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // "HH:mm" format
  endTime: string; // "HH:mm" format
  isAllowed: boolean; // true = allowed during this time, false = blocked
}

// Schedule data
export interface ScheduleData {
  enabled: boolean;
  rules: ScheduleRule[];
  temporaryOverride: boolean;
  overrideExpiresAt: number | null; // Timestamp
}

// Default schedule (all allowed)
export const DEFAULT_SCHEDULE: ScheduleData = {
  enabled: false,
  rules: [],
  temporaryOverride: false,
  overrideExpiresAt: null,
};

// History entry for visited pages
export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  timestamp: number;
  wasBlocked: boolean;
  blockReason?: 'domain' | 'keyword' | 'prayer' | 'schedule' | 'whitelist';
  blockedBy?: string; // The specific domain or keyword that caused the block
}

// Blocked attempt log entry
export interface BlockedAttempt {
  id: string;
  url: string;
  timestamp: number;
  reason: 'domain' | 'keyword' | 'prayer' | 'schedule' | 'whitelist';
  blockedBy: string;
}

// PIN lockout state
export interface PinLockoutState {
  failedAttempts: number;
  lastFailedAttempt: number | null;
  lockedUntil: number | null;
}

// Default lockout state
export const DEFAULT_LOCKOUT_STATE: PinLockoutState = {
  failedAttempts: 0,
  lastFailedAttempt: null,
  lockedUntil: null,
};

// Storage keys enum for type safety
export const STORAGE_KEYS = {
  // Settings
  SETTINGS: 'settings',

  // Blocklist
  BLOCKLIST_DOMAINS: 'blocklist.domains',
  BLOCKLIST_KEYWORDS: 'blocklist.keywords',

  // Whitelist (strict mode)
  WHITELIST_DOMAINS: 'whitelist.domains',

  // Schedule
  SCHEDULE: 'schedule',

  // History
  HISTORY_ENTRIES: 'history.entries',
  BLOCKED_ATTEMPTS: 'history.blockedAttempts',

  // Auth
  PIN_LOCKOUT: 'auth.lockout',

  // Prayer cache
  PRAYER_CACHE: 'cache.prayerData',
  PRAYER_CACHE_METADATA: 'cache.metadata',

  // Child preferences
  CHILD_BACKGROUND: 'child.background',

  // Subscription & Account
  SUBSCRIPTION_STATE: 'subscription.state',
} as const;

// Prayer time names
export type PrayerName = 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

// Prayer times for a day
export interface DailyPrayerTimes {
  date: string; // YYYY-MM-DD
  fajr: string; // HH:mm
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

// Prayer calculation methods (AlAdhan API)
// France first, then alphabetically by country
export const PRAYER_METHODS = {
  12: 'France (UOIF)',
  19: 'Algérie',
  4: 'Arabie Saoudite (Umm Al-Qura)',
  5: 'Égypte',
  3: 'Europe (Ligue Islamique Mondiale)',
  21: 'Maroc',
  18: 'Tunisie',
  2: 'USA (ISNA)',
} as const;

export type PrayerMethodId = keyof typeof PRAYER_METHODS;

// Ordered array of method IDs for UI display (France first)
export const PRAYER_METHODS_ORDER: PrayerMethodId[] = [12, 19, 4, 5, 3, 21, 18, 2];

// Hijri date info from AlAdhan API
export interface HijriDateInfo {
  day: number;
  month: number;
  year: number;
  monthNameAr: string;
  monthNameEn: string;
  formatted: string; // "9 شَعْبَان 1447 H"
}
