/**
 * Auth Context for MuslimGuard
 * Manages PIN authentication state and session
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { AuthService, PinValidationResult, PinSetupResult } from '@/services/auth.service';

interface AuthContextType {
  // Auth state
  isAuthenticated: boolean;
  hasPinSet: boolean;

  // Lockout state
  isLockedOut: boolean;
  lockoutMinutesRemaining: number;
  attemptsRemaining: number;

  // Actions
  verifyPin: (pin: string) => Promise<PinValidationResult>;
  setupPin: (pin: string) => Promise<PinSetupResult>;
  changePin: (currentPin: string, newPin: string) => Promise<PinSetupResult>;
  logout: () => void;

  // Loading
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPinSet, setHasPinSet] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMinutesRemaining, setLockoutMinutesRemaining] = useState(0);
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  // Update lockout state
  const updateLockoutState = useCallback(async () => {
    try {
      const lockoutInfo = await AuthService.getLockoutInfo();
      setIsLockedOut(lockoutInfo.isLocked);
      setAttemptsRemaining(lockoutInfo.attemptsRemaining);

      if (lockoutInfo.isLocked && lockoutInfo.lockedUntil) {
        const remaining = Math.ceil(
          (lockoutInfo.lockedUntil.getTime() - Date.now()) / 60000
        );
        setLockoutMinutesRemaining(Math.max(0, remaining));
      } else {
        setLockoutMinutesRemaining(0);
      }
    } catch (error) {
      console.error('Error updating lockout state:', error);
    }
  }, []);

  // Load initial state
  useEffect(() => {
    const loadState = async () => {
      try {
        const pinSet = await AuthService.hasPinSet();
        setHasPinSet(pinSet);
        await updateLockoutState();
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, [updateLockoutState]);

  // Update lockout countdown
  useEffect(() => {
    if (!isLockedOut) return;

    const interval = setInterval(async () => {
      const remaining = await AuthService.getRemainingLockoutMinutes();
      setLockoutMinutesRemaining(remaining);

      if (remaining <= 0) {
        setIsLockedOut(false);
        await updateLockoutState();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLockedOut, updateLockoutState]);

  const verifyPin = useCallback(
    async (pin: string): Promise<PinValidationResult> => {
      const result = await AuthService.verifyPin(pin);

      if (result.success) {
        setIsAuthenticated(true);
        await updateLockoutState();
      } else {
        await updateLockoutState();

        if (result.lockedUntil) {
          setIsLockedOut(true);
        }
      }

      return result;
    },
    [updateLockoutState]
  );

  const setupPin = useCallback(
    async (pin: string): Promise<PinSetupResult> => {
      const result = await AuthService.setupPin(pin);

      if (result.success) {
        setHasPinSet(true);
        setIsAuthenticated(true);
      }

      return result;
    },
    []
  );

  const changePin = useCallback(
    async (currentPin: string, newPin: string): Promise<PinSetupResult> => {
      return AuthService.changePin(currentPin, newPin);
    },
    []
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    hasPinSet,
    isLockedOut,
    lockoutMinutesRemaining,
    attemptsRemaining,
    verifyPin,
    setupPin,
    changePin,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
