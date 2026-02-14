/**
 * Kiosk Mode Settings Screen - MuslimGuard
 * Configure screen pinning and status bar behavior for child mode
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/card';
import { StorageService } from '@/services/storage.service';
import { KioskService } from '@/services/kiosk.service';
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.kiosk;

export default function KioskSettingsScreen() {
  const { isAvailable, requireFeature } = usePremiumFeature('kiosk_mode');
  const [kioskEnabled, setKioskEnabled] = useState(false);
  const [hideStatusBar, setHideStatusBar] = useState(true);
  const [isScreenPinned, setIsScreenPinned] = useState(false);

  useEffect(() => {
    loadSettings();
    checkPinningState();
  }, []);

  const loadSettings = async () => {
    const settings = await StorageService.getSettings();
    setKioskEnabled(settings.kioskModeEnabled);
    setHideStatusBar(settings.kioskHideStatusBar);
  };

  const checkPinningState = async () => {
    const pinned = await KioskService.isActive();
    setIsScreenPinned(pinned);
  };

  const handleToggleKiosk = async (value: boolean) => {
    // Check premium access when enabling
    if (value && !isAvailable) {
      requireFeature();
      return;
    }
    setKioskEnabled(value);
    await StorageService.updateSettings({ kioskModeEnabled: value });
  };

  const handleToggleStatusBar = async (value: boolean) => {
    setHideStatusBar(value);
    await StorageService.updateSettings({ kioskHideStatusBar: value });
  };

  const handleTestPinning = async () => {
    const result = await KioskService.activateKiosk();
    if (!result) {
      Alert.alert(
        translations.common.error,
        'L\'épinglage d\'écran n\'a pas pu être activé. Assurez-vous d\'avoir fait un build natif (npx expo run:android).'
      );
    } else {
      Alert.alert(
        t.screenPinning,
        'L\'épinglage est actif. Pour le désactiver, maintenez les boutons Retour et Récent simultanément.'
      );
      checkPinningState();
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

        {/* Description */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>{t.instructions}</Text>
          </View>
        </Card>

        {/* Main Toggle */}
        <Text style={styles.sectionTitle}>Général</Text>
        <Card variant="outlined" style={styles.section}>
          <View style={styles.settingRow}>
            <View style={[styles.settingIconContainer, { backgroundColor: Colors.primary + '15' }]}>
              <MaterialCommunityIcons
                name="cellphone-lock"
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{t.title}</Text>
              <Text style={styles.settingSubtitle}>
                {kioskEnabled ? t.enabled : t.disabled}
              </Text>
            </View>
            <Switch
              value={kioskEnabled}
              onValueChange={handleToggleKiosk}
              trackColor={{ false: Colors.light.border, true: Colors.primary + '60' }}
              thumbColor={kioskEnabled ? Colors.primary : Colors.light.surface}
            />
          </View>
        </Card>

        {/* Options (only shown when kiosk is enabled) */}
        {kioskEnabled && (
          <>
            <Text style={styles.sectionTitle}>Options</Text>
            <Card variant="outlined" style={styles.section}>
              {/* Hide Status Bar */}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconContainer, { backgroundColor: Colors.warning + '15' }]}>
                  <MaterialCommunityIcons
                    name="cellphone-screenshot"
                    size={22}
                    color={Colors.warning}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t.hideStatusBar}</Text>
                  <Text style={styles.settingSubtitle}>{t.hideStatusBarDesc}</Text>
                </View>
                <Switch
                  value={hideStatusBar}
                  onValueChange={handleToggleStatusBar}
                  trackColor={{ false: Colors.light.border, true: Colors.primary + '60' }}
                  thumbColor={hideStatusBar ? Colors.primary : Colors.light.surface}
                />
              </View>

              <View style={styles.divider} />

              {/* Screen Pinning Info */}
              <View style={styles.settingRow}>
                <View style={[styles.settingIconContainer, { backgroundColor: Colors.success + '15' }]}>
                  <MaterialCommunityIcons
                    name="pin"
                    size={22}
                    color={Colors.success}
                  />
                </View>
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>{t.screenPinning}</Text>
                  <Text style={styles.settingSubtitle}>{t.screenPinningDesc}</Text>
                </View>
                {isScreenPinned && (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Actif</Text>
                  </View>
                )}
              </View>
            </Card>

            {/* Test Button */}
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestPinning}
            >
              <MaterialCommunityIcons
                name="play-circle-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.testButtonText}>{t.testPinning}</Text>
            </TouchableOpacity>
          </>
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
  infoCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary + '08',
  },
  infoContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
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
  settingRow: {
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
  activeBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  activeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  testButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
