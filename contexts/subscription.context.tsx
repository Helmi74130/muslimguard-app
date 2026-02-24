/**
 * Subscription Context for MuslimGuard
 * Manages premium subscription state globally
 */

import { ApiService } from '@/services/api.service';
import { BillingService } from '@/services/billing.service';
import { StorageService } from '@/services/storage.service';
import {
  DEFAULT_SUBSCRIPTION_STATE,
  FREE_TIER_LIMITS,
  GOOGLE_PLAY_PRODUCTS,
  LocalSubscriptionState,
  PREMIUM_TIER_LIMITS,
  PremiumFeature,
  ProductInfo,
  SubscriptionInfo,
  UserInfo,
} from '@/types/subscription.types';
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

// =============================================================================
// CONTEXT TYPE
// =============================================================================

interface SubscriptionContextType {
  // State
  isLoggedIn: boolean;
  isPremium: boolean;
  user: UserInfo | null;
  subscription: SubscriptionInfo | null;
  isLoading: boolean;

  // Dev mode (for testing without Google Play)
  isDevPremium: boolean;
  setDevPremium: (enabled: boolean) => Promise<void>;

  // Products (Google Play Billing)
  products: ProductInfo[];
  productsLoading: boolean;

  // Feature checking
  hasFeature: (feature: PremiumFeature) => boolean;
  getLimit: (key: 'maxBlockedDomains' | 'maxCustomVideos' | 'historyDays' | 'maxVideoDailyMinutes' | 'maxCustomDomains' | 'maxCustomKeywords') => number;

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;

  // Purchase actions (connected to BillingService)
  loadProducts: () => Promise<void>;
  purchaseMonthly: () => Promise<{ success: boolean; error?: string }>;
  purchaseAnnual: () => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
}

