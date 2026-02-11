/**
 * App Mode Context for MuslimGuard
 * Manages the current app mode (child/parent) and related state
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
import { AppMode } from '@/types/storage.types';

interface AppModeContextType {
  // Current mode
  mode: AppMode;
  isChildMode: boolean;
  isParentMode: boolean;

  // Mode switching
  switchToChildMode: () => void;
  switchToParentMode: () => void;

  // Onboarding
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;

  // Loading state
  isLoading: boolean;
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

interface AppModeProviderProps {
  children: ReactNode;
}

export function AppModeProvider({ children }: AppModeProviderProps) {
  const [mode, setMode] = useState<AppMode>('child');
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial state from storage
  useEffect(() => {
    const loadState = async () => {
      try {
        const settings = await StorageService.getSettings();
        setMode(settings.currentMode);
        setIsOnboardingComplete(settings.isOnboardingComplete);
      } catch (error) {
        console.error('Error loading app mode:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadState();
  }, []);

  const switchToChildMode = useCallback(async () => {
    setMode('child');
    await StorageService.updateSettings({ currentMode: 'child' });
  }, []);

  const switchToParentMode = useCallback(async () => {
    setMode('parent');
    await StorageService.updateSettings({ currentMode: 'parent' });
  }, []);

  const completeOnboarding = useCallback(async () => {
    setIsOnboardingComplete(true);
    await StorageService.completeOnboarding();
  }, []);

  const value: AppModeContextType = {
    mode,
    isChildMode: mode === 'child',
    isParentMode: mode === 'parent',
    switchToChildMode,
    switchToParentMode,
    isOnboardingComplete,
    completeOnboarding,
    isLoading,
  };

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}

export default AppModeContext;
