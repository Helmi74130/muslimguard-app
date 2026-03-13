/**
 * Browser Toolbar Component - MuslimGuard Kid-Friendly Browser
 * Circular navigation controls for children (no search bar)
 */

import { Colors, KidColors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { PrayerService, NextPrayerInfo } from '@/services/prayer.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CopilotStep, walkthroughable } from 'react-native-copilot';

const CopilotView = walkthroughable(View);

interface BrowserToolbarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onParentAccess: () => void;
  onHomePress: () => void;
  isOnHomePage: boolean;
}

export function BrowserToolbar({
  canGoBack,
  canGoForward,
  isLoading,
  onGoBack,
  onGoForward,
  onReload,
  onParentAccess,
  onHomePress,
  isOnHomePage,
}: BrowserToolbarProps) {
  const [currentTime, setCurrentTime] = useState('');
  const [nextPrayer, setNextPrayer] = useState<NextPrayerInfo | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${h}:${m}`);
    };

    const loadPrayer = async () => {
      const info = await PrayerService.getNextPrayer();
      setNextPrayer(info);
    };

    updateClock();
    loadPrayer();

    const interval = setInterval(() => {
      updateClock();
      loadPrayer();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>

        {/* Navigation buttons – cachés sur la page d'accueil */}
        {!isOnHomePage && (
          <View style={styles.navGroup}>
            <TouchableOpacity
              style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
              onPress={onGoBack}
              disabled={!canGoBack}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={24}
                color={canGoBack ? Colors.primary : KidColors.navDisabled}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
              onPress={onGoForward}
              disabled={!canGoForward}
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={canGoForward ? Colors.primary : KidColors.navDisabled}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={onHomePress}>
              <MaterialCommunityIcons name="home" size={22} color={Colors.primary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={onReload}>
              <MaterialCommunityIcons
                name={isLoading ? 'close' : 'refresh'}
                size={22}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Heure + prochaine prière (accueil seulement) */}
        {isOnHomePage && (
          <View style={styles.prayerInfo}>
            <Text style={styles.prayerTime}>{currentTime}</Text>
            {nextPrayer && (
              <Text style={styles.prayerNext}>
                {nextPrayer.nameFr} dans {nextPrayer.minutesRemaining >= 60
                  ? `${Math.floor(nextPrayer.minutesRemaining / 60)}h${(nextPrayer.minutesRemaining % 60).toString().padStart(2, '0')}`
                  : `${nextPrayer.minutesRemaining}min`}
              </Text>
            )}
          </View>
        )}

        {/* Spacer */}
        <View style={styles.navSpacer} />

        {/* Mode Parent – mis en avant */}
        <CopilotStep text={translations.onboardingTour.childParentAccess} order={3} name="child-parent-access">
          <CopilotView collapsable={false}>
            <TouchableOpacity onPress={onParentAccess} activeOpacity={0.85}>
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.parentBtn}
              >
                <MaterialCommunityIcons name="shield-account" size={20} color="#FFF" />
                <Text style={styles.parentBtnText}>{translations.childHome.parentMode}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </CopilotView>
        </CopilotStep>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.3,
  },
  navBtnActive: {
    backgroundColor: Colors.primary,
  },
  navSpacer: {
    flex: 1,
  },
  prayerInfo: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 1,
  },
  prayerTime: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: 0.5,
  },
  prayerNext: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  parentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    elevation: 4,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  parentBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
});

export default BrowserToolbar;
