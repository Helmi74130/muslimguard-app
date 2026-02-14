/**
 * Browser Home Page - MuslimGuard Kid-Friendly Browser
 * Custom start page with search bar and quick links for children
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Keyboard,
  Modal,
  ImageBackground,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, KidColors } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { BlockingService } from '@/services/blocking.service';
import { StorageService } from '@/services/storage.service';
import {
  BACKGROUNDS,
  BackgroundOption,
  getBackgroundById,
  isBackgroundDark,
  DEFAULT_BACKGROUND_ID,
} from '@/constants/backgrounds';

const t = translations.kidBrowser;

interface BrowserHomePageProps {
  onSearch: (url: string) => void;
  onQuickLink: (url: string) => void;
}

const QUICK_LINKS = [
  {
    label: t.links.quran,
    url: 'quran', // Special internal route
    icon: 'book-open-variant' as const,
    colorIndex: 0,
    isInternal: true,
  },
  {
    label: t.links.allahNames,
    url: 'allah-names',
    icon: 'star-crescent' as const,
    colorIndex: 1,
    isInternal: true,
  },
  {
    label: t.links.drawing,
    url: 'drawing',
    icon: 'draw' as const,
    colorIndex: 2,
    isInternal: true,
  },
  {
    label: t.links.arabicTracing,
    url: 'arabic-tracing',
    icon: 'abjad-arabic' as const,
    colorIndex: 3,
    isInternal: true,
  },
  {
    label: t.links.background,
    url: 'background-picker', // Special internal action
    icon: 'palette' as const,
    colorIndex: 4,
    isInternal: true,
  },
  {
    label: t.links.calculator,
    url: 'calculator',
    icon: 'calculator-variant' as const,
    colorIndex: 5,
    isInternal: true,
  },
  {
    label: t.links.calligraphy,
    url: 'calligraphy',
    icon: 'fountain-pen-tip' as const,
    colorIndex: 0,
    isInternal: true,
  },
  {
    label: t.links.camera,
    url: 'camera',
    icon: 'camera' as const,
    colorIndex: 1,
    isInternal: true,
  },
  {
    label: t.links.prayerTimes,
    url: 'prayer-times',
    icon: 'mosque' as const,
    colorIndex: 2,
    isInternal: true,
  },
  {
    label: t.links.soundMixer,
    url: 'sound-mixer',
    icon: 'music-box-multiple' as const,
    colorIndex: 3,
    isInternal: true,
  },
  {
    label: t.links.notes,
    url: 'notes',
    icon: 'notebook-edit' as const,
    colorIndex: 4,
    isInternal: true,
  },
  {
    label: t.links.quiz,
    url: 'quiz',
    icon: 'head-question' as const,
    colorIndex: 5,
    isInternal: true,
  },
  {
    label: t.links.weather,
    url: 'weather',
    icon: 'weather-partly-cloudy' as const,
    colorIndex: 0,
    isInternal: true,
  },
  {
    label: t.links.videos,
    url: 'videos',
    icon: 'play-box-multiple' as const,
    colorIndex: 1,
    isInternal: true,
  },
];

export function BrowserHomePage({ onSearch, onQuickLink }: BrowserHomePageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);
  const [whitelistDomains, setWhitelistDomains] = useState<string[]>([]);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [selectedBgId, setSelectedBgId] = useState<string>(DEFAULT_BACKGROUND_ID);
  const [browserEnabled, setBrowserEnabled] = useState(true);

  // Load strict mode status, whitelist, and browser setting
  useEffect(() => {
    const loadData = async () => {
      try {
        const [strictMode, whitelist, bgId, settings] = await Promise.all([
          BlockingService.isStrictModeEnabled(),
          BlockingService.getWhitelistDomains(),
          StorageService.getChildBackground(),
          StorageService.getSettings(),
        ]);
        setStrictModeEnabled(strictMode);
        setWhitelistDomains(whitelist);
        setSelectedBgId(bgId);
        setBrowserEnabled(settings.browserEnabled);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  const selectedBg = getBackgroundById(selectedBgId);
  const dark = isBackgroundDark(selectedBg);

  const selectBackground = async (bg: BackgroundOption) => {
    setSelectedBgId(bg.id);
    setShowBgPicker(false);
    await StorageService.setChildBackground(bg.id);
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    if (!searchQuery.trim()) return;
    const encoded = encodeURIComponent(searchQuery.trim());
    const safeUrl = `https://www.google.com/search?q=${encoded}&safe=active`;
    onSearch(safeUrl);
  };

  const renderScrollContent = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Greeting */}
      <View style={styles.greetingContainer}>
        <Text style={[styles.greeting, dark && styles.textLight]}>{t.greeting}</Text>
        <Text style={[styles.homeTitle, dark && styles.textLight]}>{t.homeTitle}</Text>
        <Text style={[styles.homeSubtitle, dark && styles.textLightSecondary]}>{t.homeSubtitle}</Text>
      </View>

      {/* Search Bar (hidden when browser disabled) */}
      {browserEnabled && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons
              name="magnify"
              size={24}
              color={KidColors.safeGreen}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={KidColors.searchPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={handleSearch} style={styles.searchButton}>
                <MaterialCommunityIcons
                  name="arrow-right-circle"
                  size={32}
                  color={Colors.primary}
                />
              </Pressable>
            )}
          </View>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            {/* Safe search badge */}
            <View style={styles.safeBadge}>
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={KidColors.safeGreen}
              />
              <Text style={styles.safeBadgeText}>{t.safeSearch}</Text>
            </View>

            {/* Strict mode badge */}
            {strictModeEnabled && (
              <View style={styles.strictBadge}>
                <MaterialCommunityIcons
                  name="shield-lock"
                  size={14}
                  color={Colors.primary}
                />
                <Text style={styles.strictBadgeText}>{t.strictMode}</Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Allowed Sites (Strict Mode) */}
      {browserEnabled && strictModeEnabled && whitelistDomains.length > 0 && (
        <View style={styles.allowedSitesSection}>
          <View style={styles.allowedSitesHeader}>
            <MaterialCommunityIcons
              name="shield-check"
              size={18}
              color={Colors.success}
            />
            <Text style={styles.allowedSitesTitle}>{t.allowedSites}</Text>
          </View>
          <View style={styles.allowedSitesGrid}>
            {whitelistDomains.map((domain) => (
              <Pressable
                key={domain}
                style={({ pressed }) => [
                  styles.allowedTile,
                  pressed && styles.tilePressed,
                ]}
                onPress={() => onQuickLink(`https://${domain}`)}
              >
                <MaterialCommunityIcons
                  name="web"
                  size={20}
                  color={Colors.success}
                />
                <Text style={styles.allowedTileLabel} numberOfLines={1}>
                  {domain}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* Applications */}
      <View style={styles.quickLinksSection}>
        <Text style={[styles.quickLinksTitle, dark && styles.textLight]}>{t.quickLinks}</Text>
        <View style={styles.quickLinksGrid}>
          {QUICK_LINKS.map((link) => (
            <Pressable
              key={link.url}
              style={({ pressed }) => [
                styles.appItem,
                pressed && styles.tilePressed,
              ]}
              onPress={() => {
                if (link.url === 'background-picker') {
                  setShowBgPicker(true);
                } else if (link.isInternal) {
                  router.push(`/child/${link.url}` as any);
                } else {
                  onQuickLink(link.url);
                }
              }}
            >
              <View style={[
                styles.appIcon,
                { backgroundColor: KidColors.tiles[link.colorIndex] },
              ]}>
                <MaterialCommunityIcons
                  name={link.icon}
                  size={28}
                  color={KidColors.tileIcons[link.colorIndex]}
                />
              </View>
              <Text style={[styles.appLabel, dark && styles.textLight]} numberOfLines={1}>
                {link.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Background Picker Modal */}
      <Modal
        visible={showBgPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBgPicker(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowBgPicker(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>{translations.childHome.selectBackground}</Text>
            <View style={styles.bgGrid}>
              {BACKGROUNDS.map((bg) => {
                const isSelected = bg.id === selectedBgId;
                return (
                  <Pressable
                    key={bg.id}
                    style={styles.bgOption}
                    onPress={() => selectBackground(bg)}
                  >
                    <View
                      style={[
                        styles.bgPreview,
                        { backgroundColor: bg.preview },
                        isSelected && styles.bgPreviewSelected,
                      ]}
                    >
                      {bg.type === 'image' && bg.source && (
                        <Image
                          source={bg.source}
                          style={styles.bgPreviewImage}
                        />
                      )}
                      {isSelected && (
                        <View style={styles.bgCheck}>
                          <MaterialCommunityIcons
                            name="check"
                            size={16}
                            color="#FFFFFF"
                          />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.bgLabel,
                        isSelected && styles.bgLabelSelected,
                      ]}
                      numberOfLines={1}
                    >
                      {bg.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );

  // Wrap content with selected background
  if (selectedBg.type === 'image' && selectedBg.source) {
    return (
      <ImageBackground
        source={selectedBg.source}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={dark ? styles.darkOverlay : styles.container}>
          {renderScrollContent()}
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: selectedBg.color || KidColors.homeBg }]}>
      {renderScrollContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KidColors.homeBg,
  },
  darkOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },

  // Dark background text styles
  textLight: {
    color: '#FFFFFF',
  },
  textLightSecondary: {
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Greeting
  greetingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  homeSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },

  // Search
  searchContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    height: 56,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: KidColors.searchBorder,
    width: '100%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.text,
    paddingVertical: 0,
  },
  searchButton: {
    padding: Spacing.xs,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  safeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: KidColors.safeGreen + '15',
    borderRadius: BorderRadius.full,
  },
  safeBadgeText: {
    fontSize: 12,
    color: KidColors.safeGreen,
    fontWeight: '600',
  },
  strictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary + '15',
    borderRadius: BorderRadius.full,
  },
  strictBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Quick Links
  quickLinksSection: {
    marginTop: Spacing.sm,
  },
  quickLinksTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: Spacing.md,
  },
  appItem: {
    width: '28%',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  tilePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.92 }],
  },
  appIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
  },
  appLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginTop: 6,
  },

  // Allowed Sites (Strict Mode)
  allowedSitesSection: {
    marginBottom: Spacing.lg,
  },
  allowedSitesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  allowedSitesTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.success,
  },
  allowedSitesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  allowedTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  allowedTileLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    maxWidth: 120,
  },

  // Background Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end' as const,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '60%' as any,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.light.text,
    textAlign: 'center' as const,
    marginBottom: Spacing.lg,
  },
  bgGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.md,
    justifyContent: 'center' as const,
  },
  bgOption: {
    alignItems: 'center' as const,
    width: 72,
  },
  bgPreview: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  bgPreviewImage: {
    width: '100%' as any,
    height: '100%' as any,
    borderRadius: 14,
    resizeMode: 'cover' as const,
  },
  bgPreviewSelected: {
    borderColor: Colors.primary,
  },
  bgCheck: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bgLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  bgLabelSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
});

export default BrowserHomePage;
