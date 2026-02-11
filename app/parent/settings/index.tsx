/**
 * Settings Screen - MuslimGuard
 * Main settings menu for parent configuration
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/card';
import { StorageService } from '@/services/storage.service';
import { useSubscription } from '@/contexts/subscription.context';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.settings;

interface SettingItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  showArrow?: boolean;
}

function SettingItem({
  icon,
  title,
  subtitle,
  onPress,
  color = Colors.primary,
  showArrow = true,
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
  const { isLoggedIn, isPremium, user } = useSubscription();

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors.light.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.placeholder} />
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
            title="Mode kiosque"
            subtitle="Empêcher la sortie de l'application"
            onPress={() => router.push('/parent/settings/kiosk')}
          />
        </Card>

        {/* Content Section */}
        <Text style={styles.sectionTitle}>{t.sections.content}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="shield-lock"
            title="Sites et mots-clés bloqués"
            subtitle="Gérer la liste de blocage"
            onPress={() => router.push('/parent/settings/blocklist')}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="clock-outline"
            title="Restrictions horaires"
            subtitle="Définir les heures autorisées"
            onPress={() => router.push('/parent/settings/schedule')}
          />
        </Card>

        {/* Prayer Section */}
        <Text style={styles.sectionTitle}>{t.sections.prayer}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="mosque"
            title="Paramètres de prière"
            subtitle="Ville, méthode de calcul, pause automatique"
            onPress={() => router.push('/parent/settings/prayer')}
          />
        </Card>

        {/* App Section */}
        <Text style={styles.sectionTitle}>{t.sections.app}</Text>
        <Card variant="outlined" style={styles.section}>
          <SettingItem
            icon="information"
            title={t.about.title}
            subtitle={`${t.about.version} 1.0.0`}
            onPress={() => {}}
            showArrow={false}
          />
          <View style={styles.divider} />
          <SettingItem
            icon="shield-check"
            title="Confidentialité"
            subtitle={t.about.privacyDescription}
            onPress={() => {}}
            showArrow={false}
            color={Colors.success}
          />
        </Card>

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
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
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
  dangerSection: {
    marginTop: Spacing.xl,
    borderColor: Colors.error + '30',
  },
});
