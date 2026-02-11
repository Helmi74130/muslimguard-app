/**
 * Browser Toolbar Component - MuslimGuard Kid-Friendly Browser
 * Colorful search bar and circular navigation controls for children
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, KidColors } from '@/constants/theme';
import { translations } from '@/constants/translations';

interface BrowserToolbarProps {
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onReload: () => void;
  onNavigate: (url: string) => void;
  onParentAccess: () => void;
  onHomePress: () => void;
  isOnHomePage: boolean;
}

export function BrowserToolbar({
  currentUrl,
  canGoBack,
  canGoForward,
  isLoading,
  onGoBack,
  onGoForward,
  onReload,
  onNavigate,
  onParentAccess,
  onHomePress,
  isOnHomePage,
}: BrowserToolbarProps) {
  const [urlInput, setUrlInput] = useState(currentUrl);
  const [isFocused, setIsFocused] = useState(false);

  // Extract display URL (without protocol)
  const displayUrl = currentUrl
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');

  const handleSubmit = () => {
    Keyboard.dismiss();
    if (urlInput.trim()) {
      onNavigate(urlInput.trim());
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setUrlInput(currentUrl);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setUrlInput(displayUrl);
  };

  return (
    <View style={styles.container}>
      {/* Search / URL Bar Row */}
      <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={KidColors.safeGreen}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          value={isFocused ? urlInput : (isOnHomePage ? '' : displayUrl)}
          onChangeText={setUrlInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={handleSubmit}
          placeholder={translations.kidBrowser.searchPlaceholder}
          placeholderTextColor={KidColors.searchPlaceholder}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          returnKeyType="search"
          selectTextOnFocus
        />
        {isFocused && urlInput ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => setUrlInput('')}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={20}
              color={KidColors.navDisabled}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Navigation Row */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navCircle, !canGoBack && styles.navCircleDisabled]}
          onPress={onGoBack}
          disabled={!canGoBack}
        >
          <MaterialCommunityIcons
            name="chevron-left-circle"
            size={28}
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
            size={28}
            color={canGoForward ? Colors.primary : KidColors.navDisabled}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navCircle, isOnHomePage && styles.navCircleActive]}
          onPress={onHomePress}
        >
          <MaterialCommunityIcons
            name="home-circle"
            size={28}
            color={Colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.navCircle} onPress={onReload}>
          <MaterialCommunityIcons
            name={isLoading ? 'close-circle' : 'refresh-circle'}
            size={28}
            color={Colors.primary}
          />
        </TouchableOpacity>

        {/* Spacer to push parent button to far right */}
        <View style={styles.navSpacer} />

        {/* Subtle parent access */}
        <TouchableOpacity style={styles.parentBtn} onPress={onParentAccess}>
          <MaterialCommunityIcons
            name="shield-account-outline"
            size={20}
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
    gap: Spacing.sm,
  },

  // Search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KidColors.searchBg,
    borderRadius: 24,
    height: 48,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: KidColors.searchBorder,
  },
  searchBarFocused: {
    borderColor: KidColors.searchFocusBorder,
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: Spacing.xs,
  },

  // Navigation row
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  navCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BrowserToolbar;
