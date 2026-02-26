/**
 * Micro-Mission - MuslimGuard
 * A "2-minute challenge wheel" to break out of the "meh" feeling.
 * Spins a wheel of quick physical/sensory missions to re-engage the brain.
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
const WHEEL_SIZE = SCREEN_WIDTH * 0.7;

interface Mission {
  text: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
}

const MISSIONS: Mission[] = [
  {
    text: 'Va toucher 3 matières différentes dans la maison (du bois, du métal, du tissu).',
    icon: 'hand-wave',
    color: '#F59E0B',
  },
  {
    text: 'Fais l\u2019équilibre sur une jambe le temps de compter jusqu\u2019à 20.',
    icon: 'human-handsup',
    color: '#EF4444',
  },
  {
    text: 'Trouve un objet qui pèse plus lourd qu\u2019une pomme.',
    icon: 'scale-balance',
    color: '#8B5CF6',
  },
  {
    text: 'Dessine un sourire sur une feuille avec les yeux fermés.',
    icon: 'draw',
    color: '#10B981',
  },
  {
    text: 'Fais 10 sauts sur place le plus haut possible !',
    icon: 'run-fast',
    color: '#3B82F6',
  },
  {
    text: 'Trouve quelque chose de bleu, rouge et vert dans la pièce.',
    icon: 'palette',
    color: '#EC4899',
  },
  {
    text: 'Compte à voix haute de 20 à 0 en arrière le plus vite possible.',
    icon: 'numeric',
    color: '#0891B2',
  },
  {
    text: 'Fais le tour de la pièce en marchant comme un pingouin.',
    icon: 'penguin',
    color: '#6366F1',
  },
  {
    text: 'Remplis un verre d\u2019eau et transporte-le sans en renverser une goutte.',
    icon: 'cup-water',
    color: '#059669',
  },
  {
    text: 'Tape dans tes mains 5 fois, puis touche tes orteils 5 fois.',
    icon: 'hand-clap',
    color: '#D97706',
  },
];

type Phase = 'ready' | 'spinning' | 'mission' | 'timer' | 'done';

export default function MicroMissionScreen() {
  const [phase, setPhase] = useState<Phase>('ready');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [seconds, setSeconds] = useState(120);

  const spinAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const spin = () => {
    setPhase('spinning');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Pick random mission
    const idx = Math.floor(Math.random() * MISSIONS.length);
    const mission = MISSIONS[idx];

    // Number of full rotations + offset for randomness
    const totalRotations = 4 + Math.random() * 3;

    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: totalRotations,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setSelectedMission(mission);
      setPhase('mission');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Bounce effect on reveal
      bounceAnim.setValue(0.5);
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();
    });
  };

  const startTimer = () => {
    setPhase('timer');
    setSeconds(120);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 120000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    let remaining = 120;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSeconds(remaining);
      if (remaining <= 10 && remaining > 0) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setPhase('done');
      }
    }, 1000);
  };

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('ready');
    setSelectedMission(null);
    spinAnim.setValue(0);
  };

  const handleBack = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const spinRotation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progress = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ─── Ready phase ───────────────────────────────────────
  if (phase === 'ready') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F3F4F6', '#E5E7EB', '#F9FAFB']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#6B7280" />
          </Pressable>
        </View>

        <View style={styles.centerContent}>
          <View style={styles.heroIcon}>
            <LinearGradient
              colors={['#E5E7EB', '#D1D5DB']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <MaterialCommunityIcons name="target" size={40} color="#6B7280" />
          </View>

          <Text style={styles.heroTitle}>Micro-Mission</Text>
          <Text style={styles.heroSubtitle}>
            Un petit défi de 2 minutes{'\n'}pour relancer la machine !
          </Text>

          <Pressable
            onPress={spin}
            style={({ pressed }) => [styles.spinBtnWrap, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['#6B7280', '#9CA3AF']}
              style={styles.spinBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialCommunityIcons name="rotate-3d-variant" size={28} color="#FFFFFF" />
              <Text style={styles.spinBtnText}>Lancer la roue !</Text>
            </LinearGradient>
          </Pressable>

          {/* Mini preview of missions */}
          <View style={styles.previewRow}>
            {MISSIONS.slice(0, 5).map((m, i) => (
              <View key={i} style={[styles.previewDot, { backgroundColor: m.color + '25' }]}>
                <MaterialCommunityIcons name={m.icon} size={18} color={m.color} />
              </View>
            ))}
            <Text style={styles.previewMore}>+{MISSIONS.length - 5}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Spinning phase ────────────────────────────────────
  if (phase === 'spinning') {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#F3F4F6', '#E5E7EB', '#F9FAFB']}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={26} color="#6B7280" />
          </Pressable>
          <Text style={styles.headerTitle}>Micro-Mission</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.centerContent}>
          <Animated.View
            style={[
              styles.wheelOuter,
              { transform: [{ rotate: spinRotation }] },
            ]}
          >
            <LinearGradient
              colors={['#6B7280', '#9CA3AF']}
              style={styles.wheelInner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {MISSIONS.slice(0, 8).map((m, i) => {
                const angle = (i / 8) * 360;
                const rad = (angle * Math.PI) / 180;
                const radius = WHEEL_SIZE * 0.3;
                return (
                  <View
                    key={i}
                    style={[
                      styles.wheelIcon,
                      {
                        left: WHEEL_SIZE / 2 - 16 + Math.cos(rad) * radius,
                        top: WHEEL_SIZE / 2 - 16 + Math.sin(rad) * radius,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons name={m.icon} size={24} color="#FFFFFF" />
                  </View>
                );
              })}
              <MaterialCommunityIcons name="help" size={36} color="#FFFFFF" style={{ opacity: 0.5 }} />
            </LinearGradient>
          </Animated.View>

          <Text style={styles.spinningText}>La roue tourne...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Mission revealed / Timer / Done ───────────────────
  const mission = selectedMission!;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#F3F4F6', '#E5E7EB', '#F9FAFB']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#6B7280" />
        </Pressable>
        <Text style={styles.headerTitle}>Micro-Mission</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.missionContent}>
        {/* Mission card */}
        <Animated.View style={[styles.missionCard, { transform: [{ scale: bounceAnim }] }]}>
          <LinearGradient
            colors={[mission.color + '15', '#FFFFFF']}
            style={styles.missionCardInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            <View style={[styles.missionIconCircle, { backgroundColor: mission.color + '20' }]}>
              <MaterialCommunityIcons name={mission.icon} size={40} color={mission.color} />
            </View>

            <Text style={styles.missionLabel}>Ta mission :</Text>
            <Text style={[styles.missionText, { color: mission.color }]}>
              {mission.text}
            </Text>

            {phase === 'timer' && (
              <View style={styles.timerSection}>
                <Text style={[styles.timerText, { color: mission.color }]}>
                  {formatTime(seconds)}
                </Text>
                <View style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFill, { width: progress }]}>
                    <LinearGradient
                      colors={[mission.color, mission.color + 'CC']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  </Animated.View>
                </View>
              </View>
            )}

            {phase === 'done' && (
              <View style={styles.doneSection}>
                <MaterialCommunityIcons name="check-circle" size={48} color="#10B981" />
                <Text style={styles.doneText}>Mission accomplie !</Text>
                <Text style={styles.doneSubtext}>
                  Bravo, tu as relancé la machine !
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Actions */}
        <View style={styles.actions}>
          {phase === 'mission' && (
            <>
              <Pressable
                onPress={startTimer}
                style={({ pressed }) => [styles.actionBtnWrap, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={[mission.color, mission.color + 'DD']}
                  style={styles.actionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="timer-outline" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Lancer le timer 2 min</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={reset}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="rotate-3d-variant" size={18} color="#6B7280" />
                <Text style={styles.secondaryBtnText}>Autre mission</Text>
              </Pressable>
            </>
          )}

          {phase === 'done' && (
            <>
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => [styles.actionBtnWrap, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={['#10B981', '#34D399']}
                  style={styles.actionBtn}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <MaterialCommunityIcons name="check" size={22} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Retour</Text>
                </LinearGradient>
              </Pressable>

              <Pressable
                onPress={reset}
                style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.7 }]}
              >
                <MaterialCommunityIcons name="rotate-3d-variant" size={18} color="#6B7280" />
                <Text style={styles.secondaryBtnText}>Encore un défi !</Text>
              </Pressable>
            </>
          )}
        </View>
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
    color: '#6B7280',
  },

  // Center content
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
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
    fontSize: 28,
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
    marginBottom: Spacing.xxl,
    lineHeight: 22,
  },

  // Spin button
  spinBtnWrap: {
    width: '100%',
    borderRadius: 18,
    elevation: 6,
    shadowColor: '#6B7280',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  spinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    gap: Spacing.md,
  },
  spinBtnText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Preview
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
    gap: 8,
  },
  previewDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMore: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },

  // Wheel
  wheelOuter: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    borderRadius: WHEEL_SIZE / 2,
    marginBottom: Spacing.xl,
  },
  wheelInner: {
    width: '100%',
    height: '100%',
    borderRadius: WHEEL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinningText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#6B7280',
    fontStyle: 'italic',
  },

  // Mission
  missionContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  missionCard: {
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  missionCardInner: {
    padding: Spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  missionIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  missionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  missionText: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 28,
  },

  // Timer
  timerSection: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    width: '100%',
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    marginBottom: Spacing.md,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },

  // Done
  doneSection: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  doneText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10B981',
  },
  doneSubtext: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },

  // Actions
  actions: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  actionBtnWrap: {
    width: '100%',
    borderRadius: 16,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: Spacing.sm,
  },
  actionBtnText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: Spacing.sm,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
});
