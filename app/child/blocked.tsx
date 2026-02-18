/**
 * Blocked Screen - MuslimGuard Child Mode
 * Displayed when content is blocked
 */

import { Card } from '@/components/ui/card';
import { Colors, KidColors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { BlockReason } from '@/services/blocking.service';
import { PRAYER_NAMES_FR, PrayerService } from '@/services/prayer.service';
import { PrayerName } from '@/types/storage.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
    // Rediriger systématiquement vers l'accueil du navigateur enfant
    // pour éviter tout risque de boucle sur le site bloqué
    router.replace('/child/browser');
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

  // Playful title for children
  const kidTitle = reason === 'prayer' ? 'Pause Prière !' : 'Oups, pas ici !';
  const kidSubtitle = reason === 'prayer'
    ? 'C\'est le moment de parler à Allah ✨'
    : 'MuslimGuard te protège, essayons un autre site !';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: reason === 'prayer' ? '#EEF2FF' : '#FFF5F5' }]}>
      <View style={styles.decoration1} />
      <View style={styles.decoration2} />

      <View style={styles.content}>
        {/* Playful Icon Container */}
        <View style={[styles.iconOuterCircle, { borderColor: iconColor + '30' }]}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
            <MaterialCommunityIcons
              name={iconName as any}
              size={72}
              color={iconColor}
            />
          </View>
          {reason === 'prayer' && (
            <View style={styles.starBadge}>
              <MaterialCommunityIcons name="star" size={20} color={KidColors.starYellow} />
            </View>
          )}
        </View>

        {/* Title & Subtitle */}
        <Text style={styles.title}>{kidTitle}</Text>
        <Text style={styles.subtitle}>{kidSubtitle}</Text>

        {/* Reason Card (Glassmorphism style) */}
        <View style={styles.glassCard}>
          <Text style={styles.reasonText}>{getReasonMessage()}</Text>
        </View>

        {/* Additional info */}
        {getAdditionalInfo()}

        {/* URL - simplified for children */}
        {url && reason !== 'prayer' && reason !== 'schedule' && (
          <View style={styles.urlContainer}>
            <MaterialCommunityIcons name="link-variant-off" size={16} color={Colors.light.textSecondary} />
            <Text style={styles.urlText} numberOfLines={1}>
              {url.replace(/^https?:\/\//, '').split('/')[0]}
            </Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.kidButton, { backgroundColor: iconColor }]}
            onPress={handleGoBack}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-left-bold-circle" size={24} color="#FFF" />
            <Text style={styles.kidButtonText}>{t.goBack}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.parentLink}
            onPress={handleParentAccess}
          >
            <MaterialCommunityIcons name="shield-account" size={18} color={Colors.light.textSecondary} />
            <Text style={styles.parentLinkText}>{t.contactParent}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  decoration1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  decoration2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  iconOuterCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 17,
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.md,
    lineHeight: 24,
  },
  glassCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 24,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  reasonText: {
    fontSize: 16,
    color: '#2D3748',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    fontWeight: '600',
  },
  prayerName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 20,
    marginBottom: Spacing.xl,
  },
  urlLabel: {
    fontSize: 12,
    color: '#718096',
  },
  urlText: {
    fontSize: 13,
    color: '#718096',
    fontWeight: '500',
  },
  buttonContainer: {
    width: '100%',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  kidButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    height: 64,
    borderRadius: 32,
    width: '100%',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  kidButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  parentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  parentLinkText: {
    fontSize: 14,
    color: '#718096',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
