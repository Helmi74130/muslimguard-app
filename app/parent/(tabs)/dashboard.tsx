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
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { BlockingService } from '@/services/blocking.service';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import {
  CopilotProvider,
  CopilotStep,
  useCopilot,
  walkthroughable,
} from 'react-native-copilot';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CopilotTooltip, CopilotScrollContext } from '@/components/onboarding/copilot-tooltip';

const t = translations.dashboard;
const tour = translations.onboardingTour;
const CopilotView = walkthroughable(View);

interface DashboardData {
  blockedToday: number;
  totalVisits: number;
  strictMode: boolean;
  autoPause: boolean;
  browserEnabled: boolean;
  kioskEnabled: boolean;
}

// Y offsets for each copilot step order (approximate scroll targets)
const STEP_SCROLL_Y: Record<number, number> = {
  1: 0,     // parent-protection
  2: 280,   // parent-stats
  3: 480,   // parent-toggles
  4: 820,   // parent-actions
  5: 1100,  // parent-child-mode
  6: 99999, // parent-tab-bar (scroll to bottom)
};

export default function DashboardScreen() {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToStep = useCallback(async (stepOrder: number) => {
    const y = STEP_SCROLL_Y[stepOrder];
    if (y != null) {
      scrollViewRef.current?.scrollTo({ y, animated: false });
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }, []);

  return (
    <CopilotScrollContext.Provider value={{ scrollToStep }}>
      <CopilotProvider
        tooltipComponent={CopilotTooltip}
        overlay="svg"
        backdropColor="rgba(0, 0, 0, 0.7)"
        tooltipStyle={{ borderRadius: 16 }}
        arrowColor="#FFFFFF"
      >
        <DashboardContent scrollViewRef={scrollViewRef} />
      </CopilotProvider>
    </CopilotScrollContext.Provider>
  );
}

function DashboardContent({ scrollViewRef }: { scrollViewRef: React.RefObject<ScrollView | null> }) {
  const { start, copilotEvents } = useCopilot();
  const { switchToChildMode } = useAppMode();
  const { logout } = useAuth();
  const { isPremium } = useSubscription();
  const { requireFeature: requireBrowserControl } = usePremiumFeature('browser_control');
  const { requireFeature: requireStrictMode } = usePremiumFeature('strict_mode');
  const { requireFeature: requireKiosk } = usePremiumFeature('kiosk_mode');
  const [parentTourDone, setParentTourDone] = useState(true);
  const [data, setData] = useState<DashboardData>({
    blockedToday: 0,
    totalVisits: 0,
    strictMode: false,
    autoPause: true,
    browserEnabled: true,
    kioskEnabled: false,
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
          kioskEnabled: settings.kioskModeEnabled,
        });
        setParentTourDone(settings.parentTourDone);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  // Auto-start onboarding tour on first visit
  useEffect(() => {
    if (parentTourDone) return;
    const timer = setTimeout(() => {
      start();
    }, 600);
    return () => clearTimeout(timer);
  }, [parentTourDone]);

  // Persist tour completion on stop
  useEffect(() => {
    const onStop = () => {
      StorageService.updateSettings({ parentTourDone: true });
      setParentTourDone(true);
    };
    copilotEvents.on('stop', onStop);
    return () => {
      copilotEvents.off('stop', onStop);
    };
  }, [copilotEvents]);

  const handleChildMode = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    switchToChildMode();
    logout();
    router.replace('/');
  }, [switchToChildMode, logout]);

  const handleToggleBrowser = useCallback(async (enabled: boolean) => {
    // Only disabling the browser requires premium (re-enabling is always allowed)
    if (!enabled && !requireBrowserControl()) return;
    // Update state first to avoid flicker, then persist
    setData(prev => ({ ...prev, browserEnabled: enabled }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await StorageService.updateSettings({ browserEnabled: enabled });
  }, [requireBrowserControl]);

  const handleToggleStrict = useCallback(async (enabled: boolean) => {
    if (!requireStrictMode()) return;
    // Update state first to avoid flicker, then persist
    setData(prev => ({ ...prev, strictMode: enabled }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await StorageService.updateSettings({ strictModeEnabled: enabled });
  }, [requireStrictMode]);

  const handleToggleKiosk = useCallback(async (enabled: boolean) => {
    if (enabled && !requireKiosk()) return;
    setData(prev => ({ ...prev, kioskEnabled: enabled }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await StorageService.updateSettings({ kioskModeEnabled: enabled });
  }, [requireKiosk]);

  const handleToggleAutoPause = useCallback(async (enabled: boolean) => {
    // Update state first to avoid flicker, then persist
    setData(prev => ({ ...prev, autoPause: enabled }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await StorageService.updateSettings({ autoPauseDuringPrayer: enabled });
  }, []);

  // Protection level
  const protectionLevel = (data.strictMode || !data.browserEnabled || data.kioskEnabled) ? 'high' : 'medium';
  const blockRate = data.totalVisits > 0
    ? Math.round((data.blockedToday / data.totalVisits) * 100)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
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

        {/* Step 1 — Protection Status */}
        <CopilotStep text={tour.parentProtection} order={1} name="parent-protection">
          <CopilotView collapsable={false}>
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
                <StatusBadge label="Mode strict" active={data.strictMode} />
                <StatusBadge label="Pause prière" active={data.autoPause} />
                <StatusBadge label="Navigateur" active={data.browserEnabled} />
                <StatusBadge label="Verrouillé" active={data.kioskEnabled} />
              </View>
            </Card>
          </CopilotView>
        </CopilotStep>

        {/* Settings shortcut */}
        <Card
          variant="outlined"
          onPress={() => router.push('/parent/settings')}
          style={styles.settingsActionCard}
        >
          <View style={styles.settingsActionContent}>
            <View style={styles.settingsActionIcon}>
              <MaterialCommunityIcons name="cog" size={24} color={Colors.light.textSecondary} />
            </View>
            <View style={styles.settingsTextContainer}>
              <Text style={styles.settingsActionTitle}>Tous les paramètres</Text>
              <Text style={styles.settingsHint}>PIN, historique, liste blanche…</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.light.textSecondary} />
          </View>
        </Card>

        {/* Step 2 — Today Stats */}
        <CopilotStep text={tour.parentStats} order={2} name="parent-stats">
          <CopilotView collapsable={false}>
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
          </CopilotView>
        </CopilotStep>

        {/* View stats link */}
        <TouchableOpacity
          style={styles.viewStatsButton}
          onPress={() => router.push('/parent/(tabs)/history')}
          activeOpacity={0.6}
        >
          <MaterialCommunityIcons name="chart-line" size={16} color={Colors.primary} />
          <Text style={styles.viewStatsText}>Voir les statistiques</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.primary} />
        </TouchableOpacity>

        {/* Step 3 — Quick Toggles */}
        <CopilotStep text={tour.parentToggles} order={3} name="parent-toggles">
          <CopilotView collapsable={false}>
            <Text style={styles.sectionTitle}>Contrôles rapides</Text>
            <Card variant="outlined" style={styles.togglesCard}>
              <QuickToggle
                icon="web"
                label="Navigateur"
                description={data.browserEnabled
                  ? "Activé — décochez pour bloquer l'accès web"
                  : "Désactivé — cochez pour autoriser l'accès web"}
                value={data.browserEnabled}
                onToggle={handleToggleBrowser}
                premium={!isPremium}
              />
              <View style={styles.toggleDivider} />
              <QuickToggle
                icon="shield-lock"
                label="Mode strict"
                description={data.strictMode
                  ? "Activé — seuls les sites en liste blanche sont accessibles"
                  : "Désactivé — cochez pour n'autoriser que la liste blanche"}
                value={data.strictMode}
                onToggle={handleToggleStrict}
                premium={!isPremium}
              />
              <View style={styles.toggleDivider} />
              <QuickToggle
                icon="cellphone-lock"
                label="Verrouillage app"
                description={data.kioskEnabled
                  ? "Activé — l'enfant ne peut pas quitter l'app"
                  : "Désactivé — cochez pour empêcher la sortie de l'app"}
                value={data.kioskEnabled}
                onToggle={handleToggleKiosk}
                premium={!isPremium}
              />
              <View style={styles.toggleDivider} />
              <QuickToggle
                icon="clock-check"
                label="Pause prière auto"
                description={data.autoPause
                  ? "Activé — le web se coupe pendant les prières"
                  : "Désactivé — cochez pour couper le web aux heures de prière"}
                value={data.autoPause}
                onToggle={handleToggleAutoPause}
              />
            </Card>
          </CopilotView>
        </CopilotStep>

        {/* Step 4 — Quick Actions */}
        <CopilotStep text={tour.parentActions} order={4} name="parent-actions">
          <CopilotView collapsable={false}>
            <Text style={styles.sectionTitle}>Accès rapide</Text>
            <Card variant="outlined" style={styles.quickActionsCard}>
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/parent/settings/blocklist')}
                activeOpacity={0.6}
              >
                <View style={styles.quickActionIcon}>
                  <MaterialCommunityIcons name="shield-lock" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Gérer les blocages</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.light.textSecondary} />
              </TouchableOpacity>
              <View style={styles.quickActionDivider} />
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/parent/settings/schedule')}
                activeOpacity={0.6}
              >
                <View style={styles.quickActionIcon}>
                  <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Restrictions horaires</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.light.textSecondary} />
              </TouchableOpacity>
              <View style={styles.quickActionDivider} />
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/parent/(tabs)/history')}
                activeOpacity={0.6}
              >
                <View style={styles.quickActionIcon}>
                  <MaterialCommunityIcons name="chart-bar" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Statistiques</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.light.textSecondary} />
              </TouchableOpacity>
              <View style={styles.quickActionDivider} />
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={() => router.push('/parent/settings/custom-videos')}
                activeOpacity={0.6}
              >
                <View style={styles.quickActionIcon}>
                  <MaterialCommunityIcons name="video-plus" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.quickActionLabel}>Mes vidéos personnalisées</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </Card>
          </CopilotView>
        </CopilotStep>

        {/* Step 5 — Return to Child Mode */}
        <CopilotStep text={tour.parentChildMode} order={5} name="parent-child-mode">
          <CopilotView collapsable={false}>
            <TouchableOpacity
              style={styles.childModeButton}
              onPress={handleChildMode}
              activeOpacity={0.9}
            >
              <Image
                source={require('@/assets/images/ours.png')}
                style={styles.childModeImage}
                resizeMode="contain"
              />
              <View style={styles.childModeTextContainer}>
                <Text style={styles.childModeLabel}>Mode enfant</Text>
                <Text style={styles.childModeTitle}>{t.childMode}</Text>
                <TouchableOpacity style={styles.childModePlayButton} onPress={handleChildMode}>
                  <MaterialCommunityIcons name="play" size={18} color="#FFFFFF" />
                  <Text style={styles.childModePlayText}>C'est parti !</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </CopilotView>
        </CopilotStep>

        {/* Step 6 — Tab Bar Navigation */}
        <CopilotStep text={tour.parentTabBar} order={6} name="parent-tab-bar">
          <CopilotView collapsable={false} style={styles.tabBarIndicator}>
            <MaterialCommunityIcons name="arrow-down" size={18} color={Colors.primary} />
            <Text style={styles.tabBarIndicatorText}>Menu de navigation</Text>
            <MaterialCommunityIcons name="arrow-down" size={18} color={Colors.primary} />
          </CopilotView>
        </CopilotStep>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickToggle({
  icon,
  label,
  description,
  value,
  onToggle,
  color = Colors.primary,
  premium = false,
}: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  color?: string;
  premium?: boolean;
}) {
  return (
    <View style={styles.toggleItem}>
      <View style={[styles.toggleIconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      </View>
      <View style={styles.toggleContent}>
        <View style={styles.toggleLabelRow}>
          <Text style={styles.toggleLabel}>{label}</Text>
          {premium && (
            <View style={styles.premiumBadge}>
              <MaterialCommunityIcons name="crown" size={10} color={Colors.warning} />
              <Text style={styles.premiumBadgeText}>Premium</Text>
            </View>
          )}
        </View>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.light.border, true: color + '60' }}
        thumbColor={value ? color : Colors.light.textSecondary}
      />
    </View>
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
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  badgeText: {
    fontSize: 10,
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
  viewStatsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.lg,
  },
  viewStatsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Quick Actions (compact)
  quickActionsCard: {
    padding: 0,
    marginBottom: Spacing.xl,
    overflow: 'hidden',
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  quickActionDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: Spacing.sm + 30 + Spacing.sm,
  },
  settingsActionCard: {
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderStyle: 'dashed' as any,
  },
  settingsActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  settingsActionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsTextContainer: {
    flex: 1,
  },
  settingsActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  settingsHint: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  // Child Mode Button
  childModeButton: {
    backgroundColor: '#FFF5E6',
    borderRadius: 20,
    padding: Spacing.lg,
    paddingRight: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    elevation: 4,
    shadowColor: '#E8C878',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  childModeImage: {
    width: 130,
    height: 130,
    marginRight: Spacing.md,
    marginLeft: -Spacing.lg,
    marginBottom: -Spacing.lg - 8,
    alignSelf: 'flex-end',
  },
  childModeTextContainer: {
    flex: 1,
    paddingLeft: Spacing.sm,
  },
  childModeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  childModeTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    marginBottom: Spacing.sm,
  },
  childModePlayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  childModePlayText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Toggles
  togglesCard: {
    padding: 0,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  toggleIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContent: {
    flex: 1,
  },
  toggleLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
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
  toggleDescription: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: Spacing.md + 36 + Spacing.md,
  },
  tabBarIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  tabBarIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
});
