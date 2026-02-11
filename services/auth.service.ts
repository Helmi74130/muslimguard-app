/**
 * Auth Service for MuslimGuard
 * Handles PIN hashing, validation, and lockout logic
 */

import * as Crypto from 'expo-crypto';
import { StorageService } from './storage.service';
import { PinLockoutState } from '@/types/storage.types';

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 6;

// Result types
export interface PinValidationResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
  lockedUntil?: Date;
}

export interface PinSetupResult {
  success: boolean;
  error?: string;
}

/**
 * Generate a random salt for PIN hashing
 */
async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash a PIN with a salt using SHA-256
 */
async function hashPin(pin: string, salt: string): Promise<string> {
  const combined = `${salt}:${pin}:muslimguard`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return hash;
}

/**
 * Auth Service - Provides PIN authentication functionality
 */
export const AuthService = {
  /**
   * Validate PIN format
   */
  validatePinFormat(pin: string): { valid: boolean; error?: string } {
    if (!pin) {
      return { valid: false, error: 'PIN is required' };
    }

    if (!/^\d+$/.test(pin)) {
      return { valid: false, error: 'PIN must contain only digits' };
    }

    if (pin.length < MIN_PIN_LENGTH) {
      return { valid: false, error: `PIN must be at least ${MIN_PIN_LENGTH} digits` };
    }

    if (pin.length > MAX_PIN_LENGTH) {
      return { valid: false, error: `PIN must be at most ${MAX_PIN_LENGTH} digits` };
    }

    return { valid: true };
  },

  /**
   * Set up a new PIN
   */
  async setupPin(pin: string): Promise<PinSetupResult> {
    const formatValidation = this.validatePinFormat(pin);
    if (!formatValidation.valid) {
      return { success: false, error: formatValidation.error };
    }

    try {
      const salt = await generateSalt();
      const hash = await hashPin(pin, salt);

      await StorageService.savePinCredentials(hash, salt);
      await StorageService.resetLockout();

      return { success: true };
    } catch (error) {
      console.error('Error setting up PIN:', error);
      return { success: false, error: 'Failed to set up PIN' };
    }
  },

  /**
   * Verify a PIN
   */
  async verifyPin(pin: string): Promise<PinValidationResult> {
    // Check if locked out
    const lockoutState = await StorageService.getLockoutState();
    if (await this.isLockedOut(lockoutState)) {
      const lockedUntil = new Date(lockoutState.lockedUntil!);
      return {
        success: false,
        error: 'Account locked',
        lockedUntil,
      };
    }

    const storedHash = await StorageService.getPinHash();
    const storedSalt = await StorageService.getPinSalt();

    if (!storedHash || !storedSalt) {
      return { success: false, error: 'PIN not set up' };
    }

    try {
      const inputHash = await hashPin(pin, storedSalt);

      if (inputHash === storedHash) {
        // Successful login - reset lockout
        await StorageService.resetLockout();
        return { success: true };
      }

      // Failed attempt - update lockout state
      const newState = this.recordFailedAttempt(lockoutState);
      await StorageService.setLockoutState(newState);

      const attemptsRemaining = MAX_FAILED_ATTEMPTS - newState.failedAttempts;

      if (attemptsRemaining <= 0) {
        return {
          success: false,
          error: 'Too many failed attempts',
          lockedUntil: new Date(newState.lockedUntil!),
        };
      }

      return {
        success: false,
        error: 'Incorrect PIN',
        attemptsRemaining,
      };
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return { success: false, error: 'Failed to verify PIN' };
    }
  },

  /**
   * Change PIN (requires current PIN verification)
   */
  async changePin(currentPin: string, newPin: string): Promise<PinSetupResult> {
    // Verify current PIN first
    const verifyResult = await this.verifyPin(currentPin);
    if (!verifyResult.success) {
      return {
        success: false,
        error: verifyResult.error || 'Current PIN is incorrect',
      };
    }

    // Set up new PIN
    return this.setupPin(newPin);
  },

  /**
   * Check if account is locked out
   */
  async isLockedOut(state?: PinLockoutState): Promise<boolean> {
    const lockoutState = state || await StorageService.getLockoutState();

    if (!lockoutState.lockedUntil) {
      return false;
    }

    if (Date.now() >= lockoutState.lockedUntil) {
      // Lockout expired - reset
      await StorageService.resetLockout();
      return false;
    }

    return true;
  },

  /**
   * Get lockout info
   */
  async getLockoutInfo(): Promise<{
    isLocked: boolean;
    lockedUntil?: Date;
    attemptsRemaining: number;
  }> {
    const state = await StorageService.getLockoutState();

    if (await this.isLockedOut(state)) {
      return {
        isLocked: true,
        lockedUntil: new Date(state.lockedUntil!),
        attemptsRemaining: 0,
      };
    }

    return {
      isLocked: false,
      attemptsRemaining: MAX_FAILED_ATTEMPTS - state.failedAttempts,
    };
  },

  /**
   * Record a failed attempt and return updated state
   */
  recordFailedAttempt(currentState: PinLockoutState): PinLockoutState {
    const newAttempts = currentState.failedAttempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      return {
        failedAttempts: newAttempts,
        lastFailedAttempt: Date.now(),
        lockedUntil: Date.now() + LOCKOUT_DURATION_MS,
      };
    }

    return {
      failedAttempts: newAttempts,
      lastFailedAttempt: Date.now(),
      lockedUntil: null,
    };
  },

  /**
   * Get remaining lockout time in minutes
   */
  async getRemainingLockoutMinutes(): Promise<number> {
    const state = await StorageService.getLockoutState();

    if (!state.lockedUntil) {
      return 0;
    }

    const remaining = state.lockedUntil - Date.now();
    if (remaining <= 0) {
      return 0;
    }

    return Math.ceil(remaining / 60000);
  },

  /**
   * Check if PIN is set up
   */
  async hasPinSet(): Promise<boolean> {
    return StorageService.hasPinSet();
  },

  /**
   * Force reset PIN (factory reset scenario)
   * This should only be used when user chooses to reset the app
   */
  async resetPin(): Promise<void> {
    await StorageService.resetAll();
  },
};

export default AuthService;
