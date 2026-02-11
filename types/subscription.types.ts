/**
 * Subscription Types for MuslimGuard Premium
 * Defines all types related to user accounts and premium subscriptions
 */

// =============================================================================
// SUBSCRIPTION STATUS & PLANS
// =============================================================================

/** Subscription status from backend (Stripe/Google Play) */
export type SubscriptionStatus = 'active' | 'trialing' | 'canceled' | 'past_due' | 'none';

/** Subscription plan identifiers */
export type SubscriptionPlan = 'monthly' | 'annual' | 'none';

/** Payment source */
export type PaymentSource = 'stripe' | 'google_play' | 'none';

// =============================================================================
// GOOGLE PLAY PRODUCTS
// =============================================================================

/** Google Play product IDs */
export const GOOGLE_PLAY_PRODUCTS = {
  monthly: 'muslimguard_monthly',
  annual: 'muslimguard_annual',
} as const;

export type GooglePlayProductId = typeof GOOGLE_PLAY_PRODUCTS[keyof typeof GOOGLE_PLAY_PRODUCTS];

// =============================================================================
// PREMIUM FEATURES
// =============================================================================

/** Features that require premium subscription */
export type PremiumFeature =
  | 'strict_mode'           // Whitelist mode - only allow approved sites
  | 'unlimited_domains'     // More than 50 blocked domains
  | 'kiosk_mode'           // Screen pinning
  | 'extended_history'      // 90 days instead of 7
  | 'schedule_restrictions' // Time-based access
  | 'multi_child';          // Future feature - multiple child profiles

/** Feature limits for free tier */
export const FREE_TIER_LIMITS = {
  maxBlockedDomains: 50,
  historyDays: 7,
} as const;

/** Feature limits for premium tier */
export const PREMIUM_TIER_LIMITS = {
  maxBlockedDomains: Infinity,
  historyDays: 90,
} as const;

/** French labels for premium features */
export const PREMIUM_FEATURE_LABELS: Record<PremiumFeature, string> = {
  strict_mode: 'Mode strict (liste blanche)',
  unlimited_domains: 'Domaines illimités',
  kiosk_mode: 'Mode kiosque',
  extended_history: 'Historique étendu (90 jours)',
  schedule_restrictions: 'Restrictions horaires',
  multi_child: 'Multi-enfants',
};

// =============================================================================
// USER & AUTHENTICATION
// =============================================================================

/** User info from backend */
export interface UserInfo {
  id: number;
  email: string;
  name?: string;
}

/** Authentication response from backend */
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: UserInfo;
  subscription?: SubscriptionInfo;
  error?: string;
}

/** Subscription info from backend */
export interface SubscriptionInfo {
  isPremium: boolean;
  status: SubscriptionStatus;
  planName: string;
  plan?: SubscriptionPlan;
  expiresAt?: number | null; // Unix timestamp
  source?: PaymentSource;
  willRenew?: boolean;
}

// =============================================================================
// LOCAL STORAGE STATE
// =============================================================================

/** Local subscription state (stored in AsyncStorage) */
export interface LocalSubscriptionState {
  // User account (optional - app works without)
  isLoggedIn: boolean;
  user: UserInfo | null;
  token: string | null;
  tokenExpiresAt: number | null;

  // Subscription status
  isPremium: boolean;
  subscription: SubscriptionInfo | null;

  // Google Play specific
  googlePlayPurchaseToken: string | null;

  // Verification
  lastVerificationTimestamp: number | null;
}

/** Default state for new/logged out users */
export const DEFAULT_SUBSCRIPTION_STATE: LocalSubscriptionState = {
  isLoggedIn: false,
  user: null,
  token: null,
  tokenExpiresAt: null,
  isPremium: false,
  subscription: null,
  googlePlayPurchaseToken: null,
  lastVerificationTimestamp: null,
};

// =============================================================================
// BILLING & PURCHASE
// =============================================================================

/** Google Play product info */
export interface ProductInfo {
  productId: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  priceAmountMicros: string;
  subscriptionPeriod: string;
}

/** Purchase result */
export interface PurchaseResult {
  success: boolean;
  purchaseToken?: string;
  error?: string;
}

/** Validate purchase response from backend */
export interface ValidatePurchaseResponse {
  success: boolean;
  subscription?: SubscriptionInfo;
  error?: string;
}

// =============================================================================
// API TYPES
// =============================================================================

/** API error response */
export interface ApiError {
  code: string;
  message: string;
}

/** Login request body */
export interface LoginRequest {
  email: string;
  password: string;
  deviceName?: string;
  deviceId?: string;
  platform?: string;
  appVersion?: string;
}

/** Validate purchase request body */
export interface ValidatePurchaseRequest {
  platform: 'android' | 'ios';
  purchaseToken: string;
  productId: string;
}
