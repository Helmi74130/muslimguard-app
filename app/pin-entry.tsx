/**
 * PIN Entry Modal - MuslimGuard
 * Parent authentication screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PinInput } from '@/components/ui/pin-input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth.context';
import { useAppMode } from '@/contexts/app-mode.context';
import { KioskService } from '@/services/kiosk.service';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.pin;

export default function PinEntryScreen() {
  const {
    verifyPin,
    isLockedOut,
    lockoutMinutesRemaining,
    attemptsRemaining,
  } = useAuth();
  const { switchToParentMode } = useAppMode();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Reset PIN when lockout changes
  useEffect(() => {
    if (!isLockedOut) {
      setPin('');
      setError('');
    }
  }, [isLockedOut]);

  const handlePinComplete = async (value: string) => {
    if (isLockedOut || isVerifying) return;

    setIsVerifying(true);
    setError('');

    try {
      const result = await verifyPin(value);

      if (result.success) {
        // Deactivate kiosk mode before switching to parent
        await KioskService.deactivateKiosk();
        // Switch to parent mode and navigate
        switchToParentMode();
        router.replace('/parent/(tabs)/dashboard');
      } else {
        setError(result.error || t.wrongPin);
        setPin('');
      }
    } catch (err) {
      setError(t.wrongPin);
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Close button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={Colors.light.text}
          />
        </TouchableOpacity>

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="shield-lock"
                size={48}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            <Text style={styles.subtitle}>{t.subtitle}</Text>
          </View>

          {/* Lockout message */}
          {isLockedOut ? (
            <Card variant="elevated" style={styles.lockoutCard}>
              <View style={styles.lockoutContent}>
                <MaterialCommunityIcons
                  name="lock-clock"
                  size={32}
                  color={Colors.error}
                />
                <Text style={styles.lockoutTitle}>{t.locked}</Text>
                <Text style={styles.lockoutMessage}>
                  {t.lockedMessage.replace('{minutes}', String(lockoutMinutesRemaining))}
                </Text>
              </View>
            </Card>
          ) : (
            <>
              {/* PIN Input */}
              <View style={styles.pinContainer}>
                <PinInput
                  length={4}
                  value={pin}
                  onChange={setPin}
                  onComplete={handlePinComplete}
                  error={error}
                  autoFocus
                  disabled={isVerifying}
                />
              </View>

              {/* Attempts remaining */}
              {attemptsRemaining < 5 && attemptsRemaining > 0 && (
                <Text style={styles.attemptsText}>
                  {t.attemptsRemaining.replace('{count}', String(attemptsRemaining))}
                </Text>
              )}
            </>
          )}

          {/* Forgot PIN */}
          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>{t.forgotPin}</Text>
          </TouchableOpacity>
        </View>

        {/* Cancel button */}
        <View style={styles.buttonContainer}>
          <Button
            title={translations.common.cancel}
            variant="ghost"
            onPress={handleClose}
            fullWidth
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
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    zIndex: 10,
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
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  pinContainer: {
    marginVertical: Spacing.xl,
  },
  attemptsText: {
    fontSize: 14,
    color: Colors.warning,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
  lockoutCard: {
    marginVertical: Spacing.xl,
    backgroundColor: Colors.error + '08',
    borderColor: Colors.error + '30',
    borderWidth: 1,
  },
  lockoutContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  lockoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
  },
  lockoutMessage: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  forgotButton: {
    alignSelf: 'center',
    padding: Spacing.md,
  },
  forgotText: {
    fontSize: 14,
    color: Colors.primary,
  },
  buttonContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
