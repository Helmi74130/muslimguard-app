/**
 * Métronome Cardiaque - MuslimGuard
 * Cardiac biofeedback: the child taps their heartbeat, then follows a
 * progressively slower visual/audio metronome to achieve cardiac coherence.
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Constants ───────────────────────────────────────────────────────────────
const COLOR = '#8B5CF6';
const COLOR_LIGHT = '#EDE9FE';
const GRADIENT: [string, string] = ['#8B5CF6', '#A78BFA'];

// How many tap samples to collect before computing the average BPM
const TAP_SAMPLES = 6;
// After measuring, slow the metronome by ~20% over N steps
const SLOWDOWN_STEPS = 12;
// Minimum slowdown target (BPM)
const MIN_BPM = 50;

type Phase = 'intro' | 'measuring' | 'syncing' | 'done';

// ─── Helper ──────────────────────────────────────────────────────────────────
function bpmToMs(bpm: number) {
  return Math.round(60000 / bpm);
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function CardiacMetronomeScreen() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [tapCount, setTapCount] = useState(0);
  const [measuredBpm, setMeasuredBpm] = useState<number | null>(null);
  const [currentBpm, setCurrentBpm] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetBpm, setTargetBpm] = useState<number | null>(null);

  // Animated pendulum value: 0 = far left, 1 = far right
  const pendulumAnim = useRef(new Animated.Value(0)).current;
  const heartScaleAnim = useRef(new Animated.Value(1)).current;
  const tapScaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  const tapTimestampsRef = useRef<number[]>([]);
  const metronomeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendulumAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const bpmStepsRef = useRef<number[]>([]);
  const currentBpmRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('intro');

  // Keep ref in sync
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    currentBpmRef.current = currentBpm;
  }, [currentBpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMetronome();
    };
  }, []);

  // ── Pendulum animation ────────────────────────────────────────────────────
  const startPendulum = useCallback(
    (bpm: number) => {
      if (pendulumAnimRef.current) pendulumAnimRef.current.stop();
      const halfPeriod = bpmToMs(bpm) / 2;
      const swing = Animated.loop(
        Animated.sequence([
          Animated.timing(pendulumAnim, {
            toValue: 1,
            duration: halfPeriod,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pendulumAnim, {
            toValue: 0,
            duration: halfPeriod,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      );
      pendulumAnimRef.current = swing;
      swing.start();
    },
    [pendulumAnim],
  );

  const stopPendulum = useCallback(() => {
    if (pendulumAnimRef.current) {
      pendulumAnimRef.current.stop();
      pendulumAnimRef.current = null;
    }
  }, []);

  // ── Metronome tick (haptic + heart beat) ─────────────────────────────────
  const scheduleTick = useCallback(
    (bpm: number) => {
      if (metronomeRef.current) clearTimeout(metronomeRef.current);
      const interval = bpmToMs(bpm);

      const tick = () => {
        if (phaseRef.current !== 'syncing') return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Heart pulse anim
        Animated.sequence([
          Animated.timing(heartScaleAnim, {
            toValue: 1.25,
            duration: 120,
            useNativeDriver: true,
          }),
          Animated.timing(heartScaleAnim, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]).start();
        metronomeRef.current = setTimeout(tick, bpmToMs(currentBpmRef.current ?? bpm));
      };

      metronomeRef.current = setTimeout(tick, interval);
    },
    [heartScaleAnim],
  );

  const stopMetronome = useCallback(() => {
    if (metronomeRef.current) {
      clearTimeout(metronomeRef.current);
      metronomeRef.current = null;
    }
    stopPendulum();
  }, [stopPendulum]);

  // ── Slowdown schedule ─────────────────────────────────────────────────────
  const runSlowdown = useCallback(
    (startBpm: number) => {
      const target = Math.max(MIN_BPM, Math.round(startBpm * 0.8));
      setTargetBpm(target);
      const steps: number[] = [];
      for (let i = 0; i <= SLOWDOWN_STEPS; i++) {
        const bpm = Math.round(startBpm - ((startBpm - target) * i) / SLOWDOWN_STEPS);
        steps.push(bpm);
      }
      bpmStepsRef.current = steps;

      let stepIdx = 0;
      setStepIndex(0);

      const advanceStep = () => {
        if (phaseRef.current !== 'syncing') return;
        if (stepIdx >= steps.length) {
          setPhase('done');
          stopMetronome();
          return;
        }
        const bpm = steps[stepIdx];
        setCurrentBpm(bpm);
        currentBpmRef.current = bpm;
        setStepIndex(stepIdx);
        startPendulum(bpm);
        scheduleTick(bpm);
        stepIdx++;
        // Each step lasts 20 beats (long enough to settle into the rhythm)
        const stepDuration = bpmToMs(bpm) * 20;
        metronomeRef.current = setTimeout(advanceStep, stepDuration);
      };

      advanceStep();
    },
    [startPendulum, scheduleTick, stopMetronome],
  );

  // ── Tap handler (measuring phase) ────────────────────────────────────────
  const handleTap = useCallback(() => {
    if (phase !== 'measuring') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Tap scale animation
    Animated.sequence([
      Animated.timing(tapScaleAnim, {
        toValue: 0.9,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(tapScaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    const now = Date.now();
    tapTimestampsRef.current.push(now);

    const count = tapTimestampsRef.current.length;
    setTapCount(count);

    if (count >= TAP_SAMPLES) {
      // Compute average BPM from intervals
      const times = tapTimestampsRef.current;
      let totalInterval = 0;
      for (let i = 1; i < times.length; i++) {
        totalInterval += times[i] - times[i - 1];
      }
      const avgInterval = totalInterval / (times.length - 1);
      const bpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.min(Math.max(bpm, 40), 200);

      setMeasuredBpm(clampedBpm);
      setCurrentBpm(clampedBpm);
      currentBpmRef.current = clampedBpm;
      setPhase('syncing');

      // Start the slowdown after a short delay
      setTimeout(() => {
        runSlowdown(clampedBpm);
      }, 800);
    }
  }, [phase, tapScaleAnim, runSlowdown]);

  // ── Glow pulse (syncing phase) ────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'syncing') return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [phase, glowAnim]);

  // ── Pendulum translate ────────────────────────────────────────────────────
  const PENDULUM_RANGE = SCREEN_WIDTH * 0.35;
  const pendulumTranslate = pendulumAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-PENDULUM_RANGE, PENDULUM_RANGE],
  });

  const progressPercent =
    bpmStepsRef.current.length > 0
      ? Math.min(100, Math.round((stepIndex / SLOWDOWN_STEPS) * 100))
      : 0;

  // ─── INTRO SCREEN ─────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F5F3FF', '#EDE9FE', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={COLOR} />
          </Pressable>
        </View>

        <View style={styles.introContent}>
          {/* Icon */}
          <View style={styles.introIconWrap}>
            <LinearGradient colors={GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <MaterialCommunityIcons name="heart-pulse" size={44} color="#FFFFFF" />
          </View>

          <Text style={styles.introTitle}>Métronome{'\n'}Cardiaque</Text>
          <Text style={styles.introSubtitle}>
            Quand on est stressé, le cœur s'accélère. On va le calmer ensemble.
          </Text>

          {/* Steps */}
          <View style={styles.stepsCard}>
            {[
              { icon: 'hand-heart', text: 'Pose ta main sur ton cœur' },
              { icon: 'gesture-tap', text: 'Tapote l\'écran au rythme de ton cœur' },
              { icon: 'heart-pulse', text: 'Suis le métronome pour ralentir doucement' },
            ].map((step, i) => (
              <View key={i} style={styles.stepRow}>
                <View style={styles.stepNumWrap}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <MaterialCommunityIcons name={step.icon as any} size={22} color={COLOR} style={{ marginRight: 10 }} />
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.startBtnWrap, pressed && { opacity: 0.85 }]}
            onPress={() => {
              tapTimestampsRef.current = [];
              setTapCount(0);
              setPhase('measuring');
            }}
          >
            <LinearGradient colors={GRADIENT} style={styles.startBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialCommunityIcons name="heart" size={22} color="#FFFFFF" />
              <Text style={styles.startBtnText}>Je suis prêt(e)</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── MEASURING SCREEN ─────────────────────────────────────────────────────
  if (phase === 'measuring') {
    const remaining = TAP_SAMPLES - tapCount;
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F5F3FF', '#EDE9FE', '#FFFFFF']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.header}>
          <Pressable onPress={() => { setPhase('intro'); tapTimestampsRef.current = []; setTapCount(0); }} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color={COLOR} />
          </Pressable>
        </View>

        <View style={styles.measureContent}>
          <Text style={styles.measureTitle}>Tape au rythme{'\n'}de ton cœur</Text>
          <Text style={styles.measureSubtitle}>
            {tapCount === 0
              ? 'Pose ta main gauche sur ton cœur, puis appuie ici'
              : remaining > 0
                ? `Continue… encore ${remaining} tap${remaining > 1 ? 's' : ''}`
                : 'Calcul en cours…'}
          </Text>

          {/* Big tap button */}
          <Animated.View style={{ transform: [{ scale: tapScaleAnim }] }}>
            <Pressable
              onPress={handleTap}
              style={({ pressed }) => [styles.tapBtn, pressed && { opacity: 0.9 }]}
            >
              <LinearGradient colors={GRADIENT} style={styles.tapBtnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                {/* Outer glow ring */}
                <View style={styles.tapBtnRing} />
                <MaterialCommunityIcons name="heart" size={56} color="#FFFFFF" />
                <Text style={styles.tapBtnLabel}>Tap</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Progress dots */}
          <View style={styles.dotsRow}>
            {Array.from({ length: TAP_SAMPLES }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i < tapCount
                    ? { backgroundColor: COLOR, transform: [{ scale: 1.2 }] }
                    : { backgroundColor: COLOR_LIGHT },
                ]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── SYNCING SCREEN ───────────────────────────────────────────────────────
  if (phase === 'syncing') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: COLOR_LIGHT }]}>
        <LinearGradient
          colors={[COLOR_LIGHT, '#FFFFFF', COLOR_LIGHT]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />

        <View style={styles.header}>
          <Pressable
            onPress={() => { stopMetronome(); setPhase('intro'); }}
            style={styles.backBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={26} color={COLOR} />
          </Pressable>
          <Text style={styles.syncTitle}>Suis le rythme</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.syncContent}>
          {/* Instruction */}
          <Text style={styles.syncInstruction}>
            Cale ta respiration sur le pendule.{'\n'}Il ralentit doucement pour calmer ton cœur.
          </Text>

          {/* BPM badge */}
          <View style={styles.bpmBadge}>
            <MaterialCommunityIcons name="heart-pulse" size={18} color={COLOR} />
            <Text style={styles.bpmText}>{currentBpm} BPM</Text>
            {targetBpm && (
              <Text style={styles.bpmTarget}>→ {targetBpm} BPM</Text>
            )}
          </View>

          {/* Pendulum track */}
          <View style={styles.pendulumTrack}>
            {/* Glow behind the ball */}
            <Animated.View
              style={[
                styles.pendulumGlow,
                {
                  opacity: glowAnim,
                  transform: [{ translateX: pendulumTranslate }],
                },
              ]}
            />
            {/* Ball */}
            <Animated.View
              style={[
                styles.pendulumBall,
                { transform: [{ translateX: pendulumTranslate }] },
              ]}
            >
              <LinearGradient colors={GRADIENT} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            </Animated.View>
          </View>

          {/* Heart pulse icon */}
          <Animated.View style={{ transform: [{ scale: heartScaleAnim }], alignItems: 'center', marginTop: Spacing.md }}>
            <MaterialCommunityIcons name="heart" size={38} color={COLOR} />
          </Animated.View>

          {/* Progress bar */}
          <View style={styles.progressSection}>
            <Text style={styles.progressLabel}>Progression vers la détente</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.progressPct}>{progressPercent}%</Text>
          </View>

          {/* Stop */}
          <Pressable
            onPress={() => { stopMetronome(); setPhase('intro'); }}
            style={({ pressed }) => [styles.stopBtnWrap, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient colors={GRADIENT} style={styles.stopBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <MaterialCommunityIcons name="stop-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.stopBtnText}>Arrêter</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ─── DONE SCREEN ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F5F3FF', '#EDE9FE', '#FFFFFF']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <View style={styles.doneContent}>
        <LinearGradient colors={GRADIENT} style={styles.doneIconWrap} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <MaterialCommunityIcons name="check-decagram" size={48} color="#FFFFFF" />
        </LinearGradient>

        <Text style={styles.doneTitle}>Excellent !</Text>
        <Text style={styles.doneSub}>
          Ton cœur a ralenti de {measuredBpm} à {targetBpm} BPM.{'\n'}
          Tu as fait quelque chose d'incroyable !
        </Text>

        <View style={styles.doneStatsRow}>
          <View style={[styles.doneStat, { backgroundColor: COLOR_LIGHT }]}>
            <Text style={[styles.doneStatVal, { color: COLOR }]}>{measuredBpm}</Text>
            <Text style={styles.doneStatLabel}>BPM départ</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={22} color={COLOR} />
          <View style={[styles.doneStat, { backgroundColor: COLOR_LIGHT }]}>
            <Text style={[styles.doneStatVal, { color: COLOR }]}>{targetBpm}</Text>
            <Text style={styles.doneStatLabel}>BPM cible</Text>
          </View>
        </View>

        <View style={styles.duaBox}>
          <MaterialCommunityIcons name="star-four-points" size={14} color={COLOR} />
          <Text style={styles.duaText}>
            « Innamal 'usri yusrâ » — Avec la difficulté vient la facilité (94:5)
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.startBtnWrap, pressed && { opacity: 0.85 }, { marginTop: Spacing.xl }]}
          onPress={() => router.back()}
        >
          <LinearGradient colors={GRADIENT} style={styles.startBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <MaterialCommunityIcons name="check-circle" size={22} color="#FFFFFF" />
            <Text style={styles.startBtnText}>Terminer</Text>
          </LinearGradient>
        </Pressable>

        <Pressable
          onPress={() => {
            tapTimestampsRef.current = [];
            setTapCount(0);
            setMeasuredBpm(null);
            setCurrentBpm(null);
            setStepIndex(0);
            bpmStepsRef.current = [];
            setPhase('measuring');
          }}
          style={{ marginTop: Spacing.md }}
        >
          <Text style={styles.restartText}>Recommencer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  },

  // ── Intro ──
  introContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  introIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  introTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 36,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  introSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  stepsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLOR_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '800',
    color: COLOR,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    fontWeight: '500',
  },
  startBtnWrap: {
    width: '100%',
    borderRadius: BorderRadius.full,
    elevation: 6,
    shadowColor: COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  startBtnText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  // ── Measuring ──
  measureContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.xl,
  },
  measureTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  measureSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tapBtn: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
    elevation: 12,
    shadowColor: COLOR,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  tapBtnGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    gap: 8,
  },
  tapBtnRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  tapBtnLabel: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

  // ── Syncing ──
  syncTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLOR,
    textAlign: 'center',
  },
  syncContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  syncInstruction: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  bpmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLOR_LIGHT,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  bpmText: {
    fontSize: 18,
    fontWeight: '800',
    color: COLOR,
  },
  bpmTarget: {
    fontSize: 14,
    fontWeight: '600',
    color: COLOR,
    opacity: 0.65,
  },
  pendulumTrack: {
    width: '100%',
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLOR_LIGHT,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLOR + '30',
  },
  pendulumGlow: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLOR + '40',
  },
  pendulumBall: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  progressSection: {
    width: '100%',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: COLOR_LIGHT,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLOR,
  },
  progressPct: {
    fontSize: 13,
    fontWeight: '700',
    color: COLOR,
  },
  stopBtnWrap: {
    width: '100%',
    borderRadius: 16,
    elevation: 4,
    shadowColor: COLOR,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ── Done ──
  doneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.lg,
  },
  doneIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  doneTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  doneSub: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  doneStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  doneStat: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneStatVal: {
    fontSize: 28,
    fontWeight: '800',
  },
  doneStatLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  duaBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: COLOR_LIGHT,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 16,
  },
  duaText: {
    flex: 1,
    fontSize: 13,
    color: COLOR,
    fontStyle: 'italic',
    lineHeight: 19,
    fontWeight: '600',
  },
  restartText: {
    fontSize: 15,
    color: COLOR,
    fontWeight: '600',
  },
});
