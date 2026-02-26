/**
 * Anger Release - MuslimGuard
 * Two techniques to release anger safely:
 * 1. "Hydraulic Press" - isometric push against a wall (hold button 10s)
 * 2. Prophetic steps - sit down, lie down, make wudu
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = SCREEN_WIDTH - Spacing.lg * 4;
const PRESS_DURATION = 10;

const PROPHETIC_STEPS = [
  {
    id: 'silence',
    icon: 'chat-remove' as const,
    title: 'Tais-toi',
    desc: 'Le Prophète ﷺ a dit : quand tu es en colère, tais-toi.',
    action: 'Reste silencieux pendant 10 secondes.',
  },
  {
    id: 'sit',
    icon: 'seat' as const,
    title: 'Assieds-toi',
    desc: 'Si tu es debout, assieds-toi. La colère diminue quand on change de position.',
    action: 'Assieds-toi maintenant et respire.',
  },
  {
    id: 'liedown',
    icon: 'bed' as const,
    title: 'Allonge-toi',
    desc: `Si la colère persiste, allonge-toi. C'est la Sunna du Prophète ﷺ.`,
    action: 'Allonge-toi quelques instants.',
  },
  {
    id: 'wudu',
    icon: 'hand-wash' as const,
    title: 'Fais tes ablutions',
    desc: `La colère est comme le feu, et les ablutions avec de l'eau l'éteignent.`,
    action: `Va faire tes ablutions avec de l'eau fraîche.`,
  },
];

type Screen = 'choose' | 'press' | 'prophetic' | 'done';

export default function AngerReleaseScreen() {
  const [screen, setScreen] = useState<Screen>('choose');
  const [pressing, setPressing] = useState(false);
  const [pressSeconds, setPressSeconds] = useState(0);
  const [pressComplete, setPressComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepTimerActive, setStepTimerActive] = useState(false);
  const [stepSeconds, setStepSeconds] = useState(10);

  const pressAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hapticRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (hapticRef.current) clearInterval(hapticRef.current);
    };
  }, []);

  // ─── Hydraulic Press Logic ─────────────────────────────

  const startPress = () => {
    setPressing(true);
    setPressSeconds(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // Pressure bar fill
    pressAnim.setValue(0);
    Animated.timing(pressAnim, {
      toValue: 1,
      duration: PRESS_DURATION * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Shake effect
    const shake = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -2, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]),
    );
    shake.start();

    // Haptic feedback every 500ms while pressing
    hapticRef.current = setInterval(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 500);

    // Countdown
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setPressSeconds(elapsed);
      if (elapsed >= PRESS_DURATION) {
        endPress(true);
      }
    }, 1000);
  };

  const endPress = (completed: boolean) => {
    setPressing(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (hapticRef.current) clearInterval(hapticRef.current);
    shakeAnim.setValue(0);

    if (completed) {
      setPressComplete(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Released too early - reset
      pressAnim.setValue(0);
      setPressSeconds(0);
    }
  };

  const releasePress = () => {
    if (pressing && !pressComplete) {
      endPress(false);
    }
  };

  // ─── Prophetic Steps Logic ─────────────────────────────

  const startStepTimer = () => {
    setStepTimerActive(true);
    setStepSeconds(10);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    let remaining = 10;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setStepSeconds(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setStepTimerActive(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }, 1000);
  };

  const nextStep = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStepTimerActive(false);
    if (currentStep < PROPHETIC_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setScreen('done');
    }
  };

  const goToAblutions = () => {
    router.push('/child/ablutions');
  };

  const handleBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (hapticRef.current) clearInterval(hapticRef.current);
    router.back();
  };

  const pressWidth = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const pressColor = pressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#EF4444', '#F59E0B', '#10B981'],
  });

  // ─── Choose Screen ─────────────────────────────────────
  if (screen === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FEF2F2', '#FEE2E2', '#FFF5F5']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#EF4444" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.chooseContent} showsVerticalScrollIndicator={false}>
          <View style={styles.heroIcon}>
            <LinearGradient
              colors={['#FEE2E2', '#FECACA']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <MaterialCommunityIcons name="fire" size={40} color="#EF4444" />
          </View>

          <Text style={styles.heroTitle}>Libère ta colère</Text>
          <Text style={styles.heroSubtitle}>
            Choisis un exercice pour te calmer{'\n'}en toute sécurité
          </Text>

          {/* Hydraulic Press Card */}
          <Pressable
            onPress={() => setScreen('press')}
            style={({ pressed }) => [styles.choiceCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={['#EF4444', '#F87171']}
              style={styles.choiceCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.choiceCardIcon}>
                <MaterialCommunityIcons name="arm-flex" size={32} color="#EF4444" />
              </View>
              <View style={styles.choiceCardTextWrap}>
                <Text style={styles.choiceCardTitle}>Presse Hydraulique</Text>
                <Text style={styles.choiceCardDesc}>
                  Pousse le mur de toutes tes forces pendant 10 secondes
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFFBB" />
            </LinearGradient>
          </Pressable>

          {/* Prophetic Steps Card */}
          <Pressable
            onPress={() => { setScreen('prophetic'); setCurrentStep(0); }}
            style={({ pressed }) => [styles.choiceCard, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
          >
            <LinearGradient
              colors={['#D97706', '#F59E0B']}
              style={styles.choiceCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.choiceCardIcon}>
                <MaterialCommunityIcons name="star-crescent" size={32} color="#D97706" />
              </View>
              <View style={styles.choiceCardTextWrap}>
                <Text style={styles.choiceCardTitle}>La méthode du Prophète ﷺ</Text>
                <Text style={styles.choiceCardDesc}>
                  Tais-toi, assieds-toi, allonge-toi, fais tes ablutions
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color="#FFFFFFBB" />
            </LinearGradient>
          </Pressable>

          {/* Dua reminder */}
          <View style={styles.duaReminder}>
            <MaterialCommunityIcons name="shield-cross-outline" size={18} color="#EF4444" />
            <Text style={styles.duaReminderText}>
              A'oudhou billahi min ash-shaytan ar-rajim
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Hydraulic Press Screen ────────────────────────────
  if (screen === 'press') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={pressComplete ? ['#ECFDF5', '#D1FAE5', '#F0FDF4'] : ['#FEF2F2', '#FEE2E2', '#FFF5F5']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={() => { endPress(false); setScreen('choose'); }} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={pressComplete ? '#10B981' : '#EF4444'} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: pressComplete ? '#10B981' : '#EF4444' }]}>
            Presse Hydraulique
          </Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.pressContent}>
          {!pressComplete ? (
            <>
              {/* Instructions */}
              <View style={styles.pressInstructions}>
                <MaterialCommunityIcons name="information-outline" size={20} color="#EF4444" />
                <Text style={styles.pressInstructionText}>
                  Pose tes mains contre un mur.{'\n'}Pousse de toutes tes forces !
                </Text>
              </View>

              {/* Pressure gauge */}
              <Animated.View style={{ transform: [{ translateX: pressing ? shakeAnim : 0 }] }}>
                <View style={styles.gaugeContainer}>
                  <View style={styles.gaugeBg}>
                    <Animated.View style={[styles.gaugeFill, { width: pressWidth, backgroundColor: pressColor }]} />
                  </View>
                  <Text style={styles.gaugeLabel}>
                    {pressing ? `${pressSeconds}s / ${PRESS_DURATION}s` : 'Maintiens le bouton'}
                  </Text>
                </View>

                {/* Power indicator */}
                <View style={styles.powerRow}>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.powerBlock,
                        {
                          backgroundColor: i < pressSeconds
                            ? (i < 4 ? '#EF4444' : i < 7 ? '#F59E0B' : '#10B981')
                            : '#FEE2E2',
                        },
                      ]}
                    />
                  ))}
                </View>
              </Animated.View>

              {/* Hold button */}
              <Pressable
                onPressIn={startPress}
                onPressOut={releasePress}
                style={({ pressed }) => [
                  styles.holdBtnOuter,
                  pressing && styles.holdBtnActive,
                ]}
              >
                <LinearGradient
                  colors={pressing ? ['#DC2626', '#B91C1C'] : ['#EF4444', '#F87171']}
                  style={styles.holdBtn}
                >
                  <MaterialCommunityIcons
                    name={pressing ? 'fire' : 'arm-flex'}
                    size={40}
                    color="#FFFFFF"
                  />
                  <Text style={styles.holdBtnText}>
                    {pressing ? 'POUSSE !' : 'MAINTIENS ICI'}
                  </Text>
                </LinearGradient>
              </Pressable>

              {pressing && (
                <Text style={styles.holdHint}>Ne lâche pas !</Text>
              )}
            </>
          ) : (
            /* Press complete */
            <View style={styles.completeSection}>
              <MaterialCommunityIcons name="check-circle" size={64} color="#10B981" />
              <Text style={styles.completeTitle}>Bravo !</Text>
              <Text style={styles.completeText}>
                Tu as libéré toute cette énergie.{'\n'}Ton corps se sent déjà plus léger.
              </Text>

              <Pressable
                onPress={() => { setPressComplete(false); setPressSeconds(0); pressAnim.setValue(0); }}
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="repeat" size={18} color="#EF4444" />
                <Text style={styles.retryBtnText}>Recommencer</Text>
              </Pressable>

              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [styles.doneBtnWrap, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.doneBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
                  <Text style={styles.doneBtnText}>Retour</Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ─── Prophetic Steps Screen ────────────────────────────
  if (screen === 'prophetic') {
    const step = PROPHETIC_STEPS[currentStep];
    const isLastStep = currentStep === PROPHETIC_STEPS.length - 1;

    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#FFFBEB', '#FEF3C7', '#FFFFF0']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={() => { if (timerRef.current) clearInterval(timerRef.current); setScreen('choose'); }} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#D97706" />
          </Pressable>
          <Text style={[styles.headerTitle, { color: '#D97706' }]}>
            Méthode prophétique
          </Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Progress dots */}
        <View style={styles.stepDots}>
          {PROPHETIC_STEPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i <= currentStep ? { backgroundColor: '#D97706' } : { backgroundColor: '#FDE68A' },
                i === currentStep && { width: 24 },
              ]}
            />
          ))}
        </View>

        <View style={styles.stepContent}>
          {/* Step card */}
          <View style={styles.stepCard}>
            <LinearGradient
              colors={['#FEF3C7', '#FFFFFF']}
              style={styles.stepCardGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              <View style={[styles.stepIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name={step.icon} size={40} color="#D97706" />
              </View>

              <Text style={styles.stepNumber}>Étape {currentStep + 1}/{PROPHETIC_STEPS.length}</Text>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>

              <View style={styles.stepActionBox}>
                <MaterialCommunityIcons name="arrow-right-circle" size={18} color="#D97706" />
                <Text style={styles.stepActionText}>{step.action}</Text>
              </View>

              {/* Timer for silence step */}
              {step.id === 'silence' && (
                <View style={styles.stepTimerWrap}>
                  {!stepTimerActive && stepSeconds === 10 ? (
                    <Pressable
                      onPress={startStepTimer}
                      style={({ pressed }) => [styles.stepTimerBtn, pressed && { opacity: 0.85 }]}
                    >
                      <LinearGradient
                        colors={['#D97706', '#F59E0B']}
                        style={styles.stepTimerBtnGradient}
                      >
                        <MaterialCommunityIcons name="timer-outline" size={20} color="#FFFFFF" />
                        <Text style={styles.stepTimerBtnText}>Lancer 10 secondes</Text>
                      </LinearGradient>
                    </Pressable>
                  ) : stepTimerActive ? (
                    <View style={styles.stepTimerDisplay}>
                      <Text style={styles.stepTimerCount}>{stepSeconds}</Text>
                      <Text style={styles.stepTimerLabel}>secondes</Text>
                    </View>
                  ) : (
                    <View style={styles.stepTimerDone}>
                      <MaterialCommunityIcons name="check-circle" size={28} color="#10B981" />
                      <Text style={styles.stepTimerDoneText}>Bien joué !</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Ablutions shortcut */}
              {step.id === 'wudu' && (
                <Pressable
                  onPress={goToAblutions}
                  style={({ pressed }) => [styles.wuduBtn, pressed && { opacity: 0.85 }]}
                >
                  <LinearGradient
                    colors={['#0891B2', '#06B6D4']}
                    style={styles.wuduBtnGradient}
                  >
                    <MaterialCommunityIcons name="hand-wash" size={20} color="#FFFFFF" />
                    <Text style={styles.wuduBtnText}>Voir le guide des ablutions</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </LinearGradient>
          </View>

          {/* Next button */}
          <Pressable
            onPress={nextStep}
            style={({ pressed }) => [styles.nextBtnWrap, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={isLastStep ? ['#10B981', '#34D399'] : ['#D97706', '#F59E0B']}
              style={styles.nextBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextBtnText}>
                {isLastStep ? 'Terminer' : 'Étape suivante'}
              </Text>
              <MaterialCommunityIcons
                name={isLastStep ? 'check' : 'arrow-right'}
                size={22}
                color="#FFFFFF"
              />
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Done Screen ───────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#ECFDF5', '#D1FAE5', '#F0FDF4']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.doneContent}>
        <MaterialCommunityIcons name="check-decagram" size={72} color="#10B981" />
        <Text style={styles.doneTitle}>MashaAllah !</Text>
        <Text style={styles.doneSubtext}>
          Tu as suivi les conseils du Prophète ﷺ.{'\n'}La colère ne te contrôle plus.
        </Text>

        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.doneBtnWrap, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={['#10B981', '#34D399']}
            style={styles.doneBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
            <Text style={styles.doneBtnText}>Retour</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
  },

  // Choose screen
  chooseContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },

  // Choice cards
  choiceCard: {
    width: '100%',
    borderRadius: 18,
    marginBottom: Spacing.md,
    elevation: 6,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  choiceCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 18,
    gap: Spacing.md,
  },
  choiceCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFFEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceCardTextWrap: {
    flex: 1,
  },
  choiceCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  choiceCardDesc: {
    fontSize: 13,
    color: '#FFFFFFCC',
    marginTop: 3,
    lineHeight: 18,
    fontWeight: '500',
  },
  duaReminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  duaReminderText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
    fontStyle: 'italic',
  },

  // Press screen
  pressContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: Spacing.xxl,
  },
  pressInstructionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
    lineHeight: 22,
  },

  // Gauge
  gaugeContainer: {
    width: BAR_WIDTH,
    marginBottom: Spacing.lg,
  },
  gaugeBg: {
    width: '100%',
    height: 24,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 12,
  },
  gaugeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },

  // Power blocks
  powerRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
  },
  powerBlock: {
    width: (BAR_WIDTH - 36) / 10,
    height: 12,
    borderRadius: 3,
  },

  // Hold button
  holdBtnOuter: {
    borderRadius: 50,
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  holdBtnActive: {
    elevation: 16,
    shadowOpacity: 0.5,
    transform: [{ scale: 1.05 }],
  },
  holdBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  holdBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  holdHint: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginTop: Spacing.lg,
    fontStyle: 'italic',
  },

  // Complete
  completeSection: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  completeTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
  },
  completeText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 12,
    marginTop: Spacing.md,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },

  // Prophetic steps
  stepDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  stepCard: {
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  stepCardGradient: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
  },
  stepIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepDesc: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  stepActionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    backgroundColor: '#FEF3C7',
    borderRadius: BorderRadius.xl,
    width: '100%',
  },
  stepActionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#D97706',
  },

  // Step timer
  stepTimerWrap: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  stepTimerBtn: {
    borderRadius: BorderRadius.full,
    elevation: 4,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  stepTimerBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  stepTimerBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepTimerDisplay: {
    alignItems: 'center',
  },
  stepTimerCount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#D97706',
  },
  stepTimerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  stepTimerDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepTimerDoneText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },

  // Wudu button
  wuduBtn: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.full,
    width: '100%',
    elevation: 4,
    shadowColor: '#0891B2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  wuduBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  wuduBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Next button
  nextBtnWrap: {
    marginTop: Spacing.xl,
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Done screen
  doneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  doneTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#10B981',
  },
  doneSubtext: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  doneBtnWrap: {
    width: '100%',
    borderRadius: 16,
    marginTop: Spacing.lg,
    elevation: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  doneBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
