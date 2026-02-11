/**
 * PIN Setup Screen - MuslimGuard Onboarding
 * Create parent PIN code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PinInput } from '@/components/ui/pin-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth.context';
import { Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.onboarding.pinSetup;

type Step = 'create' | 'confirm';

export default function PinSetupScreen() {
  const { setupPin } = useAuth();
  const [step, setStep] = useState<Step>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinComplete = async (value: string) => {
    if (step === 'create') {
      // Move to confirmation step
      setPin(value);
      setStep('confirm');
      setError('');
    } else {
      // Confirm PIN
      if (value !== pin) {
        setError(t.pinMismatch);
        setConfirmPin('');
        return;
      }

      // PIN matches, save it
      setIsLoading(true);
      try {
        const result = await setupPin(value);
        if (result.success) {
          router.push('/onboarding/city');
        } else {
          setError(result.error || 'Erreur lors de la création du PIN');
        }
      } catch (err) {
        setError('Erreur lors de la création du PIN');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setPin('');
      setConfirmPin('');
      setError('');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={step === 'create' ? 'lock-plus' : 'lock-check'}
                size={48}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>
              {step === 'create' ? t.enterPin : t.confirmPin}
            </Text>
          </View>

          {/* PIN Input */}
          <View style={styles.pinContainer}>
            <PinInput
              length={4}
              value={step === 'create' ? pin : confirmPin}
              onChange={step === 'create' ? setPin : setConfirmPin}
              onComplete={handlePinComplete}
              error={error}
              autoFocus
              key={step} // Reset input when step changes
            />
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View
              style={[
                styles.progressDot,
                step === 'confirm' && styles.progressDotActive,
              ]}
            />
          </View>

          {/* Hint */}
          <Text style={styles.hint}>
            {step === 'create'
              ? 'Choisissez un code PIN à 4 chiffres'
              : 'Entrez à nouveau votre code PIN'}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <Button
              title="Retour"
              variant="ghost"
              onPress={handleBack}
              disabled={isLoading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  pinContainer: {
    marginVertical: Spacing.xl,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  progressDotActive: {
    backgroundColor: Colors.primary,
  },
  hint: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  buttonContainer: {
    alignItems: 'center',
  },
});
