/**
 * API Service for MuslimGuard
 * Handles communication with the SaaS backend
 */

import { Platform } from 'react-native';
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { StorageService } from './storage.service';
import {
  AuthResponse,
  LoginRequest,
  ValidatePurchaseRequest,
  ValidatePurchaseResponse,
  SubscriptionInfo,
} from '@/types/subscription.types';

// Backend API base URL - TODO: Move to environment config
const API_BASE_URL = 'https://muslim-guard.com/api/mobile';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 15000;

/**
 * Helper to make fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Get device info for registration
 */
async function getDeviceInfo(): Promise<{
  deviceName: string;
  deviceId: string;
  platform: string;
  appVersion: string;
}> {
  const deviceName = Device.deviceName || Device.modelName || 'Unknown Device';
  const deviceId = Application.androidId || `${Device.modelId}-${Date.now()}`;
  const platform = Platform.OS;
  const appVersion = Application.nativeApplicationVersion || '1.0.0';

  return { deviceName, deviceId, platform, appVersion };
}

export const ApiService = {
  /**
   * Login with email and password
   */
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const deviceInfo = await getDeviceInfo();

      const body: LoginRequest = {
        email,
        password,
        ...deviceInfo,
      };

      const response = await fetchWithTimeout(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Erreur de connexion',
        };
      }

      // Store token securely
      if (data.token) {
        await StorageService.saveAuthToken(data.token);
      }

      return {
        success: true,
        token: data.token,
        user: data.user,
        subscription: data.subscription,
      };
    } catch (error: any) {
      console.error('[ApiService] Login error:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La connexion a expiré. Veuillez réessayer.',
        };
      }

      return {
        success: false,
        error: 'Erreur de connexion. Vérifiez votre connexion internet.',
      };
    }
  },

  /**
   * Verify current token and get subscription status
   */
  async verifyToken(): Promise<AuthResponse> {
    try {
      const token = await StorageService.getAuthToken();

      if (!token) {
        return { success: false, error: 'No token' };
      }

      const response = await fetchWithTimeout(`${API_BASE_URL}/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Token expired or invalid - clear it
        if (response.status === 401 || response.status === 403) {
          await StorageService.deleteAuthToken();
        }
        return {
          success: false,
          error: data.error || data.message || 'Session expirée',
        };
      }

      return {
        success: true,
        token,
        user: data.user,
        subscription: data.subscription,
      };
    } catch (error: any) {
      console.error('[ApiService] Verify token error:', error);

      if (error.name === 'AbortError') {
        return {
          success: false,
          error: 'La vérification a expiré.',
        };
      }

      return {
        success: false,
        error: 'Erreur de vérification.',
      };
    }
  },

  /**
   * Logout and revoke token
   */
  async logout(): Promise<boolean> {
    try {
      const token = await StorageService.getAuthToken();

      if (token) {
        // Try to revoke on server (don't wait too long)
        try {
          await fetchWithTimeout(
            `${API_BASE_URL}/logout`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
            5000 // Short timeout for logout
          );
        } catch {
          // Ignore server errors during logout
        }
      }

      // Always clear local token
      await StorageService.deleteAuthToken();
      return true;
    } catch (error) {
      console.error('[ApiService] Logout error:', error);
      // Still clear local token
      await StorageService.deleteAuthToken();
      return true;
    }
  },

  /**
   * Validate Google Play purchase with backend
   */
  async validateGooglePlayPurchase(
    purchaseToken: string,
    productId: string
  ): Promise<ValidatePurchaseResponse> {
    try {
      const token = await StorageService.getAuthToken();

      if (!token) {
        return { success: false, error: 'Connexion requise' };
      }

      const body: ValidatePurchaseRequest = {
        platform: 'android',
        purchaseToken,
        productId,
      };

      const response = await fetchWithTimeout(`${API_BASE_URL}/validate-purchase`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || data.message || 'Validation échouée',
        };
      }

      return {
        success: true,
        subscription: data.subscription,
      };
    } catch (error: any) {
      console.error('[ApiService] Validate purchase error:', error);

      return {
        success: false,
        error: "Erreur de validation de l'achat",
      };
    }
  },

  /**
   * Check if user has valid token stored
   */
  async hasValidToken(): Promise<boolean> {
    const token = await StorageService.getAuthToken();
    return !!token;
  },

  /**
   * Get stored auth token
   */
  async getToken(): Promise<string | null> {
    return StorageService.getAuthToken();
  },
};

export default ApiService;
