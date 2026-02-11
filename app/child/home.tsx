/**
 * Child Home Screen - MuslimGuard
 * Dashboard for child mode with prayer times, browser access, and Islamic reminders
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/card';
import { PrayerService, NextPrayerInfo } from '@/services/prayer.service';
import { KioskService } from '@/services/kiosk.service';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { getTodayReminder, IslamicReminder } from '@/constants/islamic-reminders';

const t = translations.childHome;

/**
 * Format minutes into hours and minutes for display
 * Returns { value: string, unit: string } for flexible display
 */
function formatTimeRemaining(minutes: number): { value: string; unit: string } {
  if (minutes < 60) {
    return { value: String(minutes), unit: 'min' };
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return { value: `${hours}h`, unit: '' };
  }
  return { value: `${hours}h${mins.toString().padStart(2, '0')}`, unit: '' };
}

export default function ChildHomeScreen() {
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);
  const [gregorianDate, setGregorianDate] = useState('');
  const [hijriDate, setHijriDate] = useState('');
  const [reminder, setReminder] = useState<IslamicReminder | null>(null);

  useEffect(() => {
    // Load initial data
    loadData();

    // Set gregorian date and reminder (static for the day)
    setGregorianDate(PrayerService.getFormattedDate());
    setReminder(getTodayReminder());

    // Activate kiosk mode if enabled
    KioskService.activateKiosk().catch(() => {});

    // Refresh prayer data every 60 seconds
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load prayer and hijri date from API cache
      const [prayer, hijri] = await Promise.all([
        PrayerService.getNextPrayer(),
        PrayerService.getHijriDate(),
      ]);
      setNextPrayer(prayer);
      setHijriDate(hijri?.formatted || '');
    } catch (error) {
      console.error('Error loading prayer data:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.appName}>{translations.app.name}</Text>
          </View>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.push('/pin-entry')}
            accessibilityLabel={t.parentAccess}
          >
            <MaterialCommunityIcons
              name="shield-account"
              size={22}
              color={Colors.light.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting}>{t.greeting}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Date Display */}
        <View style={styles.dateContainer}>
          <Text style={styles.gregorianDate}>{gregorianDate}</Text>
          <Text style={styles.hijriDate}>{hijriDate}</Text>
        </View>

        {/* Next Prayer Widget */}
        {nextPrayer ? (
          <Card variant="elevated" style={styles.prayerCard}>
            <View style={styles.prayerContent}>
              <View style={styles.prayerIconContainer}>
                <MaterialCommunityIcons
                  name="mosque"
                  size={28}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.prayerInfo}>
                <Text style={styles.prayerLabel}>{t.nextPrayer}</Text>
                <Text style={styles.prayerName}>
                  {nextPrayer.nameFr} - {nextPrayer.timeFormatted}
                </Text>
              </View>
              <View style={styles.prayerTimeContainer}>
                <Text style={styles.prayerTimeValue}>
                  {formatTimeRemaining(nextPrayer.minutesRemaining).value}
                </Text>
                {formatTimeRemaining(nextPrayer.minutesRemaining).unit && (
                  <Text style={styles.prayerTimeUnit}>
                    {formatTimeRemaining(nextPrayer.minutesRemaining).unit}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        ) : (
          <Card variant="outlined" style={styles.prayerCardEmpty}>
            <View style={styles.prayerContent}>
              <MaterialCommunityIcons
                name="mosque"
                size={24}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.noPrayerText}>{t.noPrayerData}</Text>
            </View>
          </Card>
        )}

        {/* Browser Button */}
        <Card
          variant="elevated"
          style={styles.browserCard}
          onPress={() => router.push('/child/browser')}
        >
          <View style={styles.browserContent}>
            <View style={styles.browserIconContainer}>
              <MaterialCommunityIcons
                name="web"
                size={32}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.browserTextContainer}>
              <Text style={styles.browserTitle}>{t.browser}</Text>
              <Text style={styles.browserDescription}>
                {t.browserDescription}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#FFFFFF"
            />
          </View>
        </Card>

        {/* Allowed Apps Placeholder */}
        <Card variant="outlined" style={styles.appsCard}>
          <View style={styles.appsContent}>
            <View style={styles.appsIconContainer}>
              <MaterialCommunityIcons
                name="apps"
                size={24}
                color={Colors.light.textSecondary}
              />
            </View>
            <View style={styles.appsTextContainer}>
              <Text style={styles.appsTitle}>{t.apps}</Text>
              <Text style={styles.appsSoon}>{t.appsSoon}</Text>
            </View>
          </View>
        </Card>

        {/* Islamic Reminder of the Day */}
        {reminder && (
          <Card variant="outlined" style={styles.reminderCard}>
            <View style={styles.reminderHeader}>
              <MaterialCommunityIcons
                name="book-open-variant"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.reminderLabel}>{t.reminder}</Text>
            </View>
            <Text style={styles.reminderText}>« {reminder.text} »</Text>
            <Text style={styles.reminderSource}>{reminder.source}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
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
    paddingBottom: Spacing.xxl,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
  },

  // Greeting
  greetingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Dates
  dateContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  gregorianDate: {
    fontSize: 14,
    color: Colors.light.text,
    textTransform: 'capitalize',
  },
  hijriDate: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
  },

  // Prayer Widget
  prayerCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.lg,
    elevation: 2,
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  prayerCardEmpty: {
    marginBottom: Spacing.lg,
  },
  prayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  prayerIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prayerInfo: {
    flex: 1,
  },
  prayerLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  prayerName: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: 2,
  },
  prayerTimeContainer: {
    alignItems: 'center',
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  prayerTimeValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  prayerTimeUnit: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  noPrayerText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },

  // Browser Button
  browserCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.primary,
  },
  browserContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  browserIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  browserTextContainer: {
    flex: 1,
  },
  browserTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  browserDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },

  // Apps Placeholder
  appsCard: {
    marginBottom: Spacing.lg,
    borderStyle: 'dashed',
  },
  appsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  appsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appsTextContainer: {
    flex: 1,
  },
  appsTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  appsSoon: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },

  // Reminder
  reminderCard: {
    backgroundColor: Colors.primary + '05',
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  reminderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  reminderText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  reminderSource: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'right',
  },

});
