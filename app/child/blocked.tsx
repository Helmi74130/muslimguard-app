/**
 * Blocked Screen - MuslimGuard Child Mode
 * Displayed when content is blocked
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { BlockReason } from '@/services/blocking.service';
import { PrayerService, PRAYER_NAMES_FR } from '@/services/prayer.service';
import { PrayerName } from '@/types/storage.types';

const t = translations.blocked;

const REASON_ICONS: Record<BlockReason, string> = {
  domain: 'web-off',
  keyword: 'text-box-remove',
  prayer: 'mosque',
  schedule: 'clock-alert',
  whitelist: 'shield-lock',
};

const REASON_COLORS: Record<BlockReason, string> = {
  domain: Colors.error,
  keyword: Colors.warning,
  prayer: Colors.primary,
  schedule: Colors.warning,
  whitelist: Colors.error,
};

interface PrayerPauseInfo {
  isPaused: boolean;
  currentPrayer?: PrayerName;
  minutesRemaining?: number;
}

export default function BlockedScreen() {
  const params = useLocalSearchParams<{
    url: string;
    reason: BlockReason;
    blockedBy: string;
  }>();

  const { url, reason = 'domain', blockedBy } = params;
  const [prayerPause, setPrayerPause] = useState<PrayerPauseInfo>({ isPaused: false });

  // Load prayer pause info
  useEffect(() => {
    const loadPrayerInfo = async () => {
      if (reason === 'prayer') {
        const info = await PrayerService.isInPrayerPauseWindow();
        setPrayerPause(info);
      }
    };

    loadPrayerInfo();

    // Refresh every minute
    const interval = setInterval(loadPrayerInfo, 60000);
    return () => clearInterval(interval);
  }, [reason]);

  const handleGoBack = () => {
    // Use router.back() to return to browser screen
    // The browser's handleNavigationStateChange will catch
    // if the WebView is still on a blocked URL and force it back
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/child/browser');
    }
  };

  const handleParentAccess = () => {
    router.push('/pin-entry');
  };

  // Get reason message
  const getReasonMessage = () => {
    switch (reason) {
      case 'domain':
        return t.reasons.domain;
      case 'keyword':
        return t.reasons.keyword;
      case 'prayer':
        return t.reasons.prayerTime;
      case 'schedule':
        return t.reasons.schedule;
      case 'whitelist':
        return t.reasons.whitelist;
      default:
        return t.reasons.domain;
    }
  };

  // Get additional info based on reason
  const getAdditionalInfo = () => {
    if (reason === 'prayer') {
      if (prayerPause.isPaused && prayerPause.currentPrayer) {
        const prayerName = PRAYER_NAMES_FR[prayerPause.currentPrayer];
        return (
          <Card variant="outlined" style={styles.infoCard}>
            <View style={styles.infoContent}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.infoText}>
                {t.prayerTimeRemaining.replace('{minutes}', String(prayerPause.minutesRemaining || 0))}
              </Text>
            </View>
            <Text style={styles.prayerName}>
              C'est l'heure de {prayerName}
            </Text>
          </Card>
        );
      }
    }

    if (reason === 'schedule') {
      return (
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={20}
              color={Colors.warning}
            />
            <Text style={styles.infoText}>
              La navigation n'est pas autorisée pour le moment.
            </Text>
          </View>
        </Card>
      );
    }

    return null;
  };

  const iconColor = REASON_COLORS[reason] || Colors.error;
  const iconName = REASON_ICONS[reason] || 'shield-off';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
          <MaterialCommunityIcons
            name={iconName as any}
            size={64}
            color={iconColor}
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.subtitle}>{t.subtitle}</Text>

        {/* Reason */}
        <Card variant="elevated" style={styles.reasonCard}>
          <Text style={styles.reasonText}>{getReasonMessage()}</Text>
        </Card>

        {/* Additional info */}
        {getAdditionalInfo()}

        {/* URL (optional display) */}
        {url && reason !== 'prayer' && reason !== 'schedule' && (
          <View style={styles.urlContainer}>
            <Text style={styles.urlLabel}>URL bloquée :</Text>
            <Text style={styles.urlText} numberOfLines={2}>
              {url}
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title={t.goBack}
            onPress={handleGoBack}
            size="large"
            fullWidth
            icon={
              <MaterialCommunityIcons
                name="arrow-left"
                size={20}
                color="#FFFFFF"
              />
            }
          />

          <Button
            title={t.contactParent}
            variant="outline"
            onPress={handleParentAccess}
            size="large"
            fullWidth
            icon={
              <MaterialCommunityIcons
                name="shield-account"
                size={20}
                color={Colors.primary}
              />
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  reasonCard: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  reasonText: {
    fontSize: 15,
    color: Colors.light.text,
    textAlign: 'center',
    lineHeight: 22,
  },
  infoCard: {
    width: '100%',
    marginBottom: Spacing.md,
    borderColor: Colors.primary + '40',
    backgroundColor: Colors.primary + '08',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
  },
  prayerName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  urlContainer: {
    width: '100%',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  urlLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  urlText: {
    fontSize: 13,
    color: Colors.light.text,
    fontFamily: 'monospace',
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
});
