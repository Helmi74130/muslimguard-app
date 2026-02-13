/**
 * Browser Toolbar Component - MuslimGuard Kid-Friendly Browser
 * Circular navigation controls for children (no search bar)
 */

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, KidColors } from '@/constants/theme';

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
  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navCircle, !canGoBack && styles.navCircleDisabled]}
          onPress={onGoBack}
          disabled={!canGoBack}
        >
          <MaterialCommunityIcons
            name="chevron-left-circle"
            size={36}
            color={canGoBack ? Colors.primary : KidColors.navDisabled}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCircle, !canGoForward && styles.navCircleDisabled]}
          onPress={onGoForward}
          disabled={!canGoForward}
        >
          <MaterialCommunityIcons
            name="chevron-right-circle"
            size={36}
            color={canGoForward ? Colors.primary : KidColors.navDisabled}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCircle, isOnHomePage && styles.navCircleActive]}
          onPress={onHomePress}
        >
          <MaterialCommunityIcons
            name="home-circle"
            size={36}
            color={Colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCircle} onPress={onReload}>
          <MaterialCommunityIcons
            name={isLoading ? 'close-circle' : 'refresh-circle'}
            size={36}
            color={Colors.primary}
          />
        </TouchableOpacity>

        {/* Spacer to push parent button to far right */}
        <View style={styles.navSpacer} />

        {/* Subtle parent access */}
        <TouchableOpacity style={styles.parentBtn} onPress={onParentAccess}>
          <MaterialCommunityIcons
            name="shield-account-outline"
            size={22}
            color={Colors.light.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: KidColors.toolbarBg,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },

  // Navigation row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  navCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: KidColors.navBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCircleDisabled: {
    opacity: 0.4,
  },
  navCircleActive: {
    backgroundColor: KidColors.homeButtonBg,
  },
  navSpacer: {
    flex: 1,
  },
  parentBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BrowserToolbar;
