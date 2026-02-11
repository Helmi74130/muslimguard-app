/**
 * Prayer Times Screen - MuslimGuard
 * Display and manage prayer times
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/card';
import { PrayerService, PrayerTimeInfo, NextPrayerInfo, PRAYER_NAMES_FR } from '@/services/prayer.service';
import { StorageService } from '@/services/storage.service';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.prayer;

export default function PrayerScreen() {
  const [autoPause, setAutoPause] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimeInfo[] | null>(null);
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [cityName, setCityName] = useState('Non configurée');

  // Load all data function
  const loadData = useCallback(async () => {
    try {
      const [settings, times, next] = await Promise.all([
        StorageService.getSettings(),
        PrayerService.getTodayPrayerTimes(),
        PrayerService.getNextPrayer(),
      ]);
      setAutoPause(settings.autoPauseDuringPrayer);
      setCityName(settings.city?.name || 'Non configurée');
      setPrayerTimes(times);
      setNextPrayer(next);
    } catch (error) {
      console.error('Error loading prayer data:', error);
    }
  }, []);

  // Reload data when screen receives focus (after returning from settings)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Also reload when refreshKey changes (for periodic refresh)
  useEffect(() => {
    loadData();
  }, [refreshKey, loadData]);

  const handleAutoPauseToggle = async (value: boolean) => {
    setAutoPause(value);
    await PrayerService.setAutoPause(value);
  };

  const handleSettingsPress = () => {
    router.push('/parent/settings/prayer');
  };

  // Refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey((prev) => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.title}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <MaterialCommunityIcons
              name="cog"
              size={24}
              color={Colors.light.text}
            />
          </TouchableOpacity>
        </View>

        {/* City & Date */}
        <Card variant="elevated" style={styles.locationCard}>
          <View style={styles.locationContent}>
            <MaterialCommunityIcons
              name="map-marker"
              size={20}
              color={Colors.primary}
            />
            <View style={styles.locationInfo}>
              <Text style={styles.locationCity}>{cityName}</Text>
              <Text style={styles.locationDate}>
                {PrayerService.getFormattedDate()}
              </Text>
            </View>
            <TouchableOpacity onPress={handleSettingsPress}>
              <Text style={styles.changeText}>Modifier</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Next Prayer Banner */}
        {nextPrayer && (
          <Card variant="elevated" style={styles.nextPrayerCard}>
            <Text style={styles.nextPrayerLabel}>{t.nextPrayer}</Text>
            <View style={styles.nextPrayerContent}>
              <View style={styles.nextPrayerInfo}>
                <Text style={styles.nextPrayerName}>{nextPrayer.nameFr}</Text>
                <Text style={styles.nextPrayerTime}>{nextPrayer.timeFormatted}</Text>
              </View>
              <View style={styles.nextPrayerCountdown}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.countdownText}>
                  {t.timeRemaining.replace(
                    '{time}',
                    nextPrayer.minutesRemaining > 60
                      ? `${Math.floor(nextPrayer.minutesRemaining / 60)}h ${nextPrayer.minutesRemaining % 60}min`
                      : `${nextPrayer.minutesRemaining} min`
                  )}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Prayer Times List */}
        <Text style={styles.sectionTitle}>Horaires du jour</Text>
        <View style={styles.prayerList}>
          {prayerTimes?.map((prayer) => (
            <PrayerTimeRow key={prayer.name} prayer={prayer} />
          ))}

          {!prayerTimes && (
            <Card variant="outlined" style={styles.noCityCard}>
              <MaterialCommunityIcons
                name="map-marker-off"
                size={48}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.noCityText}>
                Veuillez configurer votre ville pour afficher les horaires de prière.
              </Text>
              <TouchableOpacity onPress={handleSettingsPress}>
                <Text style={styles.configureText}>Configurer</Text>
              </TouchableOpacity>
            </Card>
          )}
        </View>

        {/* Auto Pause Setting */}
        <Card variant="outlined" style={styles.settingCard}>
          <View style={styles.settingContent}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons
                name="pause-circle"
                size={24}
                color={Colors.primary}
              />
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>
                  {t.settings.autoPause}
                </Text>
                <Text style={styles.settingDescription}>
                  {t.settings.autoPauseDescription}
                </Text>
              </View>
            </View>
            <Switch
              value={autoPause}
              onValueChange={handleAutoPauseToggle}
              trackColor={{ false: Colors.light.border, true: Colors.primary + '60' }}
              thumbColor={autoPause ? Colors.primary : Colors.light.surface}
            />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function PrayerTimeRow({ prayer }: { prayer: PrayerTimeInfo }) {
  const isPassed = prayer.isPassed && !prayer.isCurrent;
  const isCurrent = prayer.isCurrent;

  // Skip sunrise for the main list styling
  const isSunrise = prayer.name === 'sunrise';

  return (
    <View
      style={[
        styles.prayerRow,
        isPassed && styles.prayerRowPassed,
        isCurrent && styles.prayerRowCurrent,
      ]}
    >
      <View style={styles.prayerRowLeft}>
        <MaterialCommunityIcons
          name={isSunrise ? 'weather-sunset-up' : 'mosque'}
          size={20}
          color={
            isCurrent
              ? Colors.primary
              : isPassed
              ? Colors.light.textSecondary
              : Colors.light.text
          }
        />
        <Text
          style={[
            styles.prayerRowName,
            isPassed && styles.prayerRowNamePassed,
            isCurrent && styles.prayerRowNameCurrent,
          ]}
        >
          {prayer.nameFr}
        </Text>
      </View>
      <Text
        style={[
          styles.prayerRowTime,
          isPassed && styles.prayerRowTimePassed,
          isCurrent && styles.prayerRowTimeCurrent,
        ]}
      >
        {prayer.timeFormatted}
      </Text>
      {isCurrent && (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Actuel</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  settingsButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
  },
  locationCard: {
    marginBottom: Spacing.lg,
  },
  locationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  locationDate: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textTransform: 'capitalize',
  },
  changeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  nextPrayerCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  nextPrayerLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.xs,
  },
  nextPrayerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextPrayerInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.sm,
  },
  nextPrayerName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  nextPrayerTime: {
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  nextPrayerCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  countdownText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  prayerList: {
    marginBottom: Spacing.lg,
  },
  prayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  prayerRowPassed: {
    opacity: 0.5,
  },
  prayerRowCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  prayerRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  prayerRowName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  prayerRowNamePassed: {
    color: Colors.light.textSecondary,
  },
  prayerRowNameCurrent: {
    color: Colors.primary,
    fontWeight: '600',
  },
  prayerRowTime: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  prayerRowTimePassed: {
    color: Colors.light.textSecondary,
  },
  prayerRowTimeCurrent: {
    color: Colors.primary,
  },
  currentBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.sm,
  },
  currentBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  noCityCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  noCityText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  configureText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  settingCard: {
    marginTop: Spacing.md,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  settingDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});
