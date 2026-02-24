/**
 * Onboarding Setup Screen - MuslimGuard
 * Combined PIN creation + City selection + Recovery setup in one screen
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { PinInput } from '@/components/ui/pin-input';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth.context';
import { useAppMode } from '@/contexts/app-mode.context';
import { AuthService } from '@/services/auth.service';
import { GeocodingService, CitySearchResult } from '@/services/geocoding.service';
import { PrayerService } from '@/services/prayer.service';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { CityCoordinates } from '@/types/storage.types';

const t = translations.onboarding.setup;

export default function OnboardingSetupScreen() {
  const { setupPin } = useAuth();
  const { completeOnboarding, switchToChildMode } = useAppMode();

  // PIN state
  const [pinStep, setPinStep] = useState<'create' | 'confirm'>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isPinSet, setIsPinSet] = useState(false);

  // City state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityCoordinates | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Recovery state
  const [generatedMasterKey, setGeneratedMasterKey] = useState<string | null>(null);
  const [masterKeyCopied, setMasterKeyCopied] = useState(false);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isRecoverySet, setIsRecoverySet] = useState(false);
  const [isSettingUpRecovery, setIsSettingUpRecovery] = useState(false);

  // Overall state
  const [isLoading, setIsLoading] = useState(false);

  // ===== PIN Logic =====
  const handlePinComplete = useCallback(
    async (value: string) => {
      if (pinStep === 'create') {
        setPin(value);
        setPinStep('confirm');
        setConfirmPin('');
        setPinError('');
        return;
      }

      // Confirm step
      if (value !== pin) {
        setPinError(t.pin.pinMismatch);
        setConfirmPin('');
        return;
      }

      try {
        const result = await setupPin(value);
        if (result.success) {
          setIsPinSet(true);
          setPinError('');
        }
      } catch (error) {
        setPinError(t.pin.pinMismatch);
        setConfirmPin('');
      }
    },
    [pinStep, pin, setupPin],
  );

  const handlePinBack = useCallback(() => {
    if (pinStep === 'confirm') {
      setPinStep('create');
      setPin('');
      setConfirmPin('');
      setPinError('');
    }
  }, [pinStep]);

  // ===== City Logic =====
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await GeocodingService.searchCities(query, 8);
        setSearchResults(results);
        setHasSearched(true);
      } catch {
        setSearchResults([]);
        setHasSearched(true);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  }, []);

  const handleSelectCity = useCallback((result: CitySearchResult) => {
    const city: CityCoordinates = {
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    };
    setSelectedCity(city);
    setSearchResults([]);
    setSearchQuery('');
    setHasSearched(false);
  }, []);

  // ===== Recovery Logic =====
  const handleCopyMasterKey = useCallback(async () => {
    if (!generatedMasterKey) return;
    await Clipboard.setStringAsync(generatedMasterKey);
    setMasterKeyCopied(true);
    setTimeout(() => setMasterKeyCopied(false), 2000);
  }, [generatedMasterKey]);

  const handleSetupRecovery = useCallback(async () => {
    if (selectedQuestionIndex === null || !securityAnswer.trim()) return;

    setIsSettingUpRecovery(true);
    try {
      const result = await AuthService.setupRecovery(selectedQuestionIndex, securityAnswer);
      if (result.success && result.masterKey) {
        setGeneratedMasterKey(result.masterKey);
        setIsRecoverySet(true);
      }
    } catch (error) {
      console.error('Error setting up recovery:', error);
    } finally {
      setIsSettingUpRecovery(false);
    }
  }, [selectedQuestionIndex, securityAnswer]);

  const canSetupRecovery = selectedQuestionIndex !== null && securityAnswer.trim().length >= 2;

  // ===== Start App =====
  const handleStart = useCallback(async () => {
    if (!isPinSet || !selectedCity || !isRecoverySet) return;

    setIsLoading(true);
    try {
      await PrayerService.setCity(selectedCity);
      await completeOnboarding();
      await switchToChildMode();
      router.replace('/child/browser');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isPinSet, selectedCity, isRecoverySet, completeOnboarding, switchToChildMode]);

  const canStart = isPinSet && selectedCity !== null && isRecoverySet;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Gradient Header */}
          <LinearGradient
            colors={['#003463', '#0C4A6E', '#0E7490']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <SafeAreaView edges={['top']}>
              <Text style={styles.headerTitle}>{t.title}</Text>
              <Text style={styles.headerSubtitle}>
                {t.stepsSubtitle}
              </Text>
            </SafeAreaView>
          </LinearGradient>

          {/* PIN Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.stepBadge, isPinSet && styles.stepBadgeDone]}>
                {isPinSet ? (
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumber}>1</Text>
                )}
              </View>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>{t.pin.title}</Text>
                <Text style={styles.sectionSubtitle}>{t.pin.subtitle}</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {isPinSet ? (
                <View style={styles.successCard}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={32}
                    color={Colors.success}
                  />
                  <Text style={styles.successText}>{t.pin.pinCreated}</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.pinHint}>
                    {pinStep === 'create' ? t.pin.enterPin : t.pin.confirmPin}
                  </Text>
                  <PinInput
                    key={pinStep}
                    length={4}
                    value={pinStep === 'create' ? pin : confirmPin}
                    onChange={pinStep === 'create' ? setPin : setConfirmPin}
                    onComplete={handlePinComplete}
                    error={pinError}
                  />
                  {/* Step indicator */}
                  <View style={styles.pinSteps}>
                    <View style={[styles.pinStepDot, styles.pinStepActive]} />
                    <View
                      style={[
                        styles.pinStepDot,
                        pinStep === 'confirm' && styles.pinStepActive,
                      ]}
                    />
                  </View>
                  {pinStep === 'confirm' && (
                    <TouchableOpacity
                      onPress={handlePinBack}
                      style={styles.pinBackButton}
                    >
                      <MaterialCommunityIcons
                        name="arrow-left"
                        size={18}
                        color={Colors.primary}
                      />
                      <Text style={styles.pinBackText}>
                        {translations.common.back}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          </View>

          {/* City Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.stepBadge, selectedCity && styles.stepBadgeDone]}
              >
                {selectedCity ? (
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumber}>2</Text>
                )}
              </View>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>{t.city.title}</Text>
                <Text style={styles.sectionSubtitle}>{t.city.subtitle}</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {selectedCity ? (
                <View style={styles.selectedCityCard}>
                  <MaterialCommunityIcons
                    name="map-marker-check"
                    size={28}
                    color={Colors.success}
                  />
                  <View style={styles.selectedCityInfo}>
                    <Text style={styles.selectedCityName}>
                      {selectedCity.name}
                    </Text>
                    <Text style={styles.selectedCityCountry}>
                      {selectedCity.country}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setSelectedCity(null)}
                    style={styles.changeCityButton}
                  >
                    <MaterialCommunityIcons
                      name="pencil"
                      size={18}
                      color={Colors.primary}
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Input
                    placeholder={t.city.searchPlaceholder}
                    value={searchQuery}
                    onChangeText={handleSearchChange}
                    leftIcon={
                      <MaterialCommunityIcons
                        name="magnify"
                        size={20}
                        color={Colors.light.textSecondary}
                      />
                    }
                    rightIcon={
                      isSearching ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                      ) : undefined
                    }
                  />

                  {/* Search results (using .map, not FlatList) */}
                  {hasSearched && searchResults.length === 0 && (
                    <View style={styles.emptyResults}>
                      <MaterialCommunityIcons
                        name="map-marker-off"
                        size={24}
                        color={Colors.light.textSecondary}
                      />
                      <Text style={styles.emptyText}>{t.city.noResults}</Text>
                    </View>
                  )}

                  {searchResults.length > 0 && (
                    <View style={styles.resultsContainer}>
                      {searchResults.map((result, index) => (
                        <TouchableOpacity
                          key={`${result.name}-${result.latitude}-${index}`}
                          style={styles.cityItem}
                          onPress={() => handleSelectCity(result)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons
                            name="map-marker"
                            size={20}
                            color={Colors.primary}
                          />
                          <View style={styles.cityItemText}>
                            <Text style={styles.cityName}>{result.name}</Text>
                            <Text style={styles.cityCountry}>
                              {result.country}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Recovery Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View
                style={[styles.stepBadge, isRecoverySet && styles.stepBadgeDone]}
              >
                {isRecoverySet ? (
                  <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.stepNumber}>3</Text>
                )}
              </View>
              <View style={styles.sectionTitleWrap}>
                <Text style={styles.sectionTitle}>{t.recovery.title}</Text>
                <Text style={styles.sectionSubtitle}>{t.recovery.subtitle}</Text>
              </View>
            </View>

            <View style={styles.sectionContent}>
              {isRecoverySet ? (
                <>
                  {/* Master Key display */}
                  <View style={styles.masterKeyCard}>
                    <MaterialCommunityIcons
                      name="key-variant"
                      size={24}
                      color={Colors.warning}
                    />
                    <View style={styles.masterKeyContent}>
                      <Text style={styles.masterKeyLabel}>
                        {t.recovery.masterKeyLabel}
                      </Text>
                      <Text style={styles.masterKeyValue}>
                        {generatedMasterKey}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={handleCopyMasterKey}
                      style={styles.copyButton}
                    >
                      <MaterialCommunityIcons
                        name={masterKeyCopied ? 'check' : 'content-copy'}
                        size={20}
                        color={masterKeyCopied ? Colors.success : Colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.warningCard}>
                    <MaterialCommunityIcons
                      name="alert-circle-outline"
                      size={18}
                      color={Colors.warning}
                    />
                    <Text style={styles.warningText}>
                      {t.recovery.masterKeyWarning}
                    </Text>
                  </View>
                  <View style={[styles.successCard, { marginTop: Spacing.md }]}>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={32}
                      color={Colors.success}
                    />
                    <Text style={styles.successText}>{t.recovery.configured}</Text>
                  </View>
                </>
              ) : (
                <>
                  {/* Security Question Picker */}
                  <Text style={styles.recoveryLabel}>
                    {t.recovery.questionLabel}
                  </Text>
                  <TouchableOpacity
                    style={styles.questionSelector}
                    onPress={() => setShowQuestionPicker(!showQuestionPicker)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.questionSelectorText,
                        selectedQuestionIndex === null && styles.questionSelectorPlaceholder,
                      ]}
                      numberOfLines={2}
                    >
                      {selectedQuestionIndex !== null
                        ? t.recovery.questions[selectedQuestionIndex]
                        : t.recovery.questionPlaceholder}
                    </Text>
                    <MaterialCommunityIcons
                      name={showQuestionPicker ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={Colors.light.textSecondary}
                    />
                  </TouchableOpacity>

                  {showQuestionPicker && (
                    <View style={styles.questionList}>
                      {t.recovery.questions.map((question, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.questionItem,
                            selectedQuestionIndex === index && styles.questionItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedQuestionIndex(index);
                            setShowQuestionPicker(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.questionItemText,
                              selectedQuestionIndex === index && styles.questionItemTextSelected,
                            ]}
                          >
                            {question}
                          </Text>
                          {selectedQuestionIndex === index && (
                            <MaterialCommunityIcons
                              name="check"
                              size={18}
                              color={Colors.primary}
                            />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Answer Input */}
                  {selectedQuestionIndex !== null && (
                    <View style={styles.answerSection}>
                      <Text style={styles.recoveryLabel}>
                        {t.recovery.answerLabel}
                      </Text>
                      <Input
                        placeholder={t.recovery.answerPlaceholder}
                        value={securityAnswer}
                        onChangeText={setSecurityAnswer}
                        leftIcon={
                          <MaterialCommunityIcons
                            name="lock-question"
                            size={20}
                            color={Colors.light.textSecondary}
                          />
                        }
                      />
                      <Text style={styles.answerHint}>
                        {t.recovery.answerHint}
                      </Text>

                      <Button
                        title={translations.common.confirm}
                        onPress={handleSetupRecovery}
                        size="medium"
                        fullWidth
                        loading={isSettingUpRecovery}
                        disabled={!canSetupRecovery || isSettingUpRecovery}
                        icon={
                          <MaterialCommunityIcons
                            name="shield-check"
                            size={18}
                            color="#FFFFFF"
                          />
                        }
                        style={{ marginTop: Spacing.md }}
                      />
                    </View>
                  )}
                </>
              )}
            </View>
          </View>

          {/* Spacer for button */}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Bottom CTA */}
        <View style={styles.bottomContainer}>
          <Button
            title={t.startButton}
            onPress={handleStart}
            size="large"
            fullWidth
            loading={isLoading}
            disabled={!canStart || isLoading}
            icon={
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color="#FFFFFF"
              />
            }
            iconPosition="right"
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
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Sections
  section: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeDone: {
    backgroundColor: Colors.success,
  },
  stepNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitleWrap: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sectionContent: {
    padding: Spacing.lg,
  },

  // PIN
  pinHint: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  pinSteps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: Spacing.lg,
  },
  pinStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.light.border,
  },
  pinStepActive: {
    backgroundColor: Colors.primary,
  },
  pinBackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  pinBackText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Success
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.success + '12',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  successText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.success,
  },

  // City
  selectedCityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.success + '12',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  selectedCityInfo: {
    flex: 1,
  },
  selectedCityName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  selectedCityCountry: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  changeCityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyResults: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  resultsContainer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  cityItemText: {
    flex: 1,
  },
  cityName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cityCountry: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },

  // Recovery
  recoveryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  questionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  questionSelectorText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  questionSelectorPlaceholder: {
    color: Colors.light.textSecondary,
  },
  questionList: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    overflow: 'hidden',
  },
  questionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: Spacing.sm,
  },
  questionItemSelected: {
    backgroundColor: Colors.primary + '08',
  },
  questionItemText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 18,
  },
  questionItemTextSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
  answerSection: {
    marginTop: Spacing.lg,
  },
  answerHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  masterKeyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.warning + '12',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  masterKeyContent: {
    flex: 1,
  },
  masterKeyLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  masterKeyValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '08',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '500',
    lineHeight: 18,
  },

  // Bottom button
  bottomContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
});
