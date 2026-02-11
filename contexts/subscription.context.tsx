/**
 * Subscription Context for MuslimGuard
 * Manages premium subscription state globally
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { StorageService } from '@/services/storage.service';
import { ApiService } from '@/services/api.service';
import {
  LocalSubscriptionState,
  DEFAULT_SUBSCRIPTION_STATE,
  SubscriptionInfo,
  UserInfo,
  PremiumFeature,
  FREE_TIER_LIMITS,
  PREMIUM_TIER_LIMITS,
  ProductInfo,
} from '@/types/subscription.types';

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

  // Products (for Google Play Billing - will be implemented in billing.service.ts)
  products: ProductInfo[];
  productsLoading: boolean;

  // Feature checking
  hasFeature: (feature: PremiumFeature) => boolean;
  getLimit: (key: 'maxBlockedDomains' | 'historyDays') => number;

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;

  // Purchase actions (stubs for now - will connect to billing.service.ts)
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
      } catch (error) {
        console.error('[SubscriptionContext] Error loading state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  // ==========================================================================
  // FEATURE CHECKING
  // ==========================================================================

  /**
   * Check if user has access to a specific feature
   */
  const hasFeature = useCallback(
    (feature: PremiumFeature): boolean => {
      // Premium users have all features
      if (state.isPremium) return true;

      // Free tier has no premium features
      return false;
    },
    [state.isPremium]
  );

  /**
   * Get limit based on subscription tier
   */
  const getLimit = useCallback(
    (key: 'maxBlockedDomains' | 'historyDays'): number => {
      if (state.isPremium) {
        return PREMIUM_TIER_LIMITS[key];
      }
      return FREE_TIER_LIMITS[key];
    },
    [state.isPremium]
  );

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
  // PURCHASE ACTIONS (STUBS - Will be implemented with billing.service.ts)
  // ==========================================================================

  /**
   * Load available products from Google Play
   */
  const loadProducts = useCallback(async (): Promise<void> => {
    setProductsLoading(true);
    try {
      // TODO: Connect to BillingService.getProducts() when implemented
      // For now, return empty array
      setProducts([]);
    } catch (error) {
      console.error('[SubscriptionContext] Error loading products:', error);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  /**
   * Purchase monthly subscription
   */
  const purchaseMonthly = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.isLoggedIn) {
      return { success: false, error: "Veuillez vous connecter d'abord" };
    }

    // TODO: Connect to BillingService.purchaseSubscription('muslimguard_monthly')
    return { success: false, error: 'Google Play Billing non configuré' };
  }, [state.isLoggedIn]);

  /**
   * Purchase annual subscription
   */
  const purchaseAnnual = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.isLoggedIn) {
      return { success: false, error: "Veuillez vous connecter d'abord" };
    }

    // TODO: Connect to BillingService.purchaseSubscription('muslimguard_annual')
    return { success: false, error: 'Google Play Billing non configuré' };
  }, [state.isLoggedIn]);

  /**
   * Restore purchases
   */
  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.isLoggedIn) {
      return { success: false, error: "Veuillez vous connecter d'abord" };
    }

    // TODO: Connect to BillingService.restorePurchases()
    return { success: false, error: 'Google Play Billing non configuré' };
  }, [state.isLoggedIn]);

  // ==========================================================================
  // CONTEXT VALUE
  // ==========================================================================

  const value: SubscriptionContextType = {
    // State
    isLoggedIn: state.isLoggedIn,
    isPremium: state.isPremium,
    user: state.user,
    subscription: state.subscription,
    isLoading,

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
