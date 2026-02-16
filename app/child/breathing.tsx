/**
 * Breathing Exercise - MuslimGuard
 * Guided breathing with multiple techniques and animated circle
 * Helps children relax and focus through breathing exercises
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_MAX = SCREEN_WIDTH * 0.6;
const CIRCLE_MIN = SCREEN_WIDTH * 0.25;

// Breathing techniques
interface BreathingTechnique {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  colorLight: string;
  // Durations in milliseconds
  inhale: number;
  holdIn: number;  // hold after inhale (0 = skip)
  exhale: number;
  holdOut: number; // hold after exhale (0 = skip)
}

const TECHNIQUES: BreathingTechnique[] = [
  {
    id: 'coherence',
    label: 'Cohérence',
    description: 'Inspire 5s, expire 5s\nÉquilibre et calme',
    icon: 'heart-pulse',
    color: '#059669',
    colorLight: '#D1FAE5',
    inhale: 5000,
    holdIn: 0,
    exhale: 5000,
    holdOut: 0,
  },
  {
    id: '478',
    label: '4-7-8',
    description: 'Inspire 4s, maintien 7s, expire 8s\nRelaxation profonde',
    icon: 'moon-waning-crescent',
    color: '#4338CA',
    colorLight: '#E0E7FF',
    inhale: 4000,
    holdIn: 7000,
    exhale: 8000,
    holdOut: 0,
  },
  {
    id: 'square',
    label: 'Carrée',
    description: 'Inspire 4s, maintien 4s\nExpire 4s, maintien 4s',
    icon: 'square-outline',
    color: '#2563EB',
    colorLight: '#DBEAFE',
    inhale: 4000,
    holdIn: 4000,
    exhale: 4000,
    holdOut: 4000,
  },
  {
    id: 'calm',
    label: 'Doux',
    description: 'Inspire 3s, expire 3s\nIdéal pour débuter',
    icon: 'weather-windy',
    color: '#0891B2',
    colorLight: '#CFFAFE',
    inhale: 3000,
    holdIn: 0,
    exhale: 3000,
    holdOut: 0,
  },
];

type Phase = 'inhale' | 'holdIn' | 'exhale' | 'holdOut';

const PHASE_LABELS: Record<Phase, string> = {
  inhale: 'Inspire...',
  holdIn: 'Maintiens...',
  exhale: 'Expire...',
  holdOut: 'Maintiens...',
};

const PHASE_ICONS: Record<Phase, keyof typeof MaterialCommunityIcons.glyphMap> = {
  inhale: 'arrow-up',
  holdIn: 'pause',
  exhale: 'arrow-down',
  holdOut: 'pause',
};

export default function BreathingScreen() {
  const [selectedTechnique, setSelectedTechnique] = useState<BreathingTechnique | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<Phase>('inhale');
  const [rounds, setRounds] = useState(0);
  const [countdown, setCountdown] = useState(0);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0.4)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<Phase>('inhale');
  const runningRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopExercise();
    };
  }, []);

  const getPhases = (tech: BreathingTechnique): { phase: Phase; duration: number }[] => {
    const phases: { phase: Phase; duration: number }[] = [];
    phases.push({ phase: 'inhale', duration: tech.inhale });
    if (tech.holdIn > 0) phases.push({ phase: 'holdIn', duration: tech.holdIn });
    phases.push({ phase: 'exhale', duration: tech.exhale });
    if (tech.holdOut > 0) phases.push({ phase: 'holdOut', duration: tech.holdOut });
    return phases;
  };

  const animatePhase = (
    phase: Phase,
    duration: number,
  ): Promise<void> => {
    return new Promise((resolve) => {
      phaseRef.current = phase;
      setCurrentPhase(phase);

      // Set countdown
      const totalSeconds = Math.round(duration / 1000);
      setCountdown(totalSeconds);

      // Countdown timer
      let remaining = totalSeconds;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        remaining -= 1;
        if (remaining >= 0) {
          setCountdown(remaining);
        }
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
        // For hold phases, animate quickly to hold position then wait
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
      if (runningRef.current) {
        setRounds((prev) => prev + 1);
      }
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
    if (animRef.current) {
      animRef.current.stop();
    }
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

  // Technique selection screen
  if (!selectedTechnique) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Respiration guidée</Text>
            <Text style={styles.headerSubtitle}>Choisis un exercice</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.techniqueList}>
          {TECHNIQUES.map((tech) => (
            <Pressable
              key={tech.id}
              style={({ pressed }) => [
                styles.techniqueCard,
                { borderLeftColor: tech.color },
                pressed && styles.techniqueCardPressed,
              ]}
              onPress={() => startExercise(tech)}
            >
              <View style={[styles.techniqueIcon, { backgroundColor: tech.colorLight }]}>
                <MaterialCommunityIcons name={tech.icon} size={28} color={tech.color} />
              </View>
              <View style={styles.techniqueInfo}>
                <Text style={styles.techniqueName}>{tech.label}</Text>
                <Text style={styles.techniqueDesc}>{tech.description}</Text>
              </View>
              <MaterialCommunityIcons name="play-circle" size={32} color={tech.color} />
            </Pressable>
          ))}
        </View>

        <View style={styles.tipContainer}>
          <MaterialCommunityIcons name="lightbulb-outline" size={18} color={Colors.light.textSecondary} />
          <Text style={styles.tipText}>
            Installe-toi confortablement, ferme les yeux et suis le rythme.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Exercise screen
  const tech = selectedTechnique;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: tech.colorLight }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={goBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={tech.color} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: tech.color }]}>{tech.label}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Breathing Circle */}
      <View style={styles.circleContainer}>
        {/* Outer ring */}
        <View style={[styles.outerRing, { borderColor: tech.color + '20' }]}>
          <Animated.View
            style={[
              styles.circle,
              {
                backgroundColor: tech.color,
                width: CIRCLE_MAX,
                height: CIRCLE_MAX,
                borderRadius: CIRCLE_MAX / 2,
                opacity: opacityAnim,
                transform: [{ scale: circleScale }],
              },
            ]}
          >
            <View style={styles.circleContent}>
              <MaterialCommunityIcons
                name={PHASE_ICONS[currentPhase]}
                size={28}
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

      {/* Rounds counter */}
      <View style={styles.roundsContainer}>
        <View style={[styles.roundsBadge, { backgroundColor: tech.color + '20' }]}>
          <MaterialCommunityIcons name="refresh" size={18} color={tech.color} />
          <Text style={[styles.roundsText, { color: tech.color }]}>
            {rounds} cycle{rounds !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Stop button */}
      <View style={styles.controlsContainer}>
        <Pressable
          style={[styles.stopButton, { backgroundColor: tech.color }]}
          onPress={goBack}
        >
          <MaterialCommunityIcons name="stop" size={24} color="#FFFFFF" />
          <Text style={styles.stopButtonText}>Arrêter</Text>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  // Technique selection
  techniqueList: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  techniqueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    gap: Spacing.md,
  },
  techniqueCardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  techniqueIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techniqueInfo: {
    flex: 1,
  },
  techniqueName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  techniqueDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
  },

  // Tip
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },

  // Exercise screen - circle
  circleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: Spacing.xs,
  },
  countdownText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: Spacing.xs,
  },

  // Rounds
  roundsContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roundsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  roundsText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Controls
  controlsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  stopButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
