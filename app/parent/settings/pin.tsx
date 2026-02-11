/**
 * Change PIN Screen - MuslimGuard
 * Change parent PIN code
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PinInput } from '@/components/ui/pin-input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth.context';
import { Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.settings.changePin;

type Step = 'current' | 'new' | 'confirm';

export default function ChangePinScreen() {
  const { changePin } = useAuth();

  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePinComplete = async (value: string) => {
    setError('');

    if (step === 'current') {
      setCurrentPin(value);
      setStep('new');
    } else if (step === 'new') {
      setNewPin(value);
      setStep('confirm');
    } else {
      // Confirm step
      if (value !== newPin) {
        setError(translations.onboarding.pinSetup.pinMismatch);
        setConfirmPin('');
        return;
      }

      // Change PIN
      setIsLoading(true);
      try {
        const result = await changePin(currentPin, value);
        if (result.success) {
          Alert.alert(
            translations.common.success,
            t.success,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          // Reset to current step if current PIN is wrong
          if (result.error?.includes('incorrect')) {
            setError(t.wrongCurrentPin);
            setStep('current');
            setCurrentPin('');
            setNewPin('');
            setConfirmPin('');
          } else {
            setError(result.error || 'Erreur');
          }
        }
      } catch (err) {
        setError('Erreur lors du changement de PIN');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step === 'current') {
      router.back();
    } else if (step === 'new') {
      setStep('current');
      setCurrentPin('');
      setError('');
    } else {
      setStep('new');
      setNewPin('');
      setConfirmPin('');
      setError('');
    }
  };

  const getStepInfo = () => {
    switch (step) {
      case 'current':
        return {
          title: t.currentPin,
          subtitle: 'Entrez votre code PIN actuel',
          value: currentPin,
          setValue: setCurrentPin,
        };
      case 'new':
        return {
          title: t.newPin,
          subtitle: 'Entrez votre nouveau code PIN',
          value: newPin,
          setValue: setNewPin,
        };
      case 'confirm':
        return {
          title: t.confirmNewPin,
          subtitle: 'Confirmez votre nouveau code PIN',
          value: confirmPin,
          setValue: setConfirmPin,
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors.light.text}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Step Icon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name={
                step === 'current'
                  ? 'lock'
                  : step === 'new'
                  ? 'lock-plus'
                  : 'lock-check'
              }
              size={48}
              color={Colors.primary}
            />
          </View>

          <Text style={styles.title}>{stepInfo.title}</Text>
          <Text style={styles.subtitle}>{stepInfo.subtitle}</Text>

          {/* PIN Input */}
          <View style={styles.pinContainer}>
            <PinInput
              length={4}
              value={stepInfo.value}
              onChange={stepInfo.setValue}
              onComplete={handlePinComplete}
              error={error}
              autoFocus
              disabled={isLoading}
              key={step}
            />
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressDot,
                step === 'current' && styles.progressDotActive,
                (step === 'new' || step === 'confirm') && styles.progressDotDone,
              ]}
            />
            <View
              style={[
                styles.progressDot,
                step === 'new' && styles.progressDotActive,
                step === 'confirm' && styles.progressDotDone,
              ]}
            />
            <View
              style={[
                styles.progressDot,
                step === 'confirm' && styles.progressDotActive,
              ]}
            />
          </View>
        </View>

        {/* Cancel Button */}
        <View style={styles.buttonContainer}>
          <Button
            title={translations.common.cancel}
            variant="ghost"
            onPress={() => router.back()}
            disabled={isLoading}
          />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 15,
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
  progressDotDone: {
    backgroundColor: Colors.success,
  },
  buttonContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
});
