/**
 * Breathing Exercise - MuslimGuard
 * Guided breathing with multiple techniques and animated circle
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_MAX = SCREEN_WIDTH * 0.55;
const CIRCLE_MIN = SCREEN_WIDTH * 0.22;
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - 12) / 2;

interface BreathingTechnique {
  id: string;
  label: string;
  subtitle: string;
  timing: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  colorLight: string;
  gradient: [string, string];
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
}

const TECHNIQUES: BreathingTechnique[] = [
  {
    id: 'calm',
    label: 'Doux',
    subtitle: 'Idéal pour débuter',
    timing: '3s · 3s',
    icon: 'weather-windy',
    color: '#0891B2',
    colorLight: '#ECFEFF',
    gradient: ['#0891B2', '#06B6D4'],
    inhale: 3000,
    holdIn: 0,
    exhale: 3000,
    holdOut: 0,
  },
  {
    id: 'coherence',
    label: 'Cohérence',
    subtitle: 'Équilibre & calme',
    timing: '5s · 5s',
    icon: 'heart-pulse',
    color: '#059669',
    colorLight: '#ECFDF5',
    gradient: ['#059669', '#10B981'],
    inhale: 5000,
    holdIn: 0,
    exhale: 5000,
    holdOut: 0,
  },
  {
    id: 'square',
    label: 'Carrée',
    subtitle: 'Focus & clarté',
    timing: '4s · 4s · 4s · 4s',
    icon: 'square-outline',
    color: '#2563EB',
    colorLight: '#EFF6FF',
    gradient: ['#2563EB', '#3B82F6'],
    inhale: 4000,
    holdIn: 4000,
    exhale: 4000,
    holdOut: 4000,
  },
  {
    id: '478',
    label: '4-7-8',
    subtitle: 'Relaxation profonde',
    timing: '4s · 7s · 8s',
    icon: 'moon-waning-crescent',
    color: '#6D28D9',
    colorLight: '#F5F3FF',
    gradient: ['#6D28D9', '#8B5CF6'],
    inhale: 4000,
    holdIn: 7000,
    exhale: 8000,
    holdOut: 0,
  },
];

type Phase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Inspire',
  holdIn: 'Maintiens',
  exhale: 'Expire',
  holdOut: 'Maintiens',
};

const PHASE_ICONS: Record<Phase, keyof typeof MaterialCommunityIcons.glyphMap> = {
  inhale: 'arrow-up-circle-outline',
  holdIn: 'pause-circle-outline',
  exhale: 'arrow-down-circle-outline',
  holdOut: 'pause-circle-outline',
};

export default function BreathingScreen() {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [rounds, setRounds] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('inhale');
  const runningRef = useRef(false);

  useEffect(() => {
    return () => {
      stopExercise();
    };
  }, []);

  // Subtle pulsing glow for exercise screen background
  useEffect(() => {
    if (!isRunning) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [isRunning]);

  const getPhases = (tech: BreathingTechnique): { phase: Phase; duration: number }[] => {
    const phases: { phase: Phase; duration: number }[] = [];
    phases.push({ phase: 'inhale', duration: tech.inhale });
    if (tech.holdIn > 0) phases.push({ phase: 'holdIn', duration: tech.holdIn });
    phases.push({ phase: 'exhale', duration: tech.exhale });
    if (tech.holdOut > 0) phases.push({ phase: 'holdOut', duration: tech.holdOut });
    return phases;
  };

  const animatePhase = (phase: Phase, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      phaseRef.current = phase;
      setCurrentPhase(phase);

      // Haptic feedback at each phase transition
      const hapticStyle =
        phase === 'inhale' || phase === 'exhale'
          ? Haptics.ImpactFeedbackStyle.Light
          : Haptics.ImpactFeedbackStyle.Medium;
      Haptics.impactAsync(hapticStyle);

      const totalSeconds = Math.round(duration / 1000);
      setCountdown(totalSeconds);

      let remaining = totalSeconds;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining >= 0) setCountdown(remaining);
      }, 1000);

      let toScale: number;
      let toOpacity: number;

      switch (phase) {
        case 'inhale':
          toScale = 1;
          toOpacity = 1;
          break;
        case 'holdIn':
          toScale = 1;
          toOpacity = 0.85;
          break;
        case 'exhale':
          toScale = 0;
          toOpacity = 0.4;
          break;
        case 'holdOut':
          toScale = 0;
          toOpacity = 0.4;
          break;
      }

      const anim = Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: toScale,
          duration: phase === 'holdIn' || phase === 'holdOut' ? 300 : duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: toOpacity,
          duration: phase === 'holdIn' || phase === 'holdOut' ? 300 : duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]);

      animRef.current = anim;

      if (phase === 'holdIn' || phase === 'holdOut') {
        anim.start(() => {
          if (!runningRef.current) return resolve();
          setTimeout(() => {
            if (timerRef.current) clearInterval(timerRef.current);
            resolve();
          }, duration - 300);
        });
      } else {
        anim.start(() => {
          if (timerRef.current) clearInterval(timerRef.current);
          resolve();
        });
      }
    });
  };

  const runCycle = async (tech: BreathingTechnique) => {
    const phases = getPhases(tech);
    while (runningRef.current) {
      for (const { phase, duration } of phases) {
        if (!runningRef.current) return;
        await animatePhase(phase, duration);
      }
      if (runningRef.current) setRounds((prev) => prev + 1);
    }
  };

  const startExercise = (tech: BreathingTechnique) => {
    setSelectedTechnique(tech);
    setIsRunning(true);
    setRounds(0);
    setCurrentPhase('inhale');
    runningRef.current = true;
    scaleAnim.setValue(0);
    opacityAnim.setValue(0.4);
    runCycle(tech);
  };

  const stopExercise = () => {
    runningRef.current = false;
    setIsRunning(false);
    if (animRef.current) animRef.current.stop();
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    scaleAnim.setValue(0);
    opacityAnim.setValue(0.4);
  };

  const goBack = () => {
    if (isRunning) {
      stopExercise();
      setSelectedTechnique(null);
    } else if (selectedTechnique) {
      setSelectedTechnique(null);
    } else {
      router.back();
    }
  };

  const circleScale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCLE_MIN / CIRCLE_MAX, 1],
  });

  // ─── Selection Screen ─────────────────────────────────────
  if (!selectedTechnique) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#EEF2FF', '#F8FAFC', '#F0FDFA']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={styles.selHeader}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={Colors.primary} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.selContent}
        >
          {/* Hero */}
          <View style={styles.heroSection}>
            <View style={styles.heroIconWrap}>
              <LinearGradient
                colors={['#E0E7FF', '#C7D2FE']}
                style={styles.heroIconBg}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <MaterialCommunityIcons name="weather-windy" size={40} color="#4338CA" />
            </View>
            <Text style={styles.heroTitle}>Respiration{'\n'}guidée</Text>
            <Text style={styles.heroSubtitle}>
              Choisis un exercice et laisse-toi guider
            </Text>
          </View>

          {/* Grid */}
          <View style={styles.grid}>
            {TECHNIQUES.map((tech, index) => (
              <Pressable
                key={tech.id}
                onPress={() => startExercise(tech)}
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.cardPressed,
                ]}
              >
                <LinearGradient
                  colors={tech.gradient}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Decorative circle */}
                  <View style={[styles.cardDecor, { backgroundColor: '#FFFFFF15' }]} />

                  <View style={styles.cardIconRow}>
                    <View style={styles.cardIconCircle}>
                      <MaterialCommunityIcons name={tech.icon} size={24} color={tech.color} />
                    </View>
                  </View>

                  <Text style={styles.cardLabel}>{tech.label}</Text>
                  <Text style={styles.cardSubtitle}>{tech.subtitle}</Text>

                  <View style={styles.cardTimingRow}>
                    <MaterialCommunityIcons name="timer-outline" size={13} color="#FFFFFFBB" />
                    <Text style={styles.cardTiming}>{tech.timing}</Text>
                  </View>

                  <View style={styles.cardPlayRow}>
                    <MaterialCommunityIcons name="play-circle" size={28} color="#FFFFFFDD" />
                  </View>
                </LinearGradient>
              </Pressable>
            ))}
          </View>

          {/* Tip */}
          <View style={styles.tipBox}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.tipIconWrap}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.tipText}>
              Installe-toi confortablement, ferme les yeux et suis le rythme.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ─── Exercise Screen ──────────────────────────────────────
  const tech = selectedTechnique;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tech.colorLight }]}>
      <LinearGradient
        colors={[tech.colorLight, '#FFFFFF', tech.colorLight]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Header */}
      <View style={styles.exHeader}>
        <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: tech.color + '15' }]}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={tech.color} />
        </Pressable>
        <View style={styles.exHeaderCenter}>
          <Text style={[styles.exHeaderLabel, { color: tech.color }]}>{tech.label}</Text>
          <Text style={styles.exHeaderSub}>{tech.subtitle}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Breathing Circle */}
      <View style={styles.circleContainer}>
        {/* Outer glow rings */}
        <Animated.View
          style={[
            styles.glowRing3,
            {
              borderColor: tech.color + '08',
              opacity: glowAnim,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.glowRing2,
            {
              borderColor: tech.color + '12',
              opacity: glowAnim,
            },
          ]}
        />
        <View style={[styles.outerRing, { borderColor: tech.color + '20' }]}>
          <Animated.View
            style={[
              styles.circle,
              {
                width: CIRCLE_MAX,
                height: CIRCLE_MAX,
                borderRadius: CIRCLE_MAX / 2,
                opacity: opacityAnim,
                transform: [{ scale: circleScale }],
                overflow: 'hidden',
              },
            ]}
          >
            <LinearGradient
              colors={tech.gradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.circleContent}>
              <MaterialCommunityIcons
                name={PHASE_ICONS[currentPhase]}
                size={32}
                color="#FFFFFF"
              />
              <Text style={styles.phaseLabel}>{PHASE_LABELS[currentPhase]}</Text>
              {countdown > 0 && (
                <Text style={styles.countdownText}>{countdown}</Text>
              )}
            </View>
          </Animated.View>
        </View>
      </View>

      {/* Bottom area */}
      <View style={styles.exBottom}>
        {/* Rounds */}
        <View style={[styles.roundsBadge, { backgroundColor: tech.color + '12' }]}>
          <MaterialCommunityIcons name="repeat" size={16} color={tech.color} />
          <Text style={[styles.roundsText, { color: tech.color }]}>
            {rounds} cycle{rounds !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Stop button */}
        <Pressable onPress={goBack} style={styles.stopBtnWrap}>
          <LinearGradient
            colors={tech.gradient}
            style={styles.stopBtn}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="stop-circle-outline" size={22} color="#FFFFFF" />
            <Text style={styles.stopBtnText}>Arrêter</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },

  // ─── Selection Screen ───
  selHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  selContent: {
    paddingBottom: Spacing.xl,
  },

  // Hero
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  heroIconBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 21,
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  cardGradient: {
    borderRadius: 20,
    padding: Spacing.md,
    paddingTop: 18,
    paddingBottom: 14,
    minHeight: 175,
    overflow: 'hidden',
  },
  cardDecor: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cardIconRow: {
    marginBottom: 10,
  },
  cardIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#FFFFFFEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#FFFFFFCC',
    marginTop: 2,
    fontWeight: '500',
  },
  cardTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  cardTiming: {
    fontSize: 11,
    color: '#FFFFFFBB',
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardPlayRow: {
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: 6,
  },

  // Tip
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: 14,
    borderRadius: 16,
    gap: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },

  // ─── Exercise Screen ───
  exHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  exHeaderCenter: {
    flex: 1,
    alignItems: 'center',
  },
  exHeaderLabel: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  exHeaderSub: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },

  // Circle
  circleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing3: {
    position: 'absolute',
    width: CIRCLE_MAX + 80,
    height: CIRCLE_MAX + 80,
    borderRadius: (CIRCLE_MAX + 80) / 2,
    borderWidth: 1.5,
  },
  glowRing2: {
    position: 'absolute',
    width: CIRCLE_MAX + 48,
    height: CIRCLE_MAX + 48,
    borderRadius: (CIRCLE_MAX + 48) / 2,
    borderWidth: 1.5,
  },
  outerRing: {
    width: CIRCLE_MAX + 24,
    height: CIRCLE_MAX + 24,
    borderRadius: (CIRCLE_MAX + 24) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  countdownText: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },

  // Bottom
  exBottom: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  roundsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  roundsText: {
    fontSize: 15,
    fontWeight: '700',
  },
  stopBtnWrap: {
    width: '100%',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  stopBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
