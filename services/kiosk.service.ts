/**
 * Kiosk Service for MuslimGuard
 * Manages screen pinning and status bar visibility for child mode lockdown
 */

import { Platform } from 'react-native';
import { StorageService } from './storage.service';

// Lazy import of native module (only available on Android after prebuild)
let KioskModule: {
  startScreenPinning: () => Promise<boolean>;
  stopScreenPinning: () => Promise<boolean>;
  isScreenPinned: () => Promise<boolean>;
} | null = null;

function getKioskModule() {
  if (KioskModule) return KioskModule;

  if (Platform.OS === 'android') {
    try {
      KioskModule = require('kiosk-mode');
      return KioskModule;
    } catch {
      console.warn('KioskMode native module not available. Run npx expo prebuild first.');
      return null;
    }
  }
  return null;
}

export const KioskService = {
  /**
   * Activate kiosk mode (screen pinning)
   * Should be called when entering child mode with kiosk enabled
   */
  async activateKiosk(): Promise<boolean> {
    const settings = await StorageService.getSettings();
    if (!settings.kioskModeEnabled) return false;

    const mod = getKioskModule();
    if (!mod) return false;

    try {
      return await mod.startScreenPinning();
    } catch (error) {
      console.error('Error activating kiosk mode:', error);
      return false;
    }
  },

  /**
   * Deactivate kiosk mode
   * Should be called after parent PIN verification
   */
  async deactivateKiosk(): Promise<boolean> {
    const mod = getKioskModule();
    if (!mod) return false;

    try {
      return await mod.stopScreenPinning();
    } catch (error) {
      console.error('Error deactivating kiosk mode:', error);
      return false;
    }
  },

  /**
   * Check if kiosk mode (screen pinning) is currently active
   */
  async isActive(): Promise<boolean> {
    const mod = getKioskModule();
    if (!mod) return false;

    try {
      return await mod.isScreenPinned();
    } catch (error) {
      console.error('Error checking kiosk state:', error);
      return false;
    }
  },

  /**
   * Check if kiosk mode is enabled in settings
   */
  async isEnabled(): Promise<boolean> {
    const settings = await StorageService.getSettings();
    return settings.kioskModeEnabled;
  },

  /**
   * Check if status bar should be hidden
   */
  async shouldHideStatusBar(): Promise<boolean> {
    const settings = await StorageService.getSettings();
    return settings.kioskModeEnabled && settings.kioskHideStatusBar;
  },
};

export default KioskService;
