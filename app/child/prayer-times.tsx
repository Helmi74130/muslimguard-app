/**
 * Prayer Times Screen - MuslimGuard
 * Beautiful prayer times display for children
 * Shows all daily prayers with countdown for the next one
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { PrayerService, PrayerTimeInfo, NextPrayerInfo } from '@/services/prayer.service';
import { translations as t } from '@/constants/translations';

// Prayer icons and colors for each prayer
const PRAYER_CONFIG: Record<string, {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  gradient: string;
  bgLight: string;
  iconColor: string;
}> = {
  fajr: {
    icon: 'weather-sunset-up',
    gradient: '#1E3A5F',
    bgLight: '#E8F0FE',
    iconColor: '#1565C0',
  },
  sunrise: {
    icon: 'white-balance-sunny',
    gradient: '#E65100',
    bgLight: '#FFF3E0',
    iconColor: '#E65100',
  },
  dhuhr: {
    icon: 'weather-sunny',
    gradient: '#F9A825',
    bgLight: '#FFFDE7',
    iconColor: '#F57F17',
  },
  asr: {
    icon: 'weather-partly-cloudy',
    gradient: '#EF6C00',
    bgLight: '#FFF8E1',
    iconColor: '#EF6C00',
  },
  maghrib: {
    icon: 'weather-sunset-down',
    gradient: '#C62828',
    bgLight: '#FFEBEE',
    iconColor: '#C62828',
  },
  isha: {
    icon: 'weather-night',
    gradient: '#1A237E',
    bgLight: '#E8EAF6',
    iconColor: '#283593',
  },
};

export default function PrayerTimesScreen() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeInfo[] | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [hijriDate, setHijriDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Update countdown every second
  useEffect(() => {
    if (!nextPrayer) return;

    const updateCountdown = () => {
      const now = new Date();
      const diff = Math.max(0, Math.floor((nextPrayer.time.getTime() - now.getTime()) / 1000));
      setCountdown(PrayerService.formatTimeRemaining(diff));
    };

    updateCountdown();
    intervalRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [nextPrayer]);

  const loadData = async () => {
    setLoading(true);
    const [times, prayer, hijri] = await Promise.all([
      PrayerService.getTodayPrayerTimes(),
      PrayerService.getNextPrayer(),
      PrayerService.getHijriDate(),
    ]);
    setPrayerTimes(times);
    setNextPrayer(prayer);
    setHijriDate(hijri?.formatted || '');
    setLoading(false);
  };

  const getConfig = (name: string) => {
    return PRAYER_CONFIG[name] || PRAYER_CONFIG.dhuhr;
  };

  // Filter out sunrise for display (not a prayer)
  const displayPrayers = prayerTimes?.filter(p => p.name !== 'sunrise') || [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.prayer.title}</Text>
          {hijriDate ? <Text style={styles.hijriDate}>{hijriDate}</Text> : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t.common.loading}</Text>
        </View>
      ) : !prayerTimes ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="mosque" size={64} color={Colors.light.textSecondary} />
          <Text style={styles.emptyText}>{t.prayer.errors.noCache}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Next Prayer Hero Card */}
          {nextPrayer && (
            <View style={styles.heroCard}>
              <View style={styles.heroIconContainer}>
                <MaterialCommunityIcons
                  name={getConfig(nextPrayer.name).icon}
                  size={40}
                  color="#FFFFFF"
                />
              </View>
              <Text style={styles.heroLabel}>{t.prayer.nextPrayer}</Text>
              <Text style={styles.heroName}>{nextPrayer.nameFr}</Text>
              <Text style={styles.heroTime}>{nextPrayer.timeFormatted}</Text>
              <View style={styles.countdownContainer}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="rgba(255,255,255,0.8)" />
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            </View>
          )}

          {/* All Prayers List */}
          <Text style={styles.sectionTitle}>Prières du jour</Text>

          {displayPrayers.map((prayer) => {
            const config = getConfig(prayer.name);
            const isNext = nextPrayer?.name === prayer.name;

            return (
              <View
                key={prayer.name}
                style={[
                  styles.prayerCard,
                  isNext && styles.prayerCardActive,
                  prayer.isPassed && !prayer.isCurrent && styles.prayerCardPassed,
                ]}
              >
                <View style={[styles.prayerIconBg, { backgroundColor: config.bgLight }]}>
                  <MaterialCommunityIcons
                    name={config.icon}
                    size={26}
                    color={prayer.isPassed && !prayer.isCurrent ? Colors.light.textSecondary : config.iconColor}
                  />
                </View>

                <View style={styles.prayerInfo}>
                  <Text style={[
                    styles.prayerName,
                    prayer.isPassed && !prayer.isCurrent && styles.prayerNamePassed,
                  ]}>
                    {prayer.nameFr}
                  </Text>
                  {isNext && (
                    <Text style={styles.prayerBadge}>Prochaine</Text>
                  )}
                </View>

                <Text style={[
                  styles.prayerTime,
                  prayer.isPassed && !prayer.isCurrent && styles.prayerTimePassed,
                  isNext && styles.prayerTimeActive,
                ]}>
                  {prayer.timeFormatted}
                </Text>

                {prayer.isPassed && !prayer.isCurrent && (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={22}
                    color={Colors.success}
                    style={styles.checkIcon}
                  />
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
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
  hijriDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  // Empty
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  // Content
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  // Hero Card (Next Prayer)
  heroCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  heroLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 4,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroTime: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: Spacing.sm,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  countdownText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Section
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  // Prayer Cards
  prayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  prayerCardActive: {
    borderWidth: 2,
    borderColor: Colors.primary,
    backgroundColor: '#F0F7FF',
  },
  prayerCardPassed: {
    opacity: 0.6,
  },
  prayerIconBg: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  prayerInfo: {
    flex: 1,
  },
  prayerName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.light.text,
  },
  prayerNamePassed: {
    color: Colors.light.textSecondary,
  },
  prayerBadge: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  prayerTime: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginRight: Spacing.xs,
  },
  prayerTimePassed: {
    color: Colors.light.textSecondary,
  },
  prayerTimeActive: {
    color: Colors.primary,
  },
  checkIcon: {
    marginLeft: Spacing.xs,
  },
});
