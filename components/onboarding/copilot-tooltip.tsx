/**
 * Custom Copilot Tooltip - MuslimGuard
 * French-localized tooltip for the onboarding walkthrough
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useCopilot } from 'react-native-copilot';
import React, { useCallback, useContext } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const t = translations.onboardingTour;

/**
 * Context to let the tooltip pre-scroll before advancing steps.
 * Solves the copilot + ScrollView offset bug: copilot measures element
 * position BEFORE our stepChange handler scrolls, causing a mismatch.
 * By scrolling BEFORE goToNext, copilot measures at the correct position.
 */
export const CopilotScrollContext = React.createContext<{
  scrollToStep?: (stepOrder: number) => Promise<void>;
} | null>(null);

export function CopilotTooltip() {
  const { isFirstStep, isLastStep, goToNext, goToPrev, stop, currentStep } =
    useCopilot();
  const scrollCtx = useContext(CopilotScrollContext);

  const handleNext = useCallback(async () => {
    if (isLastStep) {
      stop();
      return;
    }
    if (scrollCtx?.scrollToStep && currentStep) {
      await scrollCtx.scrollToStep(currentStep.order + 1);
    }
    goToNext();
  }, [isLastStep, stop, goToNext, scrollCtx, currentStep]);

  const handlePrev = useCallback(async () => {
    if (scrollCtx?.scrollToStep && currentStep) {
      await scrollCtx.scrollToStep(currentStep.order - 1);
    }
    goToPrev();
  }, [goToPrev, scrollCtx, currentStep]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{currentStep?.text}</Text>
      <View style={styles.buttonsRow}>
        {!isFirstStep && (
          <TouchableOpacity onPress={handlePrev} style={styles.secondaryButton} activeOpacity={0.7}>
            <Text style={styles.secondaryButtonText}>{t.previous}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={stop} style={styles.skipButton} activeOpacity={0.7}>
          <Text style={styles.skipButtonText}>{t.skip}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleNext}
          style={styles.primaryButton}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>
            {isLastStep ? t.finish : t.next}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
  },
  text: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  secondaryButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  skipButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginRight: 'auto',
  },
  skipButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 13,
  },
});
