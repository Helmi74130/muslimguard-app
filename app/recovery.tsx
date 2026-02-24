/**
 * Recovery Screen - MuslimGuard
 * Allows PIN reset via Security Question or Master Key
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PinInput } from '@/components/ui/pin-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AuthService } from '@/services/auth.service';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.recovery;

type RecoveryMethod = 'question' | 'masterkey';
type RecoveryStep = 'choose' | 'verify' | 'new-pin' | 'confirm-pin' | 'success';

export default function RecoveryScreen() {
  const [method, setMethod] = useState<RecoveryMethod>('question');
  const [step, setStep] = useState<RecoveryStep>('choose');

  // Verification state
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Lockout state
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  // New PIN state
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Load security question on mount
  useEffect(() => {
    const loadQuestion = async () => {
      const idx = await AuthService.getSecurityQuestionIndex();
      if (idx !== null) {
        const questions = translations.onboarding.setup.recovery.questions;
        setQuestionText(questions[idx] || '');
      }
    };
    loadQuestion();
    checkLockout();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) return;

    const interval = setInterval(async () => {
      const remaining = await AuthService.getRemainingRecoveryLockoutSeconds();
      setLockoutSeconds(remaining);
      if (remaining <= 0) {
        setIsLocked(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLocked, lockoutSeconds]);

  const checkLockout = async () => {
    const locked = await AuthService.isRecoveryLockedOut();
    setIsLocked(locked);
    if (locked) {
      const remaining = await AuthService.getRemainingRecoveryLockoutSeconds();
      setLockoutSeconds(remaining);
    }
  };

  const handleVerify = useCallback(async () => {
    if (isLocked) return;

    setIsVerifying(true);
    setVerifyError('');

    try {
      let result;
      if (method === 'question') {
        result = await AuthService.verifySecurityAnswer(securityAnswer);
      } else {
        result = await AuthService.verifyMasterKey(masterKeyInput);
      }

      if (result.success) {
        setStep('new-pin');
        setVerifyError('');
      } else if (result.error === 'recovery_locked') {
        setIsLocked(true);
        if (result.lockedUntil) {
          const remaining = Math.ceil(
            (result.lockedUntil.getTime() - Date.now()) / 1000,
          );
          setLockoutSeconds(Math.max(0, remaining));
        }
        setVerifyError('');
      } else if (result.error === 'invalid_answer') {
        setVerifyError(t.errors.invalidAnswer);
      } else if (result.error === 'invalid_master_key') {
        setVerifyError(t.errors.invalidMasterKey);
      } else if (result.error === 'recovery_not_setup') {
        setVerifyError(t.errors.notSetup);
      } else {
        setVerifyError(t.errors.failed);
      }
    } catch {
      setVerifyError(t.errors.failed);
    } finally {
      setIsVerifying(false);
    }
  }, [method, securityAnswer, masterKeyInput, isLocked]);

  const handleNewPinComplete = useCallback((value: string) => {
    setNewPin(value);
    setStep('confirm-pin');
    setConfirmPin('');
    setPinError('');
  }, []);

  const handleConfirmPinComplete = useCallback(
    async (value: string) => {
      if (value !== newPin) {
        setPinError(t.pinMismatch);
        setConfirmPin('');
        return;
      }

      setIsResetting(true);
      try {
        const result = await AuthService.resetPinForRecovery(value);
        if (result.success) {
          setStep('success');
        } else {
          setPinError(result.error || t.errors.failed);
        }
      } catch {
        setPinError(t.errors.failed);
      } finally {
        setIsResetting(false);
      }
    },
    [newPin],
  );

  const handleClose = () => {
    router.back();
  };

  const handleDone = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name="lock-reset"
                size={48}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.title}>{t.title}</Text>
            {step === 'choose' && (
              <Text style={styles.subtitle}>{t.subtitle}</Text>
            )}
          </View>

          {/* Success */}
          {step === 'success' && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={64}
                  color={Colors.success}
                />
              </View>
              <Text style={styles.successTitle}>{t.pinResetSuccess}</Text>
              <Button
                title={translations.common.done}
                onPress={handleDone}
                size="large"
                fullWidth
                style={{ marginTop: Spacing.xl }}
              />
            </View>
          )}

          {/* Lockout Banner */}
          {isLocked && step !== 'success' && (
            <View style={styles.lockoutBanner}>
              <MaterialCommunityIcons
                name="lock-clock"
                size={24}
                color={Colors.error}
              />
              <Text style={styles.lockoutText}>
                {t.errors.locked.replace('{seconds}', String(lockoutSeconds))}
              </Text>
            </View>
          )}

          {/* Step: Choose method + Verify */}
          {(step === 'choose') && (
            <>
              {/* Method Tabs */}
              <View style={styles.methodTabs}>
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    method === 'question' && styles.methodTabActive,
                  ]}
                  onPress={() => {
                    setMethod('question');
                    setVerifyError('');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="help-circle-outline"
                    size={20}
                    color={method === 'question' ? Colors.primary : Colors.light.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      method === 'question' && styles.methodTabTextActive,
                    ]}
                  >
                    {t.optionQuestion}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.methodTab,
                    method === 'masterkey' && styles.methodTabActive,
                  ]}
                  onPress={() => {
                    setMethod('masterkey');
                    setVerifyError('');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="key-variant"
                    size={20}
                    color={method === 'masterkey' ? Colors.primary : Colors.light.textSecondary}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      method === 'masterkey' && styles.methodTabTextActive,
                    ]}
                  >
                    {t.optionMasterKey}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Question method */}
              {method === 'question' && (
                <View style={styles.verifyCard}>
                  <Text style={styles.verifyLabel}>{t.questionLabel}</Text>
                  <Text style={styles.questionDisplay}>{questionText}</Text>
                  <Input
                    placeholder={t.answerPlaceholder}
                    value={securityAnswer}
                    onChangeText={(text) => {
                      setSecurityAnswer(text);
                      setVerifyError('');
                    }}
                    leftIcon={
                      <MaterialCommunityIcons
                        name="lock-question"
                        size={20}
                        color={Colors.light.textSecondary}
                      />
                    }
                  />
                  {verifyError ? (
                    <Text style={styles.errorText}>{verifyError}</Text>
                  ) : null}
                  <Button
                    title={t.verify}
                    onPress={handleVerify}
                    size="medium"
                    fullWidth
                    loading={isVerifying}
                    disabled={!securityAnswer.trim() || isLocked || isVerifying}
                    style={{ marginTop: Spacing.md }}
                  />
                </View>
              )}

              {/* Master Key method */}
              {method === 'masterkey' && (
                <View style={styles.verifyCard}>
                  <Input
                    placeholder={t.masterKeyPlaceholder}
                    value={masterKeyInput}
                    onChangeText={(text) => {
                      setMasterKeyInput(text.toUpperCase());
                      setVerifyError('');
                    }}
                    autoCapitalize="characters"
                    leftIcon={
                      <MaterialCommunityIcons
                        name="key-variant"
                        size={20}
                        color={Colors.light.textSecondary}
                      />
                    }
                  />
                  {verifyError ? (
                    <Text style={styles.errorText}>{verifyError}</Text>
                  ) : null}
                  <Button
                    title={t.verify}
                    onPress={handleVerify}
                    size="medium"
                    fullWidth
                    loading={isVerifying}
                    disabled={!masterKeyInput.trim() || isLocked || isVerifying}
                    style={{ marginTop: Spacing.md }}
                  />
                </View>
              )}
            </>
          )}

          {/* Step: New PIN */}
          {step === 'new-pin' && (
            <View style={styles.pinSection}>
              <Text style={styles.pinTitle}>{t.newPinTitle}</Text>
              <Text style={styles.pinSubtitle}>{t.newPinSubtitle}</Text>
              <PinInput
                length={4}
                value={newPin}
                onChange={setNewPin}
                onComplete={handleNewPinComplete}
                autoFocus
              />
            </View>
          )}

          {/* Step: Confirm PIN */}
          {step === 'confirm-pin' && (
            <View style={styles.pinSection}>
              <Text style={styles.pinTitle}>{t.newPinTitle}</Text>
              <Text style={styles.pinSubtitle}>{t.confirmNewPin}</Text>
              <PinInput
                key="confirm"
                length={4}
                value={confirmPin}
                onChange={setConfirmPin}
                onComplete={handleConfirmPinComplete}
                error={pinError}
                autoFocus
                disabled={isResetting}
              />
              <TouchableOpacity
                onPress={() => {
                  setStep('new-pin');
                  setNewPin('');
                  setConfirmPin('');
                  setPinError('');
                }}
                style={styles.backButton}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.backText}>{translations.common.back}</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Cancel button */}
        {step !== 'success' && (
          <View style={styles.buttonContainer}>
            <Button
              title={translations.common.cancel}
              variant="ghost"
              onPress={handleClose}
              fullWidth
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  flex: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    padding: Spacing.sm,
    zIndex: 10,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xl * 2,
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

  // Method tabs
  methodTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  methodTabActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  methodTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  methodTabTextActive: {
    color: Colors.primary,
  },

  // Verify card
  verifyCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    padding: Spacing.lg,
  },
  verifyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  questionDisplay: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // Lockout
  lockoutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.error + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  lockoutText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
  },

  // PIN section
  pinSection: {
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  pinSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  backText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Success
  successContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  successIcon: {
    marginBottom: Spacing.lg,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.success,
    textAlign: 'center',
  },

  // Bottom
  buttonContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
});
