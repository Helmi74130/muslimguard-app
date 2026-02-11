/**
 * Hook for checking premium feature access
 * Provides easy feature gating throughout the app
 */

import { useCallback } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { useSubscription } from '@/contexts/subscription.context';
import { PremiumFeature, PREMIUM_FEATURE_LABELS } from '@/types/subscription.types';

interface UsePremiumFeatureResult {
  /** Whether the feature is available to the current user */
  isAvailable: boolean;
  /** Whether the user has a premium subscription */
  isPremium: boolean;
  /** Whether the user is logged in */
  isLoggedIn: boolean;
  /** Human-readable label for the feature */
  featureLabel: string;
  /**
   * Call this before using a premium feature.
   * Returns true if the feature can be used.
   * If not available, shows an alert and returns false.
   */
  requireFeature: () => boolean;
  /**
   * Shows upgrade prompt without blocking.
   * Useful for showing "premium" badges or prompts.
   */
  showUpgradePrompt: () => void;
}

/**
 * Hook for checking and gating premium features
 *
 * @param feature - The premium feature to check
 * @returns Object with availability info and helper functions
 *
 * @example
 * ```tsx
 * function KioskSettings() {
 *   const { isAvailable, requireFeature } = usePremiumFeature('kiosk_mode');
 *
 *   const handleEnableKiosk = () => {
 *     if (!requireFeature()) return; // Shows upgrade prompt if not premium
 *     // ... enable kiosk mode
 *   };
 *
 *   return (
 *     <View>
 *       <Switch
 *         value={kioskEnabled}
 *         onValueChange={handleEnableKiosk}
 *       />
 *       {!isAvailable && <PremiumBadge />}
 *     </View>
 *   );
 * }
 * ```
 */
export function usePremiumFeature(feature: PremiumFeature): UsePremiumFeatureResult {
  const { hasFeature, isPremium, isLoggedIn } = useSubscription();

  const isAvailable = hasFeature(feature);
  const featureLabel = PREMIUM_FEATURE_LABELS[feature];

  /**
   * Shows an upgrade prompt alert
   */
  const showUpgradePrompt = useCallback(() => {
    Alert.alert(
      'Fonctionnalité Premium',
      `"${featureLabel}" est une fonctionnalité Premium. Passez à MuslimGuard Premium pour y accéder.`,
      [
        { text: 'Plus tard', style: 'cancel' },
        {
          text: isLoggedIn ? 'Voir les offres' : 'Se connecter',
          onPress: () => {
            if (isLoggedIn) {
              router.push('/parent/premium' as any);
            } else {
              router.push('/parent/account/login' as any);
            }
          },
        },
      ]
    );
  }, [featureLabel, isLoggedIn]);

  /**
   * Checks if feature is available, shows prompt if not
   * Returns true if feature can be used
   */
  const requireFeature = useCallback((): boolean => {
    if (isAvailable) {
      return true;
    }

    showUpgradePrompt();
    return false;
  }, [isAvailable, showUpgradePrompt]);

  return {
    isAvailable,
    isPremium,
    isLoggedIn,
    featureLabel,
    requireFeature,
    showUpgradePrompt,
  };
}

/**
 * Hook for checking domain limit
 *
 * @example
 * ```tsx
 * function BlocklistScreen() {
 *   const { canAddMore, currentCount, maxCount } = useBlockedDomainsLimit(blockedDomains.length);
 *
 *   const handleAddDomain = () => {
 *     if (!canAddMore) {
 *       // Show upgrade prompt
 *       return;
 *     }
 *     // ... add domain
 *   };
 * }
 * ```
 */
export function useBlockedDomainsLimit(currentCount: number) {
  const { getLimit, isPremium, isLoggedIn } = useSubscription();

  const maxCount = getLimit('maxBlockedDomains');
  const canAddMore = currentCount < maxCount;

  const showLimitReachedPrompt = useCallback(() => {
    Alert.alert(
      'Limite atteinte',
      `Vous avez atteint la limite de ${maxCount} sites bloqués. Passez à Premium pour un blocage illimité.`,
      [
        { text: 'Plus tard', style: 'cancel' },
        {
          text: isLoggedIn ? 'Voir les offres' : 'Se connecter',
          onPress: () => {
            if (isLoggedIn) {
              router.push('/parent/premium' as any);
            } else {
              router.push('/parent/account/login' as any);
            }
          },
        },
      ]
    );
  }, [maxCount, isLoggedIn]);

  return {
    canAddMore,
    currentCount,
    maxCount,
    isPremium,
    showLimitReachedPrompt,
  };
}

/**
 * Hook for checking history days limit
 */
export function useHistoryDaysLimit() {
  const { getLimit, isPremium } = useSubscription();

  const historyDays = getLimit('historyDays');
  const cutoffTimestamp = Date.now() - historyDays * 24 * 60 * 60 * 1000;

  return {
    historyDays,
    cutoffTimestamp,
    isPremium,
  };
}

export default usePremiumFeature;
