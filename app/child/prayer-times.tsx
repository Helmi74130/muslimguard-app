/**
 * Prayer Times Screen - MuslimGuard
 * Beautiful prayer times display for children
 * Shows all daily prayers with countdown for the next one
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations as t } from '@/constants/translations';
import { NextPrayerInfo, PrayerService, PrayerTimeInfo } from '@/services/prayer.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Hero image */}
      <View style={styles.heroImageWrapper}>
        <Image
          source={require('@/assets/images/priere.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)']}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={() => router.back()} style={styles.backBtnOnImage}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.imageTitleContainer}>
          <Text style={styles.heroTitleOnImage}>{t.prayer.title}</Text>
          {hijriDate ? <Text style={styles.hijriDateOnImage}>{hijriDate}</Text> : null}
          {!loading && nextPrayer && (
            <View style={styles.nextPrayerBlock}>
              <Text style={styles.nextPrayerLabel}>{t.prayer.nextPrayer}</Text>
              <View style={styles.nextPrayerRow}>
                <MaterialCommunityIcons
                  name={getConfig(nextPrayer.name).icon}
                  size={22}
                  color="#FFFFFF"
                />
                <Text style={styles.nextPrayerName}>{nextPrayer.nameFr}</Text>
                <Text style={styles.nextPrayerTime}>{nextPrayer.timeFormatted}</Text>
              </View>
              <View style={styles.countdownPill}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.countdownText}>{countdown}</Text>
              </View>
            </View>
          )}
        </View>
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
                  prayer.isPassed && styles.prayerCardPassed,
                ]}
              >
                <View style={[styles.prayerIconBg, { backgroundColor: config.bgLight }]}>
                  <MaterialCommunityIcons
                    name={config.icon}
                    size={26}
                    color={prayer.isPassed ? Colors.light.textSecondary : config.iconColor}
                  />
                </View>

                <View style={styles.prayerInfo}>
                  <Text style={[
                    styles.prayerName,
                    prayer.isPassed && styles.prayerNamePassed,
                  ]}>
                    {prayer.nameFr}
                  </Text>
                  {isNext && (
                    <Text style={styles.prayerBadge}>Prochaine</Text>
                  )}
                </View>

                <Text style={[
                  styles.prayerTime,
                  prayer.isPassed && styles.prayerTimePassed,
                  isNext && styles.prayerTimeActive,
                ]}>
                  {prayer.timeFormatted}
                </Text>

                {prayer.isPassed && (
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
  // Hero image
  heroImageWrapper: {
    width: '100%',
    height: SCREEN_WIDTH * 0.62,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backBtnOnImage: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 22,
  },
  imageTitleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  heroTitleOnImage: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  hijriDateOnImage: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  nextPrayerBlock: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginTop: 4,
  },
  nextPrayerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nextPrayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextPrayerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  nextPrayerTime: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