// =============================================================================
// CONTEXT
// =============================================================================

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// =============================================================================
// PROVIDER
// =============================================================================

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const [state, setState] = useState<LocalSubscriptionState>(DEFAULT_SUBSCRIPTION_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isDevPremium, setIsDevPremiumState] = useState(false);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  useEffect(() => {
    const loadState = async () => {
      try {
        // Load saved state from storage
        const savedState = await StorageService.getSubscriptionState();
        setState(savedState);

        // Load dev premium toggle state
        const devPremium = await StorageService.getDevPremium();
        setIsDevPremiumState(devPremium);

        // If logged in, verify token is still valid
        if (savedState.isLoggedIn && savedState.token) {
          const result = await ApiService.verifyToken();

          if (result.success && result.user) {
            // Token is valid - update state with fresh data
            const isPremium =
              result.subscription?.isPremium ||
              result.subscription?.status === 'active' ||
              result.subscription?.status === 'trialing';

            const updatedState = await StorageService.updateSubscriptionState({
              user: result.user,
              subscription: result.subscription || null,
              isPremium: isPremium || false,
              lastVerificationTimestamp: Date.now(),
            });
            setState(updatedState);
          } else {
            // Token expired or invalid - clear state
            console.log('[SubscriptionContext] Token invalid, clearing state');
            await StorageService.clearSubscriptionState();
            setState(DEFAULT_SUBSCRIPTION_STATE);
          }
        }

        // Initialize billing connection
        await BillingService.initialize();
      } catch (error) {
        console.error('[SubscriptionContext] Error loading state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();

    // Cleanup billing on unmount
    return () => {
      BillingService.cleanup();
    };
  }, []);

  // ==========================================================================
  // FEATURE CHECKING
  // ==========================================================================

  // Effective premium status (real OR dev toggle)
  const effectivePremium = state.isPremium || isDevPremium;

  /**
   * Check if user has access to a specific feature
   */
  const hasFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      // Premium users (real or dev) have all features
      if (effectivePremium) return true;

      // Free tier has no premium features
      return false;
    },
    [effectivePremium]
  );

  /**
   * Get limit based on subscription tier
   */
  const getLimit = useCallback(
    (key: 'maxBlockedDomains' | 'maxCustomVideos' | 'historyDays' | 'maxVideoDailyMinutes' | 'maxCustomDomains' | 'maxCustomKeywords'): number => {
      if (effectivePremium) {
        return PREMIUM_TIER_LIMITS[key];
      }
      return FREE_TIER_LIMITS[key];
    },
    [effectivePremium]
  );

  /**
   * Toggle dev premium mode (for testing)
   */
  const setDevPremium = useCallback(async (enabled: boolean): Promise<void> => {
    await StorageService.setDevPremium(enabled);
    setIsDevPremiumState(enabled);
    console.log('[SubscriptionContext] Dev premium:', enabled);
  }, []);

  // ==========================================================================
  // AUTH ACTIONS
  // ==========================================================================

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await ApiService.login(email, password);

        if (result.success && result.user) {
          const isPremium =
            result.subscription?.isPremium ||
            result.subscription?.status === 'active' ||
            result.subscription?.status === 'trialing';

          const newState = await StorageService.updateSubscriptionState({
            isLoggedIn: true,
            user: result.user,
            token: result.token || null,
            subscription: result.subscription || null,
            isPremium: isPremium || false,
            lastVerificationTimestamp: Date.now(),
          });
          setState(newState);
          return { success: true };
        }

        return { success: false, error: result.error || 'Erreur de connexion' };
      } catch (error) {
        console.error('[SubscriptionContext] Login error:', error);
        return { success: false, error: 'Erreur de connexion' };
      }
    },
    []
  );

  /**
   * Logout
   */
  const logout = useCallback(async (): Promise<void> => {
    await ApiService.logout();
    await StorageService.clearSubscriptionState();
    setState(DEFAULT_SUBSCRIPTION_STATE);
  }, []);

  /**
   * Refresh subscription status from backend
   */
  const refreshSubscription = useCallback(async (): Promise<void> => {
    if (!state.isLoggedIn) return;

    try {
      const result = await ApiService.verifyToken();

      if (result.success && result.user) {
        const isPremium =
          result.subscription?.isPremium ||
          result.subscription?.status === 'active' ||
          result.subscription?.status === 'trialing';

        const updatedState = await StorageService.updateSubscriptionState({
          user: result.user,
          subscription: result.subscription || null,
          isPremium: isPremium || false,
          lastVerificationTimestamp: Date.now(),
        });
        setState(updatedState);
      }
    } catch (error) {
      console.error('[SubscriptionContext] Refresh error:', error);
    }
  }, [state.isLoggedIn]);

  // ==========================================================================
  // PURCHASE ACTIONS (connected to BillingService)
  // ==========================================================================

  /**
   * Activate premium locally after a verified purchase
   */
  const activatePremiumLocally = useCallback(async (
    productId: string,
    purchaseToken?: string
  ): Promise<void> => {
    const plan = productId === GOOGLE_PLAY_PRODUCTS.annual ? 'annual' : 'monthly';
    const subscriptionInfo: SubscriptionInfo = {
      isPremium: true,
      status: 'active',
      planName: plan === 'annual' ? 'Annuel' : 'Mensuel',
      plan: plan as any,
      source: 'google_play',
      willRenew: true,
    };

    const updatedState = await StorageService.updateSubscriptionState({
      isPremium: true,
      subscription: subscriptionInfo,
      googlePlayPurchaseToken: purchaseToken || null,
      lastVerificationTimestamp: Date.now(),
    });
    setState(updatedState);
    console.log('[SubscriptionContext] Premium activated locally for:', productId);
  }, []);

  /**
   * Load available products from Google Play
   */
  const loadProducts = useCallback(async (): Promise<void> => {
    setProductsLoading(true);
    try {
      const prods = await BillingService.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error('[SubscriptionContext] Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  /**
   * Purchase a subscription by product ID
   */
  const purchaseSubscription = useCallback(async (
    productId: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!BillingService.isNativeAvailable()) {
      return { success: false, error: 'Achats in-app non disponibles. Nécessite un build natif.' };
    }

    const result = await BillingService.purchaseSubscription(productId);
    // Note: actual success is handled by the purchase listener set up in PremiumScreen
    return result;
  }, []);

  /**
   * Purchase monthly subscription
   */
  const purchaseMonthly = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return purchaseSubscription(GOOGLE_PLAY_PRODUCTS.monthly);
  }, [purchaseSubscription]);

  /**
   * Purchase annual subscription
   */
  const purchaseAnnual = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    return purchaseSubscription(GOOGLE_PLAY_PRODUCTS.annual);
  }, [purchaseSubscription]);

  /**
   * Restore purchases from Google Play
   */
  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!BillingService.isNativeAvailable()) {
      return { success: false, error: 'Non disponible en mode développement.' };
    }

    try {
      const purchases = await BillingService.restorePurchases();

      if (purchases.length === 0) {
        return { success: false, error: 'Aucun achat trouvé à restaurer.' };
      }

      // Try to validate with backend first
      const latest = purchases[0];
      if (latest.purchaseToken) {
        const backendResult = await BillingService.validateAndActivate(
          latest.purchaseToken,
          latest.productId
        );

        if (backendResult.success) {
          await refreshSubscription();
          return { success: true };
        }

        // Backend validation failed - activate locally since Google Play confirmed the purchase
        console.log('[SubscriptionContext] Backend validation failed, activating locally');
        await activatePremiumLocally(latest.productId, latest.purchaseToken);
        return { success: true };
      }

      return { success: false, error: 'Achat invalide.' };
    } catch (error) {
      console.error('[SubscriptionContext] Restore error:', error);
      return { success: false, error: 'Erreur lors de la restauration.' };
    }
  }, [refreshSubscription, activatePremiumLocally]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value: SubscriptionContextType = {
    // State
    isLoggedIn: state.isLoggedIn,
    isPremium: effectivePremium,
    user: state.user,
    subscription: state.subscription,
    isLoading,

    // Dev mode
    isDevPremium,
    setDevPremium,

    // Products
    products,
    productsLoading,

    // Feature checking
    hasFeature,
    getLimit,

    // Auth actions
    login,
    logout,
    refreshSubscription,

    // Purchase actions
    loadProducts,
    purchaseMonthly,
    purchaseAnnual,
    restorePurchases,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

export default SubscriptionContext;
