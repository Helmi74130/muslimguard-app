/**
 * Screen Time Detail Page - MuslimGuard Parent Mode
 * Shows 7-day chart, per-app breakdown, and daily limit settings
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useSubscription } from '@/contexts/subscription.context';
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { ScreenTimeService } from '@/services/screen-time.service';
import { StorageService } from '@/services/storage.service';
import { ScreenTimeEntry } from '@/types/storage.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.screenTime;

const PAGE_ICONS: Record<string, string> = {
  browser: 'web',
  videos: 'youtube',
  quiz: 'head-question',
  quran: 'book-open-variant',
  'allah-names': 'star-crescent',
  drawing: 'draw',
  calligraphy: 'fountain-pen-tip',
  camera: 'camera',
  gallery: 'image-multiple',
  notes: 'notebook-edit',
  calculator: 'calculator-variant',
  'sound-mixer': 'music-box-multiple',
  breathing: 'leaf',
  'arabic-tracing': 'abjad-arabic',
  pedometer: 'shoe-sneaker',
  stopwatch: 'timer-outline',
  ablutions: 'hand-wash',
  emotions: 'emoticon-happy-outline',
  'prayer-times': 'mosque',
  weather: 'weather-partly-cloudy',
  'micro-mission': 'target',
};

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const LIMIT_PRESETS = [30, 60, 90, 120, 180, 240];

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  return `${m} min`;
}

function formatMinutesLabel(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  }
  return `${minutes} min`;
}

export default function ScreenTimeDetailScreen() {
  const { isPremium } = useSubscription();
  const { requireFeature } = usePremiumFeature('screen_time_limit');
  const [weekData, setWeekData] = useState<ScreenTimeEntry[]>([]);
  const [todayEntry, setTodayEntry] = useState<ScreenTimeEntry>({ date: '', pages: {}, totalSeconds: 0 });
  const [limitEnabled, setLimitEnabled] = useState(false);
  const [limitMinutes, setLimitMinutes] = useState(120);

  useEffect(() => {
    const load = async () => {
      const [week, today, settings] = await Promise.all([
        ScreenTimeService.getWeekData(),
        ScreenTimeService.getTodayScreenTime(),
        StorageService.getSettings(),
      ]);
      setWeekData(week);
      setTodayEntry(today);
      setLimitEnabled(settings.screenTimeLimitEnabled);
      setLimitMinutes(settings.screenTimeLimitMinutes || 120);
    };
    load();
  }, []);

  const handleToggleLimit = async (enabled: boolean) => {
    if (enabled && !requireFeature()) return;
    setLimitEnabled(enabled);
    await StorageService.updateSettings({ screenTimeLimitEnabled: enabled });
  };

  const handleSelectPreset = async (minutes: number) => {
    if (!isPremium && !requireFeature()) return;
    setLimitMinutes(minutes);
    await StorageService.updateSettings({ screenTimeLimitMinutes: minutes });
  };

  // Weekly chart data
  const maxSeconds = Math.max(...weekData.map(d => d.totalSeconds), 1);

  // Per-app breakdown sorted by time
  const appBreakdown = Object.entries(todayEntry.pages)
    .sort(([, a], [, b]) => b - a)
    .filter(([, seconds]) => seconds > 0);
  const appMaxSeconds = appBreakdown.length > 0 ? appBreakdown[0][1] : 1;

  // Week total
  const weekTotal = weekData.reduce((sum, d) => sum + d.totalSeconds, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Today summary */}
        <View style={styles.todaySummary}>
          <MaterialCommunityIcons name="clock-outline" size={28} color={Colors.primary} />
          <Text style={styles.todayValue}>{formatDuration(todayEntry.totalSeconds)}</Text>
          <Text style={styles.todayLabel}>{t.today}</Text>
          {limitEnabled && limitMinutes > 0 && (
            <View style={styles.limitProgressContainer}>
              <View style={styles.limitProgressBg}>
                <View
                  style={[
                    styles.limitProgressFill,
                    {
                      width: `${Math.min((todayEntry.totalSeconds / (limitMinutes * 60)) * 100, 100)}%`,
                      backgroundColor: todayEntry.totalSeconds >= limitMinutes * 60 ? Colors.error : Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.limitProgressText}>
                {formatDuration(todayEntry.totalSeconds)} / {formatMinutesLabel(limitMinutes)}
              </Text>
            </View>
          )}
        </View>

        {/* 7-day chart */}
        <Card variant="outlined" style={styles.chartCard}>
          <Text style={styles.sectionTitle}>{t.thisWeek}</Text>
          <Text style={styles.weekTotal}>{formatDuration(weekTotal)}</Text>
          <View style={styles.chartContainer}>
            {weekData.map((entry, index) => {
              const dayDate = new Date(entry.date + 'T00:00:00');
              const dayLabel = DAY_LABELS[dayDate.getDay()] || '';
              const isToday = entry.date === todayEntry.date;
              const barHeight = maxSeconds > 0 ? Math.max((entry.totalSeconds / maxSeconds) * 120, 4) : 4;

              return (
                <View key={entry.date} style={styles.chartBar}>
                  <Text style={styles.chartBarValue}>
                    {entry.totalSeconds >= 3600
                      ? `${Math.floor(entry.totalSeconds / 3600)}h`
                      : entry.totalSeconds >= 60
                        ? `${Math.floor(entry.totalSeconds / 60)}m`
                        : ''}
                  </Text>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: barHeight,
                        backgroundColor: isToday ? Colors.primary : Colors.primary + '40',
                      },
                    ]}
                  />
                  <Text style={[styles.chartBarLabel, isToday && styles.chartBarLabelToday]}>
                    {dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Per-app breakdown */}
        <Card variant="outlined" style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>{t.perApp}</Text>
          {appBreakdown.length === 0 && (
            <Text style={styles.noDataText}>{t.noData}</Text>
          )}
          {appBreakdown.map(([pageId, seconds]) => {
            const label = t.pageLabels[pageId] || pageId;
            const icon = PAGE_ICONS[pageId] || 'application';
            const barWidth = `${Math.max((seconds / appMaxSeconds) * 100, 5)}%`;

            return (
              <View key={pageId} style={styles.appRow}>
                <View style={styles.appIconContainer}>
                  <MaterialCommunityIcons name={icon as any} size={18} color={Colors.primary} />
                </View>
                <View style={styles.appInfo}>
                  <View style={styles.appLabelRow}>
                    <Text style={styles.appLabel} numberOfLines={1}>{label}</Text>
                    <Text style={styles.appTime}>{formatDuration(seconds)}</Text>
                  </View>
                  <View style={styles.appBarBg}>
                    <View style={[styles.appBarFill, { width: barWidth as any }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </Card>

        {/* Daily limit settings */}
        <Card variant="outlined" style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <View style={styles.limitIconContainer}>
              <MaterialCommunityIcons name="timer-sand" size={22} color={Colors.warning} />
            </View>
            <View style={styles.limitTextContainer}>
              <View style={styles.limitTitleRow}>
                <Text style={styles.limitTitle}>{t.dailyLimit}</Text>
                {!isPremium && (
                  <View style={styles.premiumBadge}>
                    <MaterialCommunityIcons name="crown" size={10} color={Colors.warning} />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.limitDescription}>
                {limitEnabled
                  ? `Limite : ${formatMinutesLabel(limitMinutes)} par jour`
                  : t.noLimit}
              </Text>
            </View>
            <Switch
              value={limitEnabled}
              onValueChange={handleToggleLimit}
              trackColor={{ false: Colors.light.border, true: Colors.warning + '60' }}
              thumbColor={limitEnabled ? Colors.warning : Colors.light.textSecondary}
            />
          </View>

          {limitEnabled && (
            <View style={styles.presetsContainer}>
              {LIMIT_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetButton,
                    limitMinutes === preset && styles.presetButtonActive,
                  ]}
                  onPress={() => handleSelectPreset(preset)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.presetText,
                      limitMinutes === preset && styles.presetTextActive,
                    ]}
                  >
                    {formatMinutesLabel(preset)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Today summary
  todaySummary: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  todayValue: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  todayLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  limitProgressContainer: {
    width: '100%',
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  limitProgressBg: {
    width: '80%',
    height: 8,
    backgroundColor: Colors.light.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  limitProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  limitProgressText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },

  // Chart
  chartCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  weekTotal: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarValue: {
    fontSize: 10,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  chartBarFill: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  chartBarLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 6,
    fontWeight: '500',
  },
  chartBarLabelToday: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // App breakdown
  breakdownCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noDataText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  appIconContainer: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  appInfo: {
    flex: 1,
  },
  appLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  appLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  appTime: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    marginLeft: Spacing.sm,
  },
  appBarBg: {
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  appBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  // Limit settings
  limitCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  limitIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  limitTextContainer: {
    flex: 1,
  },
  limitTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  limitTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  limitDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warning,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  presetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetButtonActive: {
    backgroundColor: Colors.warning + '15',
    borderColor: Colors.warning,
  },
  presetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  presetTextActive: {
    color: Colors.warning,
  },
});
