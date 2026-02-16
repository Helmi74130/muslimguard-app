/**
 * Pedometer Screen - MuslimGuard
 * Gamified step counter with levels, badges and streak tracking
 * Uses OS step counter (works even when app is closed)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  AppState,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Pedometer } from 'expo-sensors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations as t } from '@/constants/translations';
import { StorageService } from '@/services/storage.service';
import { PedometerData } from '@/types/storage.types';

// Levels based on total cumulative steps
const LEVELS = [
  { level: 1, name: 'Débutant', steps: 0, icon: 'walk' as const },
  { level: 2, name: 'Marcheur', steps: 5_000, icon: 'hiking' as const },
  { level: 3, name: 'Explorateur', steps: 15_000, icon: 'compass' as const },
  { level: 4, name: 'Aventurier', steps: 40_000, icon: 'map-marker-path' as const },
  { level: 5, name: 'Randonneur', steps: 80_000, icon: 'image-filter-hdr' as const },
  { level: 6, name: 'Voyageur', steps: 150_000, icon: 'airplane' as const },
  { level: 7, name: 'Champion', steps: 300_000, icon: 'shield-star' as const },
  { level: 8, name: 'Athlète', steps: 500_000, icon: 'lightning-bolt' as const },
  { level: 9, name: 'Héros', steps: 1_000_000, icon: 'fire' as const },
  { level: 10, name: 'Légende', steps: 2_000_000, icon: 'crown' as const },
];

// Badges with unlock conditions
const BADGES = [
  { id: 'first_steps', name: 'Premiers Pas', icon: 'shoe-print' as const, color: '#4CAF50' },
  { id: 'goal_reached', name: 'Objectif du Jour', icon: 'flag-checkered' as const, color: '#2196F3' },
  { id: 'streak_3', name: 'Série de 3', icon: 'fire' as const, color: '#FF9800' },
  { id: 'streak_7', name: 'Série de 7', icon: 'calendar-star' as const, color: '#E91E63' },
  { id: 'steps_5k', name: '5 000 Pas', icon: 'star' as const, color: '#9C27B0' },
  { id: 'marathon', name: 'Marathonien', icon: 'trophy' as const, color: '#FF5722' },
  { id: 'steps_10k', name: '10K', icon: 'medal' as const, color: '#FFD700' },
];

function getLevel(totalSteps: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalSteps >= LEVELS[i].steps) return LEVELS[i];
  }
  return LEVELS[0];
}

function getNextLevel(totalSteps: number) {
  for (const lvl of LEVELS) {
    if (totalSteps < lvl.steps) return lvl;
  }
  return null;
}

function checkBadges(data: PedometerData): string[] {
  const unlocked = [...data.unlockedBadges];
  const add = (id: string) => { if (!unlocked.includes(id)) unlocked.push(id); };

  if (data.totalSteps >= 100) add('first_steps');
  if (data.goalReachedToday) add('goal_reached');
  if (data.currentStreak >= 3) add('streak_3');
  if (data.currentStreak >= 7) add('streak_7');
  if (data.dailySteps >= 5_000) add('steps_5k');
  if (data.totalSteps >= 42_195) add('marathon');
  if (data.dailySteps >= 10_000) add('steps_10k');

  return unlocked;
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Get start of today as Date */
function getStartOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function PedometerScreen() {
  const [data, setData] = useState<PedometerData | null>(null);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const subRef = useRef<{ remove: () => void } | null>(null);
  const dataRef = useRef<PedometerData | null>(null);
  const lastOsStepsRef = useRef<number | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Refresh steps when app comes back to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && permissionGranted && dataRef.current) {
        fetchOsSteps(dataRef.current);
      }
    });
    return () => sub.remove();
  }, [permissionGranted]);

  useEffect(() => {
    init();
    return () => { subRef.current?.remove(); };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return true;
    const { granted } = await Pedometer.requestPermissionsAsync();
    return granted;
  };

  /** Fetch today's steps from the OS step counter */
  const fetchOsSteps = useCallback(async (stored: PedometerData) => {
    try {
      const result = await Pedometer.getStepCountAsync(getStartOfToday(), new Date());
      const osSteps = result.steps;

      // On first fetch, just record the OS value
      if (lastOsStepsRef.current === null) {
        // If stored dailySteps is 0 and OS has steps, use OS steps directly
        // This handles the case where the app was closed and steps accumulated
        if (stored.dailySteps === 0 && osSteps > 0) {
          const updated = updateData(stored, osSteps);
          lastOsStepsRef.current = osSteps;
          return updated;
        }
        // If stored already has steps, use the max of stored vs OS
        const bestSteps = Math.max(stored.dailySteps, osSteps);
        const diff = bestSteps - stored.dailySteps;
        if (diff > 0) {
          const updated = updateData(stored, diff);
          lastOsStepsRef.current = osSteps;
          return updated;
        }
        lastOsStepsRef.current = osSteps;
        return stored;
      }

      // On subsequent fetches, only add the delta
      const delta = osSteps - lastOsStepsRef.current;
      lastOsStepsRef.current = osSteps;
      if (delta > 0) {
        return updateData(dataRef.current || stored, delta);
      }
      return dataRef.current || stored;
    } catch {
      // getStepCountAsync not supported on this device, fall back to watchStepCount
      return stored;
    }
  }, []);

  /** Apply step delta to data, persist, and return updated */
  const updateData = (current: PedometerData, stepsToAdd: number): PedometerData => {
    const newDaily = current.dailySteps + stepsToAdd;
    const newTotal = current.totalSteps + stepsToAdd;
    const goalReached = current.goalReachedToday || newDaily >= current.dailyGoal;

    const updated: PedometerData = {
      ...current,
      dailySteps: newDaily,
      totalSteps: newTotal,
      bestDailySteps: Math.max(current.bestDailySteps, newDaily),
      goalReachedToday: goalReached,
    };
    updated.unlockedBadges = checkBadges(updated);

    setData(updated);
    dataRef.current = updated;
    StorageService.setPedometerData(updated);
    return updated;
  };

  const init = async () => {
    setLoading(true);

    // 1. Request permission
    const granted = await requestPermission();
    setPermissionGranted(granted);

    if (!granted) {
      // Load stored data anyway so we can show previous progress
      const stored = await StorageService.getPedometerData();
      setData(stored);
      setAvailable(false);
      setLoading(false);
      return;
    }

    // 2. Check sensor availability
    const isAvailable = await Pedometer.isAvailableAsync();
    setAvailable(isAvailable);

    // 3. Load & handle day reset
    let stored = await StorageService.getPedometerData();
    const today = getTodayStr();

    if (stored.lastActiveDate && stored.lastActiveDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const isConsecutive = stored.lastActiveDate === yesterdayStr;

      stored = {
        ...stored,
        dailySteps: 0,
        goalReachedToday: false,
        lastActiveDate: today,
        currentStreak: isConsecutive ? stored.currentStreak + 1 : 1,
        longestStreak: isConsecutive
          ? Math.max(stored.longestStreak, stored.currentStreak + 1)
          : stored.longestStreak,
      };
      await StorageService.setPedometerData(stored);
    } else if (!stored.lastActiveDate) {
      stored = { ...stored, lastActiveDate: today, currentStreak: 1 };
      await StorageService.setPedometerData(stored);
    }

    setData(stored);
    setLoading(false);

    if (!isAvailable) return;

    // 4. Fetch today's steps from OS (includes steps taken while app was closed)
    const afterOsFetch = await fetchOsSteps(stored);

    // 5. Watch live steps for real-time updates
    subRef.current = Pedometer.watchStepCount(result => {
      const current = dataRef.current;
      if (!current) return;
      // watchStepCount gives cumulative steps since subscription started
      // We use OS fetch for the bulk, watch just for live increments
      if (lastOsStepsRef.current !== null) {
        // Already handled by OS fetch, ignore watch to avoid double-counting
        return;
      }
      // Fallback: if OS fetch failed, use watchStepCount
      updateData(current, 1);
    });
  };

  // Periodic refresh from OS every 30s for background steps
  useEffect(() => {
    if (!permissionGranted || !available) return;
    const interval = setInterval(() => {
      if (dataRef.current) fetchOsSteps(dataRef.current);
    }, 30_000);
    return () => clearInterval(interval);
  }, [permissionGranted, available, fetchOsSteps]);

  // Permission denied screen
  if (!loading && permissionGranted === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <Text style={styles.headerTitle}>{t.pedometer.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <View style={styles.permissionCard}>
            <MaterialCommunityIcons name="shoe-sneaker" size={56} color={Colors.primary} />
            <Text style={styles.permissionTitle}>{t.pedometer.permissionTitle}</Text>
            <Text style={styles.permissionDesc}>{t.pedometer.permissionDesc}</Text>
            <Pressable
              style={styles.permissionButton}
              onPress={async () => {
                const granted = await requestPermission();
                setPermissionGranted(granted);
                if (granted) init();
              }}
            >
              <Text style={styles.permissionButtonText}>{t.pedometer.permissionButton}</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const d = data!;
  const level = getLevel(d.totalSteps);
  const nextLevel = getNextLevel(d.totalSteps);
  const goalProgress = Math.min(d.dailySteps / d.dailyGoal, 1);
  const distance = (d.dailySteps * 0.0007).toFixed(1);
  const calories = Math.round(d.dailySteps * 0.04);

  const levelProgress = nextLevel
    ? (d.totalSteps - level.steps) / (nextLevel.steps - level.steps)
    : 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.headerTitle}>{t.pedometer.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Level Badge */}
        <View style={styles.levelCard}>
          <View style={styles.levelIconCircle}>
            <MaterialCommunityIcons name={level.icon} size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.levelLabel}>{t.pedometer.level} {level.level}</Text>
          <Text style={styles.levelName}>{level.name}</Text>
          {nextLevel && (
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelProgressBg}>
                <View style={[styles.levelProgressFill, { width: `${Math.round(levelProgress * 100)}%` }]} />
              </View>
              <Text style={styles.levelProgressText}>
                {d.totalSteps.toLocaleString('fr-FR')} / {nextLevel.steps.toLocaleString('fr-FR')}
              </Text>
            </View>
          )}
        </View>

        {/* Step Counter */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsCount}>{d.dailySteps.toLocaleString('fr-FR')}</Text>
          <Text style={styles.stepsLabel}>{t.pedometer.todaySteps}</Text>

          {/* Goal Progress Bar */}
          <View style={styles.goalContainer}>
            <View style={styles.goalBarBg}>
              <View style={[
                styles.goalBarFill,
                { width: `${Math.round(goalProgress * 100)}%` },
                d.goalReachedToday && styles.goalBarComplete,
              ]} />
            </View>
            <Text style={styles.goalText}>
              {d.goalReachedToday
                ? t.pedometer.goalReached
                : `${t.pedometer.goal} : ${d.dailyGoal.toLocaleString('fr-FR')}`}
            </Text>
          </View>
        </View>

        {/* Sensor unavailable warning */}
        {available === false && permissionGranted && (
          <View style={styles.warningCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={20} color={Colors.warning} />
            <Text style={styles.warningText}>{t.pedometer.noSensor}</Text>
          </View>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="map-marker-distance" size={22} color="#2196F3" />
            <Text style={styles.statValue}>{distance} km</Text>
            <Text style={styles.statLabel}>{t.pedometer.distance}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="fire" size={22} color="#FF5722" />
            <Text style={styles.statValue}>{calories}</Text>
            <Text style={styles.statLabel}>{t.pedometer.calories}</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-check" size={22} color="#4CAF50" />
            <Text style={styles.statValue}>
              {d.currentStreak} {d.currentStreak > 1 ? t.pedometer.days : t.pedometer.day}
            </Text>
            <Text style={styles.statLabel}>{t.pedometer.streak}</Text>
          </View>
        </View>

        {/* Best record */}
        {d.bestDailySteps > 0 && (
          <View style={styles.bestCard}>
            <MaterialCommunityIcons name="trophy-outline" size={18} color={Colors.primary} />
            <Text style={styles.bestText}>
              {t.pedometer.best} : {d.bestDailySteps.toLocaleString('fr-FR')} pas
            </Text>
          </View>
        )}

        {/* Badges */}
        <Text style={styles.sectionTitle}>{t.pedometer.badges}</Text>
        <View style={styles.badgesGrid}>
          {BADGES.map((badge) => {
            const unlocked = d.unlockedBadges.includes(badge.id);
            return (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={[
                  styles.badgeCircle,
                  unlocked
                    ? { backgroundColor: badge.color }
                    : styles.badgeLocked,
                ]}>
                  <MaterialCommunityIcons
                    name={unlocked ? badge.icon : 'lock'}
                    size={24}
                    color={unlocked ? '#FFFFFF' : '#BDBDBD'}
                  />
                </View>
                <Text style={[
                  styles.badgeName,
                  !unlocked && styles.badgeNameLocked,
                ]} numberOfLines={2}>
                  {unlocked ? badge.name : t.pedometer.locked}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
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
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
  },

  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // Permission screen
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  permissionDesc: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Level Card
  levelCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    elevation: 4,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  levelIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  levelLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  levelName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  levelProgressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  levelProgressBg: {
    width: '80%',
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  levelProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },

  // Steps Card
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stepsCount: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
  },
  stepsLabel: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  goalContainer: {
    width: '100%',
    alignItems: 'center',
  },
  goalBarBg: {
    width: '100%',
    height: 12,
    backgroundColor: '#E8EAF6',
    borderRadius: 6,
    overflow: 'hidden',
  },
  goalBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },
  goalBarComplete: {
    backgroundColor: Colors.success,
  },
  goalText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    fontWeight: '600',
  },

  // Warning
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#FFF3E0',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#E65100',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  // Best record
  bestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bestText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Badges
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  badgeItem: {
    width: 80,
    alignItems: 'center',
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  badgeLocked: {
    backgroundColor: '#E0E0E0',
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: 6,
  },
  badgeNameLocked: {
    color: '#BDBDBD',
  },
});
