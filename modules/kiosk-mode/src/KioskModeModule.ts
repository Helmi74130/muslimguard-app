import { requireNativeModule } from 'expo-modules-core';

const KioskMode = requireNativeModule('KioskMode');

/**
 * Start screen pinning (lock task mode).
 * Without Device Owner, Android will show a confirmation dialog.
 */
export async function startScreenPinning(): Promise<boolean> {
  return KioskMode.startScreenPinning();
}

/**
 * Stop screen pinning (unlock task mode).
 * Should be called after parent PIN verification.
 */
export async function stopScreenPinning(): Promise<boolean> {
  return KioskMode.stopScreenPinning();
}

/**
 * Check if the app is currently in screen pinning mode.
 */
export async function isScreenPinned(): Promise<boolean> {
  return KioskMode.isScreenPinned();
}
