/**
 * Billing Service for MuslimGuard
 * Handles Google Play Billing via react-native-iap
 *
 * Note: react-native-iap requires a native build and won't work in Expo Go.
 * Metro config redirects to a mock module in development mode.
 */

import { Platform } from 'react-native';
import { GOOGLE_PLAY_PRODUCTS, ProductInfo, PurchaseResult } from '@/types/subscription.types';
import { ApiService } from './api.service';

// Import IAP - Metro config redirects this to our wrapper in Expo Go
// eslint-disable-next-line @typescript-eslint/no-var-requires
const IAP = require('react-native-iap');

// Check if we're using the mock module
const isMockIAP = IAP.__IS_MOCK__ === true;

// Product SKUs for Google Play
const PRODUCT_SKUS = [GOOGLE_PLAY_PRODUCTS.monthly, GOOGLE_PLAY_PRODUCTS.annual];

// Store for listeners
let purchaseUpdateSubscription: any = null;
let purchaseErrorSubscription: any = null;
let isConnected = false;

if (isMockIAP) {
  console.log('[BillingService] Using mock IAP (Expo Go mode - billing disabled)');
}

export const BillingService = {
  /**
   * Check if billing is available (requires native build)
   */
  isNativeAvailable(): boolean {
    return !isMockIAP && Platform.OS === 'android';
  },

  /**
   * Initialize Google Play Billing connection
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      console.log('[BillingService] Not on Android, skipping initialization');
      return false;
    }

    if (isMockIAP) {
      console.log('[BillingService] Mock mode, skipping initialization');
      return false;
    }

    if (isConnected) {
      console.log('[BillingService] Already connected');
      return true;
    }

    try {
      await IAP.initConnection();
      isConnected = true;
      console.log('[BillingService] Connection initialized');
      return true;
    } catch (error) {
      console.error('[BillingService] Failed to initialize:', error);
      return false;
    }
  },

  /**
   * Set up purchase listeners
   */
  setupListeners(
    onPurchaseSuccess: (purchase: any) => void,
    onPurchaseError: (error: any) => void
  ): void {
    if (isMockIAP) {
      console.log('[BillingService] Mock mode, skipping listeners setup');
      return;
    }

    // Remove existing listeners first
    this.removeListeners();

    // Listen for successful purchases
    purchaseUpdateSubscription = IAP.purchaseUpdatedListener(
      async (purchase: any) => {
        console.log('[BillingService] Purchase updated:', purchase.productId);

        if (purchase.purchaseToken) {
          try {
            // Finish the transaction (acknowledge)
            await IAP.finishTransaction({ purchase, isConsumable: false });
            console.log('[BillingService] Transaction finished');
            onPurchaseSuccess(purchase);
          } catch (error) {
            console.error('[BillingService] Error finishing transaction:', error);
          }
        }
      }
    );

    // Listen for purchase errors
    purchaseErrorSubscription = IAP.purchaseErrorListener((error: any) => {
      console.error('[BillingService] Purchase error:', error);
      onPurchaseError(error);
    });

    console.log('[BillingService] Listeners set up');
  },

  /**
   * Remove purchase listeners
   */
  removeListeners(): void {
    if (purchaseUpdateSubscription) {
      purchaseUpdateSubscription.remove();
      purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
      purchaseErrorSubscription.remove();
      purchaseErrorSubscription = null;
    }
  },

  /**
   * End billing connection
   */
  async cleanup(): Promise<void> {
    this.removeListeners();
    if (isConnected && !isMockIAP) {
      try {
        await IAP.endConnection();
        isConnected = false;
        console.log('[BillingService] Connection ended');
      } catch (error) {
        console.error('[BillingService] Error ending connection:', error);
      }
    }
  },

  /**
   * Get available subscription products
   */
  async getProducts(): Promise<ProductInfo[]> {
    if (Platform.OS !== 'android') {
      console.log('[BillingService] Not on Android, returning empty products');
      return [];
    }

    if (isMockIAP) {
      console.log('[BillingService] Mock mode, returning empty products');
      return [];
    }

    if (!isConnected) {
      const connected = await this.initialize();
      if (!connected) {
        return [];
      }
    }

    try {
      const subscriptions = await IAP.getSubscriptions({ skus: PRODUCT_SKUS });
      console.log('[BillingService] Got subscriptions:', subscriptions.length);

      return subscriptions.map((sub: any) => ({
        productId: sub.productId,
        title: sub.title || sub.productId,
        description: sub.description || '',
        price: sub.localizedPrice || sub.price || '',
        currency: sub.currency || 'EUR',
        priceAmountMicros: sub.price || '0',
        subscriptionPeriod: sub.subscriptionPeriodAndroid || 'P1M',
      }));
    } catch (error) {
      console.error('[BillingService] Failed to get products:', error);
      return [];
    }
  },

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(productId: string): Promise<PurchaseResult> {
    if (Platform.OS !== 'android') {
      return { success: false, error: 'Non disponible sur cette plateforme' };
    }

    if (isMockIAP) {
      return { success: false, error: 'Achats in-app non disponibles en mode développement. Nécessite un build natif.' };
    }

    if (!isConnected) {
      const connected = await this.initialize();
      if (!connected) {
        return { success: false, error: 'Impossible de se connecter à Google Play' };
      }
    }

    try {
      console.log('[BillingService] Requesting subscription:', productId);
      await IAP.requestSubscription({ sku: productId });
      // The actual result comes through the purchaseUpdatedListener
      return { success: true };
    } catch (error: any) {
      console.error('[BillingService] Purchase failed:', error);

      // Handle user cancellation
      if (error.code === 'E_USER_CANCELLED') {
        return { success: false, error: 'Achat annulé' };
      }

      // Handle already owned
      if (error.code === 'E_ALREADY_OWNED') {
        return { success: false, error: 'Vous avez déjà cet abonnement' };
      }

      return {
        success: false,
        error: error.message || "Erreur lors de l'achat",
      };
    }
  },

  /**
   * Restore purchases (for users reinstalling app)
   */
  async restorePurchases(): Promise<any[]> {
    if (Platform.OS !== 'android') {
      return [];
    }

    if (isMockIAP) {
      return [];
    }

    if (!isConnected) {
      await this.initialize();
    }

    try {
      const purchases = await IAP.getAvailablePurchases();
      console.log('[BillingService] Available purchases:', purchases.length);

      // Filter to only our subscription products
      return purchases.filter((p: any) =>
        PRODUCT_SKUS.includes(p.productId)
      );
    } catch (error) {
      console.error('[BillingService] Failed to restore purchases:', error);
      return [];
    }
  },

  /**
   * Validate purchase with backend and update subscription
   */
  async validateAndActivate(
    purchaseToken: string,
    productId: string
  ): Promise<{ success: boolean; error?: string }> {
    const result = await ApiService.validateGooglePlayPurchase(purchaseToken, productId);

    if (result.success) {
      console.log('[BillingService] Purchase validated successfully');
    } else {
      console.error('[BillingService] Purchase validation failed:', result.error);
    }

    return result;
  },

  /**
   * Get human-readable period from ISO 8601 duration
   */
  formatPeriod(period: string): string {
    if (period === 'P1M') return 'par mois';
    if (period === 'P1Y' || period === 'P12M') return 'par an';
    if (period === 'P3M') return 'par trimestre';
    if (period === 'P6M') return 'par semestre';
    return period;
  },

  /**
   * Check if billing is available (platform check only)
   */
  isAvailable(): boolean {
    return Platform.OS === 'android';
  },

  /**
   * Check if in mock mode (development)
   */
  isMockMode(): boolean {
    return isMockIAP;
  },

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return isConnected;
  },
};

export default BillingService;
