/**
 * Parent Dashboard Screen - MuslimGuard
 * Clean overview: protection status, today's stats, quick actions
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useAppMode } from '@/contexts/app-mode.context';
import { useAuth } from '@/contexts/auth.context';
import { useSubscription } from '@/contexts/subscription.context';
import { BlockingService } from '@/services/blocking.service';
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

interface DashboardData {
  blockedToday: number;
  totalVisits: number;
  strictMode: boolean;
  autoPause: boolean;
  browserEnabled: boolean;
}

export default function DashboardScreen() {
  const { switchToChildMode } = useAppMode();
  const { logout } = useAuth();
  const { isPremium } = useSubscription();
  const [data, setData] = useState<DashboardData>({
    blockedToday: 0,
    totalVisits: 0,
    strictMode: false,
    autoPause: true,
    browserEnabled: true,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [blockedToday, history, settings] = await Promise.all([
          BlockingService.getTodayBlockedCount(),
          StorageService.getHistory(),
          StorageService.getSettings(),
        ]);

        setData({
          blockedToday,
          totalVisits: history.filter(
            (h) => h.timestamp >= new Date().setHours(0, 0, 0, 0)
          ).length,
          strictMode: settings.strictModeEnabled,
          autoPause: settings.autoPauseDuringPrayer,
          browserEnabled: settings.browserEnabled,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleChildMode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchToChildMode();
    logout();
    router.replace('/');
  }, [switchToChildMode, logout]);

  // Protection level
  const protectionLevel = data.strictMode ? 'high' : data.browserEnabled ? 'medium' : 'high';
  const blockRate = data.totalVisits > 0
    ? Math.round((data.blockedToday / data.totalVisits) * 100)
    : 0;

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

        {/* Protection Status */}
        <Text style={styles.sectionTitle}>État de protection</Text>
        <Card variant="outlined" style={styles.protectionCard}>
          <View style={styles.protectionHeader}>
            <View
              style={[
                styles.protectionIconContainer,
                {
                  backgroundColor:
                    protectionLevel === 'high'
                      ? Colors.success + '15'
                      : Colors.warning + '15',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={protectionLevel === 'high' ? 'shield-check' : 'shield-alert'}
                size={28}
                color={protectionLevel === 'high' ? Colors.success : Colors.warning}
              />
            </View>
            <View style={styles.protectionTextContainer}>
              <Text style={styles.protectionTitle}>
                {protectionLevel === 'high'
                  ? 'Protection élevée'
                  : 'Protection partielle'}
              </Text>
              <Text style={styles.protectionSubtitle}>
                {protectionLevel === 'high'
                  ? 'Tous les filtres sont actifs'
                  : 'Certains filtres peuvent être renforcés'}
              </Text>
            </View>
          </View>
          <View style={styles.badgesRow}>
            <StatusBadge
              label="Mode strict"
              active={data.strictMode}
            />
            <StatusBadge
              label="Pause prière"
              active={data.autoPause}
            />
            <StatusBadge
              label="Navigateur"
              active={data.browserEnabled}
            />
          </View>
        </Card>

        {/* Today Stats */}
        <Text style={styles.sectionTitle}>Aujourd'hui</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data.totalVisits}</Text>
            <Text style={styles.statLabel}>Visites</Text>
          </View>
          <View style={[styles.statCard, styles.statCardBlocked]}>
            <Text style={[styles.statNumber, { color: Colors.error }]}>
              {data.blockedToday}
            </Text>
            <Text style={styles.statLabel}>Bloqués</Text>
          </View>
          <View style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                { color: blockRate > 50 ? Colors.error : Colors.primary },
              ]}
            >
              {blockRate}%
            </Text>
            <Text style={styles.statLabel}>Taux</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Accès rapide</Text>
        <View style={styles.actionsContainer}>
          <Card
            variant="outlined"
            onPress={() => router.push('/parent/settings/blocklist')}
            style={styles.actionCard}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons
                  name="shield-lock"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.actionTitle}>Gérer les blocages</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={Colors.light.textSecondary}
              />
            </View>
          </Card>
          <Card
            variant="outlined"
            onPress={() => router.push('/parent/settings/schedule')}
            style={styles.actionCard}
          >
            <View style={styles.actionContent}>
              <View style={styles.actionIconContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={Colors.primary}
                />
              </View>
              <Text style={styles.actionTitle}>Restrictions horaires</Text>
              <MaterialCommunityIcons
                name="chevron-right"
                size={20}
                color={Colors.light.textSecondary}
              />
            </View>
          </Card>
        </View>

        {/* Return to Child Mode */}
        <TouchableOpacity
          style={styles.childModeButton}
          onPress={handleChildMode}
          activeOpacity={0.9}
        >
          <View style={styles.childModeIconContainer}>
            <MaterialCommunityIcons
              name="account-child-circle"
              size={32}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.childModeTextContainer}>
            <Text style={styles.childModeTitle}>{t.childMode}</Text>
            <Text style={styles.childModeSubtitle}>
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

function StatusBadge({ label, active }: { label: string; active: boolean }) {
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: active ? Colors.success + '15' : Colors.light.surface },
      ]}
    >
      <View
        style={[
          styles.badgeDot,
          { backgroundColor: active ? Colors.success : Colors.light.textSecondary },
        ]}
      />
      <Text
        style={[
          styles.badgeText,
          { color: active ? Colors.success : Colors.light.textSecondary },
        ]}
      >
        {label}
      </Text>
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

  // Header
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

  // Premium Banner
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

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },

  // Protection Card
  protectionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  protectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  protectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  protectionTextContainer: {
    flex: 1,
  },
  protectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  protectionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  statCardBlocked: {},
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },

  // Quick Actions
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

  // Child Mode Button
  childModeButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    elevation: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  childModeIconContainer: {
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
  childModeTextContainer: {
    flex: 1,
  },
  childModeTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  childModeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
});
