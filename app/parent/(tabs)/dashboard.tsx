/**
 * Parent Dashboard Screen - MuslimGuard
 * Main parent control interface with stats and quick actions
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useAppMode } from '@/contexts/app-mode.context';
import { useAuth } from '@/contexts/auth.context';
import { useSubscription } from '@/contexts/subscription.context';
import { BlockingService } from '@/services/blocking.service';
import { NextPrayerInfo, PrayerService } from '@/services/prayer.service';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.dashboard;

/**
 * Format minutes into hours and minutes (e.g., 572 min → 9h32)
 */
function formatTimeRemaining(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h${mins.toString().padStart(2, '0')}`;
}

interface DashboardStats {
  blockedToday: number;
  sitesBlocked: number;
  totalVisits: number;
  keywordsActive: number;
}

export default function DashboardScreen() {
  const { switchToChildMode } = useAppMode();
  const { logout } = useAuth();
  const { isPremium } = useSubscription();
  const [stats, setStats] = useState<DashboardStats>({
    blockedToday: 0,
    sitesBlocked: 0,
    totalVisits: 0,
    keywordsActive: 0,
  });
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [blockedToday, blockedDomains, blockedKeywords, history, prayer] =
          await Promise.all([
            BlockingService.getTodayBlockedCount(),
            BlockingService.getBlockedDomainsCount(),
            BlockingService.getBlockedKeywordsCount(),
            StorageService.getHistory(),
            PrayerService.getNextPrayer(),
          ]);

        setStats({
          blockedToday,
          sitesBlocked: blockedDomains,
          totalVisits: history.length,
          keywordsActive: blockedKeywords,
        });
        setNextPrayer(prayer);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();

    // Refresh every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChildMode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchToChildMode();
    logout();
    // Navigate to root which redirects to /child/browser with a fresh stack
    router.replace('/');
  }, [switchToChildMode, logout]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'history':
        router.push('/parent/(tabs)/history');
        break;
      case 'blocklist':
        router.push('/parent/settings/blocklist');
        break;
      case 'prayer':
        router.push('/parent/(tabs)/prayer');
        break;
      case 'settings':
        router.push('/parent/settings');
        break;
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
          <View>
            <Text style={styles.greeting}>{t.greeting}</Text>
            <Text style={styles.headerTitle}>Mode Parent</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => router.push('/parent/settings')}
          >
            <MaterialCommunityIcons
              name="cog"
              size={24}
              color={Colors.light.text}
            />
          </TouchableOpacity>
        </View>

        {/* Premium Banner */}
        {!isPremium && (
          <TouchableOpacity
            style={styles.premiumBanner}
            onPress={() => router.push('/parent/premium')}
            activeOpacity={0.9}
          >
            <View style={styles.premiumContent}>
              <View style={styles.premiumIconContainer}>
                <MaterialCommunityIcons name="crown" size={30} color="#FFF" />
              </View>
              <View style={styles.premiumTextContainer}>
                <Text style={styles.premiumTitle}>Passer à Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Débloquez toutes les fonctionnalités
                </Text>
              </View>
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color="#FFF"
              />
            </View>
          </TouchableOpacity>
        )}

        {/* Next Prayer Banner */}
        {nextPrayer && (
          <Card variant="elevated" style={styles.prayerBanner}>
            <View style={styles.prayerBannerContent}>
              <View style={styles.prayerIconContainer}>
                <MaterialCommunityIcons
                  name="mosque"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.prayerInfo}>
                <Text style={styles.prayerLabel}>Prochaine prière</Text>
                <Text style={styles.prayerName}>
                  {nextPrayer.nameFr} - {nextPrayer.timeFormatted}
                </Text>
              </View>
              <Text style={styles.prayerTime}>
                Dans {formatTimeRemaining(nextPrayer.minutesRemaining)}
              </Text>
            </View>
          </Card>
        )}

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="shield-off"
            value={stats.blockedToday}
            label={t.stats.blockedToday}
            color={Colors.error}
          />
          <StatCard
            icon="web-off"
            value={stats.sitesBlocked}
            label={t.stats.sitesBlocked}
            color={Colors.warning}
          />
          <StatCard
            icon="eye"
            value={stats.totalVisits}
            label={t.stats.totalVisits}
            color={Colors.primary}
          />
          <StatCard
            icon="text-box-search"
            value={stats.keywordsActive}
            label={t.stats.keywordsActive}
            color={Colors.success}
          />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t.quickActions.title}</Text>
        <View style={styles.actionsContainer}>
          <QuickActionCard
            icon="history"
            title={t.quickActions.viewHistory}
            onPress={() => handleQuickAction('history')}
          />
          <QuickActionCard
            icon="shield-lock"
            title={t.quickActions.manageBlocklist}
            onPress={() => handleQuickAction('blocklist')}
          />
          <QuickActionCard
            icon="mosque"
            title={t.quickActions.prayerTimes}
            onPress={() => handleQuickAction('prayer')}
          />
          <QuickActionCard
            icon="cog"
            title={t.quickActions.settings}
            onPress={() => handleQuickAction('settings')}
          />
        </View>

        {/* Return to Child Mode */}
        <TouchableOpacity
          style={styles.premiumChildModeButton}
          onPress={handleChildMode}
          activeOpacity={0.9}
        >
          <View style={styles.premiumButtonIconContainer}>
            <MaterialCommunityIcons
              name="account-child-circle"
              size={32}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.premiumButtonTextContainer}>
            <Text style={styles.premiumButtonTitle}>{t.childMode}</Text>
            <Text style={styles.premiumButtonSubtitle}>
              Verrouiller l'accès et retourner en sécurité
            </Text>
          </View>
          <MaterialCommunityIcons
            name="lock-reset"
            size={24}
            color="rgba(255, 255, 255, 0.6)"
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// Stat Card Component
function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: string;
}) {
  return (
    <Card variant="elevated" style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </Card>
  );
}

// Quick Action Card Component
function QuickActionCard({
  icon,
  title,
  onPress,
}: {
  icon: string;
  title: string;
  onPress: () => void;
}) {
  return (
    <Card variant="outlined" onPress={onPress} style={styles.actionCard}>
      <View style={styles.actionContent}>
        <View style={styles.actionIconContainer}>
          <MaterialCommunityIcons
            name={icon as any}
            size={24}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.actionTitle}>{title}</Text>
        <MaterialCommunityIcons
          name="chevron-right"
          size={20}
          color={Colors.light.textSecondary}
        />
      </View>
    </Card>
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
  greeting: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  settingsButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
  },
  premiumBanner: {
    backgroundColor: Colors.warning,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    elevation: 4,
    shadowColor: Colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  premiumSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  prayerBanner: {
    marginBottom: Spacing.lg,
  },
  prayerBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  prayerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
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
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  prayerTime: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    width: '47%',
    alignItems: 'center',
    padding: Spacing.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  actionCard: {
    padding: Spacing.md,
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  premiumChildModeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  premiumButtonIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  premiumButtonTextContainer: {
    flex: 1,
  },
  premiumButtonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  premiumButtonSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
});
