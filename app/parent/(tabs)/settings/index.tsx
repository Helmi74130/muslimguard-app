/**
 * Settings Screen - MuslimGuard
 * Main settings menu for parent configuration
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { useSubscription } from '@/contexts/subscription.context';
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.settings;

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
  onInfo?: () => void;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  color = Colors.primary,
  showArrow = true,
  onInfo,
}: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={[styles.settingIconContainer, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onInfo && (
        <TouchableOpacity
          onPress={(e) => { e.stopPropagation(); onInfo(); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
          style={styles.infoButton}
        >
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={Colors.light.textSecondary}
          />
        </TouchableOpacity>
      )}
      {showArrow && (
        <MaterialCommunityIcons
          name="chevron-right"
          size={24}
          color={Colors.light.textSecondary}
        />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { isLoggedIn, isPremium, user, isDevPremium, setDevPremium } = useSubscription();
  const { requireFeature: requireBrowserControl } = usePremiumFeature('browser_control');
  const [readingModeEnabled, setReadingModeEnabled] = useState(false);
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [tooltip, setTooltip] = useState<{ title: string; text: string } | null>(null);

  useEffect(() => {
    StorageService.getSettings().then((settings) => {
      setReadingModeEnabled(settings.readingModeEnabled);
      setBrowserEnabled(settings.browserEnabled);
    });
  }, []);

  const handleToggleReadingMode = useCallback(async (enabled: boolean) => {
    setReadingModeEnabled(enabled);
    await StorageService.updateSettings({ readingModeEnabled: enabled });
  }, []);

  const handleToggleBrowser = useCallback(async (enabled: boolean) => {
    // Only disabling the browser requires premium (re-enabling is always allowed)
    if (!enabled && !requireBrowserControl()) return;
    setBrowserEnabled(enabled);
    await StorageService.updateSettings({ browserEnabled: enabled });
  }, [requireBrowserControl]);

  const handleResetApp = () => {
    Alert.alert(
      t.reset.title,
      t.reset.confirm,
      [
        { text: translations.common.cancel, style: 'cancel' },
        {
          text: t.reset.button,
          style: 'destructive',
          onPress: async () => {
            await StorageService.resetAll();
            router.replace('/onboarding/welcome');
          },
        },
      ]
    );
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
          <Text style={styles.title}>{t.title}</Text>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>COMPTE</Text>
        <Card variant="outlined" style={styles.section}>
          {isLoggedIn ? (
            <>
              <SettingItem
                icon="account-circle"
                title={user?.name || user?.email || 'Mon compte'}
                subtitle={isPremium ? 'Premium actif' : 'Gratuit'}
                onPress={() => router.push('/parent/account')}
                color={isPremium ? Colors.warning : Colors.primary}
              />
              {!isPremium && (
                <>
                  <View style={styles.divider} />
                  <SettingItem
                    icon="star"
                    title="Passer à Premium"
                    subtitle="Débloquer toutes les fonctionnalités"
                    onPress={() => router.push('/parent/premium')}
                    color={Colors.warning}
                  />
                </>
              )}
            </>
          ) : (
            <SettingItem
              icon="login"
              title="Se connecter"
              subtitle="Accéder à votre compte Premium"
              onPress={() => router.push('/parent/account/login')}
            />
          )}
        </Card>

        {/* Content Section */}
        <Text style={styles.sectionTitle}>{t.sections.content}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="shield-lock"
            title="Sites et mots-clés bloqués"
            subtitle="Choisir quels sites ou mots sont interdits à votre enfant"
            onPress={() => router.push('/parent/settings/blocklist')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="youtube"
            title={translations.customVideos.title}
            subtitle={translations.customVideos.subtitle}
            onPress={() => router.push('/parent/settings/custom-videos')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="clock-time-four-outline"
            title={translations.screenTime.title}
            subtitle="Voir combien de temps l'enfant navigue et fixer une limite"
            onPress={() => router.push('/parent/screen-time' as any)}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="clock-outline"
            title="Restrictions horaires"
            subtitle="L'app se bloque automatiquement hors des créneaux autorisés"
            onPress={() => router.push('/parent/settings/schedule')}
          />
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={[styles.settingIconContainer, { backgroundColor: Colors.primary + '15' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={22} color={Colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{translations.readingMode.title}</Text>
              <Text style={styles.settingSubtitle}>
                {readingModeEnabled
                  ? translations.readingMode.enabled
                  : translations.readingMode.disabled}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTooltip({
                title: 'Mode lecture',
                text: "Le mode lecture simplifie l'affichage des pages web : il supprime les publicités, les images inutiles et les distractions.\n\nL'enfant peut lire des articles sans être exposé à des contenus parasites.",
              })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
              style={styles.infoButton}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
            <Switch
              value={readingModeEnabled}
              onValueChange={handleToggleReadingMode}
              trackColor={{ false: Colors.light.border, true: Colors.primary + '60' }}
              thumbColor={readingModeEnabled ? Colors.primary : Colors.light.textSecondary}
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingItem}>
            <View style={[styles.settingIconContainer, { backgroundColor: Colors.primary + '15' }]}>
              <MaterialCommunityIcons name="web" size={22} color={Colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <View style={styles.settingTitleRow}>
                <Text style={styles.settingTitle}>{translations.browserToggle.title}</Text>
                {!isPremium && (
                  <View style={styles.premiumBadge}>
                    <MaterialCommunityIcons name="crown" size={10} color={Colors.warning} />
                    <Text style={styles.premiumBadgeText}>Premium</Text>
                  </View>
                )}
              </View>
              <Text style={styles.settingSubtitle}>
                {browserEnabled
                  ? translations.browserToggle.enabled
                  : translations.browserToggle.disabled}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setTooltip({
                title: 'Navigateur web',
                text: "Quand le navigateur est activé, l'enfant peut naviguer sur internet (avec les filtres actifs).\n\nDésactivez-le pour supprimer complètement l'accès web : l'enfant ne pourra plus ouvrir de site, même ceux de la liste blanche.\n\nUtile le soir, pendant les devoirs ou les repas.",
              })}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
              style={styles.infoButton}
            >
              <MaterialCommunityIcons
                name="information-outline"
                size={18}
                color={Colors.light.textSecondary}
              />
            </TouchableOpacity>
            <Switch
              value={browserEnabled}
              onValueChange={handleToggleBrowser}
              trackColor={{ false: Colors.light.border, true: Colors.primary + '60' }}
              thumbColor={browserEnabled ? Colors.primary : Colors.light.textSecondary}
            />
          </View>
        </Card>

        {/* Security Section */}
        <Text style={styles.sectionTitle}>{t.sections.security}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="lock-reset"
            title={t.changePin.title}
            subtitle="Modifier votre code PIN parent"
            onPress={() => router.push('/parent/settings/pin')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="cellphone-lock"
            title="Verrouillage app"
            subtitle="L'enfant ne peut pas quitter l'app ni changer d'application"
            onPress={() => router.push('/parent/settings/kiosk')}
            onInfo={() => setTooltip({
              title: 'Verrouillage app',
              text: "Quand cette option est activée, l'enfant est bloqué dans MuslimGuard : il ne peut pas appuyer sur le bouton Accueil, changer d'application ou voir la barre de notifications.\n\nPour sortir du mode enfant, saisissez votre code PIN parent.",
            })}
          />
        </Card>

        {/* Prayer Section */}
        <Text style={styles.sectionTitle}>{t.sections.prayer}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="mosque"
            title="Paramètres de prière"
            subtitle="L'app se met en pause automatiquement à l'heure de la prière"
            onPress={() => router.push('/parent/settings/prayer')}
          />
        </Card>

        {/* App Section */}
        <Text style={styles.sectionTitle}>{t.sections.app}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="information"
            title={t.about.title}
            subtitle="Qui sommes-nous, notre mission"
            onPress={() => router.push('/parent/settings/about')}
          />
        </Card>

        {/* Support Section */}
        <Text style={styles.sectionTitle}>{translations.support.sectionTitle}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="bug-outline"
            title={translations.support.reportBug.title}
            subtitle={translations.support.reportBug.subtitle}
            onPress={() => router.push('/parent/settings/report-bug')}
            color={Colors.error}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="message-text-outline"
            title={translations.support.contact.title}
            subtitle={translations.support.contact.subtitle}
            onPress={() => router.push('/parent/settings/contact')}
          />
        </Card>

        {/* Dev / Testing Section */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionTitle}>DÉVELOPPEUR</Text>
            <Card variant="outlined" style={[styles.section, { borderColor: Colors.warning + '40' }]}>
              <View style={styles.settingItem}>
                <View style={[styles.settingIconContainer, { backgroundColor: Colors.warning + '15' }]}>
                  <MaterialCommunityIcons name="bug" size={22} color={Colors.warning} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Simuler Premium</Text>
                  <Text style={styles.settingSubtitle}>
                    {isDevPremium
                      ? 'Premium simulé actif (dev)'
                      : 'Tester les fonctionnalités premium'}
                  </Text>
                </View>
                <Switch
                  value={isDevPremium}
                  onValueChange={setDevPremium}
                  trackColor={{ false: Colors.light.border, true: Colors.warning + '60' }}
                  thumbColor={isDevPremium ? Colors.warning : Colors.light.textSecondary}
                />
              </View>
              <View style={styles.divider} />
              <View style={styles.settingItem}>
                <View style={[styles.settingIconContainer, { backgroundColor: Colors.warning + '15' }]}>
                  <MaterialCommunityIcons name="information" size={22} color={Colors.warning} />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Statut Premium</Text>
                  <Text style={styles.settingSubtitle}>
                    {isPremium
                      ? `Premium actif ${isDevPremium ? '(simulé)' : '(réel)'}`
                      : 'Gratuit'}
                  </Text>
                </View>
              </View>
            </Card>
          </>
        )}

        {/* Danger Zone */}
        <Card variant="outlined" style={[styles.section, styles.dangerSection]}>
          <SettingItem
            icon="delete-forever"
            title={t.reset.title}
            subtitle={t.reset.description}
            onPress={handleResetApp}
            color={Colors.error}
          />
        </Card>
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
              <MaterialCommunityIcons
                name="information"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.tooltipTitle}>{tooltip?.title}</Text>
            </View>
            <Text style={styles.tooltipText}>{tooltip?.text}</Text>
            <TouchableOpacity
              style={styles.tooltipClose}
              onPress={() => setTooltip(null)}
            >
              <Text style={styles.tooltipCloseText}>Compris</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  settingSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginLeft: Spacing.md + 40 + Spacing.md,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  dangerSection: {
    marginTop: Spacing.xl,
    borderColor: Colors.error + '30',
  },
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
});
