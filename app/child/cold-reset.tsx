/**
 * Cold Reset Exercise - MuslimGuard
 * Helps children break out of sadness with a cold water sensory reset.
 * 30-second timer with water drop animation.
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
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CIRCLE_SIZE = SCREEN_WIDTH * 0.55;
const TIMER_DURATION = 30;

const TIPS = [
  'Va te laver les mains \u00e0 l\u2019eau tr\u00e8s froide pendant 30 secondes',
  'Demande un verre d\u2019eau avec deux gla\u00e7ons et bois-le tr\u00e8s doucement',
];

type Phase = 'choose' | 'running' | 'done';

export default function ColdResetScreen() {
  const [phase, setPhase] = useState<Phase>('choose');
  const [selectedTip, setSelectedTip] = useState(0);
  const [seconds, setSeconds] = useState(TIMER_DURATION);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const dropAnims = useRef(
    Array.from({ length: 5 }, () => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Water drop animation loop
  useEffect(() => {
    if (phase !== 'running') return;

    const animations = dropAnims.map((drop, i) => {
      const delay = i * 400;
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(drop.opacity, {
              toValue: 0.8,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(drop.y, {
              toValue: 1,
              duration: 1800,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(drop.opacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(drop.y, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ]),
        ]),
      );
    });

    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [phase]);

  // Pulse animation on circle
  useEffect(() => {
    if (phase !== 'running') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [phase]);

  const startTimer = (tipIndex: number) => {
    setSelectedTip(tipIndex);
    setPhase('running');
    setSeconds(TIMER_DURATION);

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Progress arc animation
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: TIMER_DURATION * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Countdown
    let remaining = TIMER_DURATION;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);
      if (remaining <= 5 && remaining > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('done');
      }
    }, 1000);
  };

  const handleBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  // ─── Choose phase ──────────────────────────────────────
  if (phase === 'choose') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#EEF2FF', '#E0E7FF', '#F8FAFF']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#6366F1" />
          </Pressable>
        </View>

        <View style={styles.chooseContent}>
          <View style={styles.heroIcon}>
            <LinearGradient
              colors={['#E0E7FF', '#C7D2FE']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <MaterialCommunityIcons name="snowflake" size={40} color="#6366F1" />
          </View>

          <Text style={styles.chooseTitle}>Reset par le froid</Text>
          <Text style={styles.chooseSubtitle}>
            Le froid aide ton corps {'\u00e0'} se r{'\u00e9'}initialiser.{'\n'}Choisis une action :
          </Text>

          {TIPS.map((tip, i) => (
            <Pressable
              key={i}
              onPress={() => startTimer(i)}
              style={({ pressed }) => [
                styles.tipCard,
                pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
              ]}
            >
              <LinearGradient
                colors={['#6366F1', '#818CF8']}
                style={styles.tipCardGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <MaterialCommunityIcons
                  name={i === 0 ? 'hand-wash' : 'cup-water'}
                  size={28}
                  color="#FFFFFF"
                />
                <Text style={styles.tipCardText}>{tip}</Text>
                <MaterialCommunityIcons name="chevron-right" size={22} color="#FFFFFFBB" />
              </LinearGradient>
            </Pressable>
          ))}

          <View style={styles.whyBox}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color="#F59E0B" />
            <Text style={styles.whyText}>
              Le froid force ton syst{'\u00e8'}me nerveux {'\u00e0'} se "r{'\u00e9'}initialiser".
              C'est un signal plus fort que la tristesse !
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Running / Done phase ──────────────────────────────
  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#E0E7FF', '#EEF2FF', '#F8FAFF']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#6366F1" />
        </Pressable>
        <Text style={styles.headerTitle}>Reset par le froid</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Instruction */}
      <View style={styles.instructionBar}>
        <MaterialCommunityIcons
          name={selectedTip === 0 ? 'hand-wash' : 'cup-water'}
          size={20}
          color="#6366F1"
        />
        <Text style={styles.instructionText}>{TIPS[selectedTip]}</Text>
      </View>

      {/* Timer Circle */}
      <View style={styles.circleArea}>
        {/* Water drops */}
        {dropAnims.map((drop, i) => {
          const xOffset = (i - 2) * 30;
          return (
            <Animated.View
              key={i}
              style={[
                styles.waterDrop,
                {
                  left: SCREEN_WIDTH / 2 + xOffset - 10,
                  opacity: drop.opacity,
                  transform: [
                    {
                      translateY: drop.y.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-20, CIRCLE_SIZE + 40],
                      }),
                    },
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons name="water" size={20} color="#818CF8" />
            </Animated.View>
          );
        })}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View style={styles.outerRing}>
            <LinearGradient
              colors={phase === 'done' ? ['#10B981', '#34D399'] : ['#6366F1', '#818CF8']}
              style={styles.timerCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {phase === 'running' ? (
                <>
                  <MaterialCommunityIcons name="snowflake" size={36} color="#FFFFFF" />
                  <Text style={styles.timerText}>{seconds}</Text>
                  <Text style={styles.timerLabel}>secondes</Text>
                </>
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={48} color="#FFFFFF" />
                  <Text style={styles.doneText}>Bravo !</Text>
                </>
              )}
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: progress }]}>
            <LinearGradient
              colors={phase === 'done' ? ['#10B981', '#34D399'] : ['#6366F1', '#818CF8']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Bottom */}
      <View style={styles.bottom}>
        {phase === 'done' ? (
          <>
            <Text style={styles.doneMessage}>
              Tu as {'\u00e9'}t{'\u00e9'} courageux ! Ton corps se sent d{'\u00e9'}j{'\u00e0'} mieux.
            </Text>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [styles.doneBtn, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={['#10B981', '#34D399']}
                style={styles.doneBtnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
                <Text style={styles.doneBtnText}>Retour</Text>
              </LinearGradient>
            </Pressable>
          </>
        ) : (
          <Text style={styles.encouragement}>
            Concentre-toi sur la sensation du froid...
          </Text>
        )}
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
    color: '#6366F1',
  },

  // Choose phase
  chooseContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    paddingTop: Spacing.xl,
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
  chooseTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  chooseSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  tipCard: {
    width: '100%',
    borderRadius: 18,
    marginBottom: Spacing.md,
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  tipCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: 18,
    gap: Spacing.md,
  },
  tipCardText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  whyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  whyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },

  // Running phase
  instructionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    lineHeight: 20,
  },

  // Circle area
  circleArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerRing: {
    width: CIRCLE_SIZE + 20,
    height: CIRCLE_SIZE + 20,
    borderRadius: (CIRCLE_SIZE + 20) / 2,
    borderWidth: 2,
    borderColor: '#6366F120',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 4,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFFCC',
    marginTop: -4,
  },
  doneText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: Spacing.sm,
  },

  // Water drops
  waterDrop: {
    position: 'absolute',
    top: 20,
  },

  // Progress bar
  progressBarBg: {
    width: SCREEN_WIDTH - Spacing.lg * 4,
    height: 8,
    backgroundColor: '#E0E7FF',
    borderRadius: 4,
    marginTop: Spacing.xl,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Bottom
  bottom: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  encouragement: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  doneMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    textAlign: 'center',
    lineHeight: 24,
  },
  doneBtn: {
    width: '100%',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  doneBtnGradient: {
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
