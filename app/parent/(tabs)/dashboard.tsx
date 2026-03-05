/**
 * Parent Dashboard Screen - MuslimGuard
 * Clean overview: protection status, today's stats, quick actions
 */

import { CopilotScrollContext, CopilotTooltip } from '@/components/onboarding/copilot-tooltip';
import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useAppMode } from '@/contexts/app-mode.context';
import { useAuth } from '@/contexts/auth.context';
import { useSubscription } from '@/contexts/subscription.context';
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { BlockingService } from '@/services/blocking.service';
import { ScreenTimeService } from '@/services/screen-time.service';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
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
  screenTimeToday: number; // seconds
  screenTimeLimitEnabled: boolean;
  screenTimeLimitMinutes: number;
}

// Y offsets for each copilot step order (approximate scroll targets)
const STEP_SCROLL_Y: Record<number, number> = {
  1: 0,     // parent-protection
  2: 280,   // parent-stats
  3: 480,   // parent-toggles
  4: 820,   // parent-actions
  5: 1100,  // parent-child-mode
  6: 1200,  // parent-tab-bar
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
  const [tooltip, setTooltip] = useState<{ title: string; text: string } | null>(null);
  const [data, setData] = useState<DashboardData>({
    blockedToday: 0,
    totalVisits: 0,
    strictMode: false,
    autoPause: true,
    browserEnabled: true,
    kioskEnabled: false,
    screenTimeToday: 0,
    screenTimeLimitEnabled: false,
    screenTimeLimitMinutes: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [blockedToday, history, settings, screenTimeToday] = await Promise.all([
          BlockingService.getTodayBlockedCount(),
          StorageService.getHistory(),
          StorageService.getSettings(),
          ScreenTimeService.getTodayTotalSeconds(),
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
          screenTimeToday,
          screenTimeLimitEnabled: settings.screenTimeLimitEnabled,
          screenTimeLimitMinutes: settings.screenTimeLimitMinutes,
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
  const activeCount = [data.strictMode, data.autoPause, data.kioskEnabled].filter(Boolean).length;
  const protectionLevel = (data.strictMode && data.kioskEnabled) ? 'super' : (data.strictMode || activeCount >= 3) ? 'high' : 'medium';
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
          <CopilotView collapsable={false} style={{ marginBottom: -25, paddingBottom: 25 }}>
            <Text style={styles.sectionTitle}>État de protection</Text>
            <Card variant="outlined" style={styles.protectionCard}>
              <View style={styles.protectionHeader}>
                <View
                  style={[
                    styles.protectionIconContainer,
                    {
                      backgroundColor:
                        protectionLevel === 'super'
                          ? Colors.primary + '15'
                          : protectionLevel === 'high'
                            ? Colors.success + '15'
                            : Colors.warning + '15',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={protectionLevel === 'super' ? 'shield-lock' : protectionLevel === 'high' ? 'shield-check' : 'shield-alert'}
                    size={28}
                    color={protectionLevel === 'super' ? Colors.primary : protectionLevel === 'high' ? Colors.success : Colors.warning}
                  />
                </View>
                <View style={styles.protectionTextContainer}>
                  <Text style={styles.protectionTitle}>
                    {protectionLevel === 'super'
                      ? 'Super protection'
                      : protectionLevel === 'high'
                        ? 'Protection élevée'
                        : 'Protection partielle'}
                  </Text>
                  <Text style={styles.protectionSubtitle}>
                    {protectionLevel === 'super'
                      ? 'Mode strict et verrouillage actifs'
                      : protectionLevel === 'high'
                        ? 'Tous les filtres sont actifs'
                        : 'Certains filtres peuvent être renforcés'}
                  </Text>
                </View>
              </View>
              <View style={styles.badgesRow}>
                <StatusBadge label="Mode strict" active={data.strictMode} />
                <StatusBadge label="Pause prière" active={data.autoPause} />
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
          <CopilotView collapsable={false} style={{ marginBottom: -25, paddingBottom: 25 }}>
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

        {/* Screen Time Card */}
        <TouchableOpacity
          style={styles.screenTimeCard}
          onPress={() => router.push('/parent/screen-time' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.screenTimeIconContainer}>
            <MaterialCommunityIcons name="clock-outline" size={24} color={Colors.primary} />
          </View>
          <View style={styles.screenTimeContent}>
            <Text style={styles.screenTimeLabel}>Temps d'écran aujourd'hui</Text>
            <Text style={styles.screenTimeValue}>
              {data.screenTimeToday >= 3600
                ? `${Math.floor(data.screenTimeToday / 3600)}h ${String(Math.floor((data.screenTimeToday % 3600) / 60)).padStart(2, '0')}min`
                : `${Math.floor(data.screenTimeToday / 60)} min`}
            </Text>
          </View>
          {data.screenTimeLimitEnabled && (
            <View style={styles.screenTimeLimitBadge}>
              <Text style={styles.screenTimeLimitText}>
                / {data.screenTimeLimitMinutes >= 60
                  ? `${Math.floor(data.screenTimeLimitMinutes / 60)}h${data.screenTimeLimitMinutes % 60 > 0 ? String(data.screenTimeLimitMinutes % 60).padStart(2, '0') : ''}`
                  : `${data.screenTimeLimitMinutes}min`}
              </Text>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.light.textSecondary} />
        </TouchableOpacity>

        {/* Step 3 — Quick Toggles */}
        <CopilotStep text={tour.parentToggles} order={3} name="parent-toggles">
          <CopilotView collapsable={false} style={{ marginBottom: -25, paddingBottom: 25 }}>
            <Text style={styles.sectionTitle}>Contrôles rapides</Text>
            <Card variant="outlined" style={styles.togglesCard}>
              <QuickToggle
                icon="web"
                label="Navigateur"
                description={data.browserEnabled
                  ? "Activé — décochez pour désactiver l'accès web"
                  : "Désactivé — cochez pour autoriser l'accès web"}
                value={data.browserEnabled}
                onToggle={handleToggleBrowser}
                premium={!isPremium}
                onInfo={() => setTooltip({
                  title: 'Navigateur web',
                  text: "Quand le navigateur est activé, l'enfant peut naviguer sur internet (avec les filtres actifs).\n\nDésactivez-le pour supprimer complètement l'accès web : l'enfant ne pourra plus ouvrir de site, même ceux de la liste blanche.\n\nUtile le soir, pendant les devoirs ou les repas.",
                })}
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
                onInfo={() => setTooltip({
                  title: 'Mode strict',
                  text: "En mode strict, l'enfant ne peut accéder qu'aux sites que vous avez ajoutés dans votre liste blanche.\n\nTous les autres sites sont bloqués automatiquement, même ceux non répertoriés dans la liste de blocage.",
                })}
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
                onInfo={() => setTooltip({
                  title: 'Verrouillage app',
                  text: "Quand cette option est activée, l'enfant est bloqué dans MuslimGuard : il ne peut pas appuyer sur le bouton Accueil, changer d'application ou voir la barre de notifications.\n\nPour sortir du mode enfant, saisissez votre code PIN parent.",
                })}
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
          <CopilotView collapsable={false} style={{ marginBottom: -25, paddingBottom: 25 }}>
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
                <View style={styles.quickActionTextGroup}>
                  <Text style={styles.quickActionLabel}>Sites et mots bloqués</Text>
                  <Text style={styles.quickActionDesc}>Gérer la liste de blocage</Text>
                </View>
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
                <View style={styles.quickActionTextGroup}>
                  <Text style={styles.quickActionLabel}>Restrictions horaires</Text>
                  <Text style={styles.quickActionDesc}>Bloquer l'accès la nuit ou le matin</Text>
                </View>
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
          <CopilotView collapsable={false} style={{ marginBottom: -25, paddingBottom: 25 }}>
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
                  <MaterialCommunityIcons name="teddy-bear" size={18} color="#FFFFFF" />
                  <Text style={styles.childModePlayText}>C'est parti !</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </CopilotView>
        </CopilotStep>

        {/* Step 6 — Tab Bar */}
        <CopilotStep text={tour.parentTabBar} order={6} name="parent-tab-bar">
          <CopilotView collapsable={false} style={styles.tabBarTarget} />
        </CopilotStep>

      </ScrollView>

      {/* Tooltip Modal */}
      <Modal
        visible={tooltip !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltip(null)}
      >
        <TouchableOpacity
          style={styles.tooltipOverlay}
          activeOpacity={1}
          onPress={() => setTooltip(null)}
        >
          <View style={styles.tooltipCard}>
            <View style={styles.tooltipHeader}>
              <MaterialCommunityIcons name="information" size={20} color={Colors.primary} />
              <Text style={styles.tooltipTitle}>{tooltip?.title}</Text>
            </View>
            <Text style={styles.tooltipText}>{tooltip?.text}</Text>
            <TouchableOpacity style={styles.tooltipClose} onPress={() => setTooltip(null)}>
              <Text style={styles.tooltipCloseText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  onInfo,
}: {
  icon: string;
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  color?: string;
  premium?: boolean;
  onInfo?: () => void;
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
      {onInfo && (
        <TouchableOpacity
          onPress={onInfo}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={17}
            color={Colors.light.textSecondary}
          />
        </TouchableOpacity>
      )}
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
  quickActionTextGroup: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
  },
  quickActionDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 1,
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
    elevation: 12,
    shadowColor: '#E8C878',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.7,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: '#E8C878',
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
    elevation: 6,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
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
  tabBarTarget: {
    height: 10,
    marginTop: Spacing.xl,
  },

  // Info button (ⓘ)
  infoButton: {
    padding: 2,
    marginRight: 4,
  },
  // Tooltip Modal
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  tooltipCard: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.md,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  tooltipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    flex: 1,
  },
  tooltipText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 21,
  },
  tooltipClose: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
  },
  tooltipCloseText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },

  // Screen Time Card
  screenTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
    gap: Spacing.sm,
  },
  screenTimeIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTimeContent: {
    flex: 1,
  },
  screenTimeLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  screenTimeValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
  },
  screenTimeLimitBadge: {
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  screenTimeLimitText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.warning,
  },
});
