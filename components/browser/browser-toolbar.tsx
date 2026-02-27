/**
 * Browser Toolbar Component - MuslimGuard Kid-Friendly Browser
 * Circular navigation controls for children (no search bar)
 */

import { Colors, KidColors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
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
        <CopilotStep text={translations.onboardingTour.childParentAccess} order={3} name="child-parent-access">
          <CopilotView collapsable={false} style={styles.parentBtn}>
            <TouchableOpacity style={styles.parentBtnInner} onPress={onParentAccess}>
              <MaterialCommunityIcons
                name="shield-account-outline"
                size={24}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.parentBtnText}>{translations.childHome.parentMode}</Text>
            </TouchableOpacity>
          </CopilotView>
        </CopilotStep>
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCircleDisabled: {
    opacity: 0.4,
  },
  navCircleActive: {
    backgroundColor: '#FFFFFF',
  },
  navSpacer: {
    flex: 1,
  },
  parentBtn: {
    minWidth: 60,
  },
  parentBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});

export default BrowserToolbar;
