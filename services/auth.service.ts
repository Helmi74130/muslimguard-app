/**
 * Auth Service for MuslimGuard
 * Handles PIN hashing, validation, and lockout logic
 */

import * as Crypto from 'expo-crypto';
import { StorageService } from './storage.service';
import { PinLockoutState, RecoveryLockoutState } from '@/types/storage.types';

// Configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const MIN_PIN_LENGTH = 4;
const MAX_PIN_LENGTH = 6;

// Recovery anti-brute force
const MAX_RECOVERY_ATTEMPTS = 3;
const RECOVERY_LOCKOUT_DURATION_MS = 60 * 1000; // 60 seconds

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

export interface RecoverySetupResult {
  success: boolean;
  masterKey?: string; // Plain text key to show to user once
  error?: string;
}

export interface RecoveryVerifyResult {
  success: boolean;
  error?: string;
  lockedUntil?: Date;
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

  // ==================== RECOVERY ====================

  /**
   * Generate a random Master Key in format MG-XXX-XX (5 alphanumeric chars)
   */
  generateMasterKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No O/0/1/I to avoid confusion
    let part1 = '';
    let part2 = '';
    for (let i = 0; i < 3; i++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
    }
    for (let i = 0; i < 2; i++) {
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }
    return `MG-${part1}-${part2}`;
  },

  /**
   * Normalize a security answer: lowercase, trim, remove extra spaces
   */
  normalizeAnswer(answer: string): string {
    return answer.toLowerCase().trim().replace(/\s+/g, '');
  },

  /**
   * Set up recovery (master key + security question)
   * Returns the plain master key to display to the user
   */
  async setupRecovery(
    questionIndex: number,
    answer: string,
  ): Promise<RecoverySetupResult> {
    try {
      const masterKey = this.generateMasterKey();

      // Hash master key
      const mkSalt = await generateSalt();
      const mkHash = await hashPin(masterKey, mkSalt);

      // Hash normalized answer
      const ansSalt = await generateSalt();
      const normalizedAnswer = this.normalizeAnswer(answer);
      const ansHash = await hashPin(normalizedAnswer, ansSalt);

      // Store everything
      await StorageService.saveMasterKeyHash(mkHash);
      await StorageService.saveMasterKeySalt(mkSalt);
      await StorageService.saveSecurityQuestionIndex(questionIndex);
      await StorageService.saveSecurityAnswerHash(ansHash);
      await StorageService.saveSecurityAnswerSalt(ansSalt);

      return { success: true, masterKey };
    } catch (error) {
      console.error('Error setting up recovery:', error);
      return { success: false, error: 'Failed to set up recovery' };
    }
  },

  /**
   * Check if recovery is locked out
   */
  async isRecoveryLockedOut(state?: RecoveryLockoutState): Promise<boolean> {
    const lockoutState = state || await StorageService.getRecoveryLockoutState();
    if (!lockoutState.lockedUntil) return false;
    if (Date.now() >= lockoutState.lockedUntil) {
      await StorageService.resetRecoveryLockout();
      return false;
    }
    return true;
  },

  /**
   * Record a failed recovery attempt
   */
  recordFailedRecoveryAttempt(currentState: RecoveryLockoutState): RecoveryLockoutState {
    const newAttempts = currentState.failedAttempts + 1;
    if (newAttempts >= MAX_RECOVERY_ATTEMPTS) {
      return {
        failedAttempts: newAttempts,
        lastFailedAttempt: Date.now(),
        lockedUntil: Date.now() + RECOVERY_LOCKOUT_DURATION_MS,
      };
    }
    return {
      failedAttempts: newAttempts,
      lastFailedAttempt: Date.now(),
      lockedUntil: null,
    };
  },

  /**
   * Get remaining recovery lockout seconds
   */
  async getRemainingRecoveryLockoutSeconds(): Promise<number> {
    const state = await StorageService.getRecoveryLockoutState();
    if (!state.lockedUntil) return 0;
    const remaining = state.lockedUntil - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
  },

  /**
   * Verify master key for recovery
   */
  async verifyMasterKey(key: string): Promise<RecoveryVerifyResult> {
    const lockoutState = await StorageService.getRecoveryLockoutState();
    if (await this.isRecoveryLockedOut(lockoutState)) {
      return {
        success: false,
        error: 'recovery_locked',
        lockedUntil: new Date(lockoutState.lockedUntil!),
      };
    }

    const storedHash = await StorageService.getMasterKeyHash();
    const storedSalt = await StorageService.getMasterKeySalt();
    if (!storedHash || !storedSalt) {
      return { success: false, error: 'recovery_not_setup' };
    }

    try {
      const inputKey = key.toUpperCase().trim();
      const inputHash = await hashPin(inputKey, storedSalt);

      if (inputHash === storedHash) {
        await StorageService.resetRecoveryLockout();
        return { success: true };
      }

      const newState = this.recordFailedRecoveryAttempt(lockoutState);
      await StorageService.setRecoveryLockoutState(newState);

      if (newState.lockedUntil) {
        return {
          success: false,
          error: 'recovery_locked',
          lockedUntil: new Date(newState.lockedUntil),
        };
      }

      return { success: false, error: 'invalid_master_key' };
    } catch {
      return { success: false, error: 'verification_failed' };
    }
  },

  /**
   * Verify security answer for recovery
   */
  async verifySecurityAnswer(answer: string): Promise<RecoveryVerifyResult> {
    const lockoutState = await StorageService.getRecoveryLockoutState();
    if (await this.isRecoveryLockedOut(lockoutState)) {
      return {
        success: false,
        error: 'recovery_locked',
        lockedUntil: new Date(lockoutState.lockedUntil!),
      };
    }

    const storedHash = await StorageService.getSecurityAnswerHash();
    const storedSalt = await StorageService.getSecurityAnswerSalt();
    if (!storedHash || !storedSalt) {
      return { success: false, error: 'recovery_not_setup' };
    }

    try {
      const normalizedAnswer = this.normalizeAnswer(answer);
      const inputHash = await hashPin(normalizedAnswer, storedSalt);

      if (inputHash === storedHash) {
        await StorageService.resetRecoveryLockout();
        return { success: true };
      }

      const newState = this.recordFailedRecoveryAttempt(lockoutState);
      await StorageService.setRecoveryLockoutState(newState);

      if (newState.lockedUntil) {
        return {
          success: false,
          error: 'recovery_locked',
          lockedUntil: new Date(newState.lockedUntil),
        };
      }

      return { success: false, error: 'invalid_answer' };
    } catch {
      return { success: false, error: 'verification_failed' };
    }
  },

  /**
   * Get the stored security question index
   */
  async getSecurityQuestionIndex(): Promise<number | null> {
    return StorageService.getSecurityQuestionIndex();
  },

  /**
   * Reset PIN via recovery (after successful verification)
   * Clears PIN so user can set a new one
   */
  async resetPinForRecovery(newPin: string): Promise<PinSetupResult> {
    return this.setupPin(newPin);
  },
};

export default AuthService;
