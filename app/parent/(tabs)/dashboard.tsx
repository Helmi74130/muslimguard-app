/**
 * Parent Dashboard Screen - MuslimGuard
 * Main parent control interface with stats and quick actions
 */

import { DashboardCharts } from '@/components/dashboard/dashboard-charts';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useAppMode } from '@/contexts/app-mode.context';
import { useAuth } from '@/contexts/auth.context';
import { useSubscription } from '@/contexts/subscription.context';
import { BlockingService } from '@/services/blocking.service';
import { StorageService } from '@/services/storage.service';
import { HistoryEntry } from '@/types/storage.types';
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


interface DashboardStats {
  blockedToday: number;
  totalVisits: number;
  history: HistoryEntry[];
}

export default function DashboardScreen() {
  const { switchToChildMode } = useAppMode();
  const { logout } = useAuth();
  const { isPremium } = useSubscription();
  const [stats, setStats] = useState<DashboardStats>({
    blockedToday: 0,
    totalVisits: 0,
    history: [],
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [blockedToday, history] =
          await Promise.all([
            BlockingService.getTodayBlockedCount(),
            StorageService.getHistory(),
          ]);

        setStats({
          blockedToday,
          totalVisits: history.length,
          history,
        });
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
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.settingsButton, { marginRight: Spacing.sm }]}
              onPress={handleChildMode}
            >
              <MaterialCommunityIcons
                name="account-child-circle"
                size={24}
                color={Colors.primary}
              />
            </TouchableOpacity>
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


        {/* Stats Grid */}
        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Statistiques</Text>
        <DashboardCharts history={stats.history} />

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.md,
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
