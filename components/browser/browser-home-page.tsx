/**
 * Browser Home Page - MuslimGuard Kid-Friendly Browser
 * Custom start page with search bar and quick links for children
 */

import AllahNamesIcon from '@/assets/icons/allah-names.svg';
import ArabicIcon from '@/assets/icons/arabic.svg';
import BreatheIcon from '@/assets/icons/breathe.svg';
import CalculatorIcon from '@/assets/icons/calculator.svg';
import CalligraphyIcon from '@/assets/icons/calligraphy.svg';
import CamleraIcon from '@/assets/icons/camera.svg';
import ChronoIcon from '@/assets/icons/chrono.svg';
import DrawingIcon from '@/assets/icons/drawing.svg';
import EmotionIcon from '@/assets/icons/emotion.svg';
import GalerieIcon from '@/assets/icons/galerie.svg';
import GaleryIcon from '@/assets/icons/galery.svg';
import MasjidIcon from '@/assets/icons/masjid.svg';
import MeteoIcon from '@/assets/icons/meteo.svg';
import MissionIcon from '@/assets/icons/mission.svg';
import NoteIcon from '@/assets/icons/note.svg';
import PodometreIcon from '@/assets/icons/podometre.svg';
import QuizIcon from '@/assets/icons/quiz.svg';
import QuranIcon from '@/assets/icons/quran.svg';
import SoundIcon from '@/assets/icons/sound.svg';
import WuduIcon from '@/assets/icons/wudu.svg';
import YoutubeIcon from '@/assets/icons/youtube.svg';
import {
  BACKGROUNDS,
  BackgroundOption,
  CUSTOM_PHOTO_BACKGROUND_ID,
  DEFAULT_BACKGROUND_ID,
  createCustomPhotoBackground,
  getBackgroundById,
  isBackgroundDark,
} from '@/constants/backgrounds';
import { BorderRadius, Colors, KidColors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { BlockingService } from '@/services/blocking.service';
import { StorageService } from '@/services/storage.service';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Image,
  ImageBackground,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  CopilotStep,
  useCopilot,
  walkthroughable,
} from 'react-native-copilot';

const t = translations.kidBrowser;
const tour = translations.onboardingTour;
const CopilotView = walkthroughable(View);

interface BrowserHomePageProps {
  onSearch: (url: string) => void;
  onQuickLink: (url: string) => void;
}

const QUICK_LINKS = [
  {
    label: t.links.videos,
    url: 'videos',
    icon: 'youtube' as const,
    colorIndex: 1,
    isInternal: true,
    customColor: '#FF0000',
    customIcon: YoutubeIcon,
  },
  {
    label: t.links.quiz,
    url: 'quiz',
    icon: 'head-question' as const,
    colorIndex: 5,
    isInternal: true,
    customIcon: QuizIcon,
  },
  {
    label: t.links.camera,
    url: 'camera',
    icon: 'camera' as const,
    colorIndex: 1,
    isInternal: true,
    customIcon: CamleraIcon,
  },
  {
    label: t.links.microMission,
    url: 'micro-mission',
    icon: 'target' as const,
    colorIndex: 1,
    isInternal: true,
    customIcon: MissionIcon,
  },
  {
    label: t.links.quran,
    url: 'quran',
    icon: 'book-open-variant' as const,
    colorIndex: 0,
    isInternal: true,
    customIcon: QuranIcon,
  },
  {
    label: t.links.allahNames,
    url: 'allah-names',
    icon: 'star-crescent' as const,
    colorIndex: 1,
    isInternal: true,
    customIcon: AllahNamesIcon,
  },
  {
    label: t.links.emotions,
    url: 'emotions',
    icon: 'emoticon-happy-outline' as const,
    colorIndex: 5,
    isInternal: true,
    customIcon: EmotionIcon,
  },
  {
    label: t.links.drawing,
    url: 'drawing',
    icon: 'draw' as const,
    colorIndex: 2,
    isInternal: true,
    customIcon: DrawingIcon,
  },
  {
    label: t.links.soundMixer,
    url: 'sound-mixer',
    icon: 'music-box-multiple' as const,
    colorIndex: 3,
    isInternal: true,
    customIcon: SoundIcon,
  },
  {
    label: t.links.breathing,
    url: 'breathing',
    icon: 'leaf' as const,
    colorIndex: 2,
    isInternal: true,
    customIcon: BreatheIcon,
  },
  {
    label: t.links.arabicTracing,
    url: 'arabic-tracing',
    icon: 'abjad-arabic' as const,
    colorIndex: 3,
    isInternal: true,
    customIcon: ArabicIcon,
  },
  {
    label: t.links.calculator,
    url: 'calculator',
    icon: 'calculator-variant' as const,
    colorIndex: 5,
    isInternal: true,
    customIcon: CalculatorIcon,
  },
  {
    label: t.links.calligraphy,
    url: 'calligraphy',
    icon: 'fountain-pen-tip' as const,
    colorIndex: 0,
    isInternal: true,
    customIcon: CalligraphyIcon,
  },
  {
    label: t.links.gallery,
    url: 'gallery',
    icon: 'image-multiple' as const,
    colorIndex: 2,
    isInternal: true,
    customIcon: GaleryIcon,
  },
  {
    label: t.links.notes,
    url: 'notes',
    icon: 'notebook-edit' as const,
    colorIndex: 4,
    isInternal: true,
    customIcon: NoteIcon,
  },
  {
    label: t.links.pedometer,
    url: 'pedometer',
    icon: 'shoe-sneaker' as const,
    colorIndex: 3,
    isInternal: true,
    customIcon: PodometreIcon,
  },
  {
    label: t.links.stopwatch,
    url: 'stopwatch',
    icon: 'timer-outline' as const,
    colorIndex: 4,
    isInternal: true,
    customIcon: ChronoIcon,
  },
  {
    label: t.links.ablutions,
    url: 'ablutions',
    icon: 'hand-wash' as const,
    colorIndex: 0,
    isInternal: true,
    customIcon: WuduIcon,
  },
    {
    label: t.links.prayerTimes,
    url: 'prayer-times',
    icon: 'mosque' as const,
    colorIndex: 2,
    isInternal: true,
    customIcon: MasjidIcon,
  },
  {
    label: t.links.background,
    url: 'background-picker',
    icon: 'palette' as const,
    colorIndex: 4,
    isInternal: true,
    customIcon: GalerieIcon,
  },
  {
    label: t.links.weather,
    url: 'weather',
    icon: 'weather-partly-cloudy' as const,
    colorIndex: 0,
    isInternal: true,
    customIcon: MeteoIcon,
  },
];

const MAX_VISIBLE_SITES = 6;

export function BrowserHomePage({ onSearch, onQuickLink }: BrowserHomePageProps) {
  const { copilotEvents } = useCopilot();
  const scrollViewRef = useRef<ScrollView>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [whitelistDomains, setWhitelistDomains] = useState<string[]>([]);
  const [showAllSites, setShowAllSites] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [selectedBgId, setSelectedBgId] = useState<string>(DEFAULT_BACKGROUND_ID);
  const [browserEnabled, setBrowserEnabled] = useState(true);
  const [customPhotoUri, setCustomPhotoUri] = useState<string | null>(null);
  const [galleryPhotos, setGalleryPhotos] = useState<MediaLibrary.Asset[]>([]);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);


  // Load strict mode status, whitelist, browser setting, and premium status
  useEffect(() => {
    const loadData = async () => {
      try {
        const [strictMode, whitelist, bgId, settings, customUri, subscriptionState, devPremium] = await Promise.all([
          BlockingService.isStrictModeEnabled(),
          BlockingService.getWhitelistDomains(),
          StorageService.getChildBackground(),
          StorageService.getSettings(),
          StorageService.getChildBackgroundUri(),
          StorageService.getSubscriptionState(),
          StorageService.getDevPremium(),
        ]);
        const premium = subscriptionState.isPremium || devPremium;
        setIsPremium(premium);
        setStrictModeEnabled(strictMode);
        setWhitelistDomains(whitelist);
        setSelectedBgId(bgId);
        // Browser control only applies if premium
        setBrowserEnabled(premium ? settings.browserEnabled : true);
        setCustomPhotoUri(customUri);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, []);

  // Scroll to step on change
  useEffect(() => {
    const onStep = (step?: { name: string }) => {
      if (!step) return;
      if (step.name === 'child-apps') {
        scrollViewRef.current?.scrollTo({ y: 300, animated: true });
      } else {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }
    };
    copilotEvents.on('stepChange', onStep);
    return () => {
      copilotEvents.off('stepChange', onStep);
    };
  }, [copilotEvents]);

  const loadGalleryPhotos = async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: 12,
      });
      setGalleryPhotos(result.assets);
    } catch (error) {
      console.error('Error loading gallery photos:', error);
    }
  };

  const selectedBg = selectedBgId === CUSTOM_PHOTO_BACKGROUND_ID && customPhotoUri
    ? createCustomPhotoBackground(customPhotoUri)
    : getBackgroundById(selectedBgId);
  const dark = isBackgroundDark(selectedBg);

  const selectBackground = async (bg: BackgroundOption) => {
    setSelectedBgId(bg.id);
    setShowBgPicker(false);
    setShowGalleryPicker(false);
    await StorageService.setChildBackground(bg.id);
  };

  const selectCustomPhoto = async (asset: MediaLibrary.Asset) => {
    setCustomPhotoUri(asset.uri);
    setSelectedBgId(CUSTOM_PHOTO_BACKGROUND_ID);
    setShowGalleryPicker(false);
    setShowBgPicker(false);
    await StorageService.setChildBackground(CUSTOM_PHOTO_BACKGROUND_ID);
    await StorageService.setChildBackgroundUri(asset.uri);
  };

  const handleSearch = () => {
    Keyboard.dismiss();
    if (!searchQuery.trim()) return;
    const encoded = encodeURIComponent(searchQuery.trim());
    const safeUrl = `https://www.google.com/search?q=${encoded}&safe=active`;
    onSearch(safeUrl);
  };

  // Strict mode only effective if user is premium
  const effectiveStrictMode = strictModeEnabled && isPremium;

  const renderScrollContent = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Greeting (hidden in strict mode) */}
      {!effectiveStrictMode && (
        <View style={styles.greetingContainer}>
          <Text style={[styles.greeting, dark && styles.textLight]}>{t.greeting}</Text>
          <Text style={[styles.homeTitle, dark && styles.textLight]}>{t.homeTitle}</Text>
          <Text style={[styles.homeSubtitle, dark && styles.textLightSecondary]}>{t.homeSubtitle}</Text>
        </View>
      )}

      {/* Search Bar (hidden when browser disabled or strict mode) */}
      {browserEnabled && !effectiveStrictMode && (
        <CopilotStep text={tour.childSearch} order={1} name="child-search" active={browserEnabled && !effectiveStrictMode}>
          <CopilotView collapsable={false} style={styles.searchContainer}>
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
                autoComplete="off"
                textContentType="none"
                spellCheck={false}
                importantForAutofill="no"
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

            {/* Safe search badge */}
            <View style={styles.badgesRow}>
              <View style={styles.safeBadge}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={14}
                  color={KidColors.safeGreen}
                />
                <Text style={styles.safeBadgeText}>{t.safeSearch}</Text>
              </View>
            </View>
          </CopilotView>
        </CopilotStep>
      )}

      {/* Strict Mode Banner + Allowed Sites */}
      {effectiveStrictMode && (
        <View style={styles.strictModeSection}>
          <View style={styles.strictModeBanner}>
            <MaterialCommunityIcons
              name="shield-lock"
              size={28}
              color={Colors.success}
            />
            <Text style={styles.strictModeTitle}>Mode strict activé</Text>
            <Text style={styles.strictModeDesc}>
              Seuls les sites autorisés sont accessibles
            </Text>
          </View>

          {whitelistDomains.length > 0 && (
            <>
              <View style={styles.allowedSitesHeader}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={Colors.success}
                />
                <Text style={styles.allowedSitesTitle}>{t.allowedSites}</Text>
              </View>
              <View style={styles.allowedSitesGrid}>
                {(showAllSites ? whitelistDomains : whitelistDomains.slice(0, MAX_VISIBLE_SITES)).map((domain) => (
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
                {whitelistDomains.length > MAX_VISIBLE_SITES && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.allowedTile,
                      styles.showMoreTile,
                      pressed && styles.tilePressed,
                    ]}
                    onPress={() => setShowAllSites(!showAllSites)}
                  >
                    <MaterialCommunityIcons
                      name={showAllSites ? 'chevron-up' : 'dots-horizontal'}
                      size={20}
                      color={Colors.primary}
                    />
                    <Text style={styles.showMoreLabel}>
                      {showAllSites ? 'Réduire' : `+${whitelistDomains.length - MAX_VISIBLE_SITES} sites`}
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      )}

      {/* Applications */}
      <CopilotStep text={tour.childApps} order={2} name="child-apps">
        <CopilotView collapsable={false} style={styles.quickLinksSection}>
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
                  {
                    backgroundColor: link.customColor ? '#ffefefff' : KidColors.tiles[link.colorIndex],
                    borderWidth: link.customColor ? 1 : 0,
                    borderColor: 'rgba(0,0,0,0.05)'
                  },
                ]}>
                  {link.customIcon ? (
                    <link.customIcon
                      width={32}
                      height={32}
                      fill={link.customColor || KidColors.tileIcons[link.colorIndex]}
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={link.icon}
                      size={32}
                      color={link.customColor || KidColors.tileIcons[link.colorIndex]}
                    />
                  )}
                </View>
                <Text style={[styles.appLabel, dark && styles.textLight]} numberOfLines={1}>
                  {link.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </CopilotView>
      </CopilotStep>

      {/* Background Picker Modal */}
      <Modal
        visible={showBgPicker}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowBgPicker(false); setShowGalleryPicker(false); }}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => { setShowBgPicker(false); setShowGalleryPicker(false); }}
        >
          <Pressable style={styles.modalContent} onPress={() => { }}>
            {showGalleryPicker ? (
              <>
                <View style={styles.galleryPickerHeader}>
                  <Pressable onPress={() => setShowGalleryPicker(false)}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
                  </Pressable>
                  <Text style={styles.modalTitle}>Choisir une photo</Text>
                  <View style={{ width: 24 }} />
                </View>
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.galleryGrid}>
                    {galleryPhotos.map((asset) => {
                      const isSelected = selectedBgId === CUSTOM_PHOTO_BACKGROUND_ID && customPhotoUri === asset.uri;
                      return (
                        <Pressable
                          key={asset.id}
                          style={styles.galleryPhotoOption}
                          onPress={() => selectCustomPhoto(asset)}
                        >
                          <Image source={{ uri: asset.uri }} style={styles.galleryPhotoImage} />
                          {isSelected && (
                            <View style={styles.bgCheck}>
                              <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  {galleryPhotos.length === 0 && (
                    <Text style={styles.galleryEmptyText}>Aucune photo disponible</Text>
                  )}
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.modalTitle}>{translations.childHome.selectBackground}</Text>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Visual "Use a photo" Card */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.photoActionCard,
                      pressed && styles.tilePressed
                    ]}
                    onPress={() => { loadGalleryPhotos(); setShowGalleryPicker(true); }}
                  >
                    <View style={styles.photoActionIconContainer}>
                      <MaterialCommunityIcons name="camera-plus" size={32} color={Colors.primary} />
                    </View>
                    <View style={styles.photoActionContent}>
                      <Text style={styles.photoActionTitle}>Utiliser ma propre photo</Text>
                      <Text style={styles.photoActionSubtitle}>Choisis une photo de ta galerie</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.primary} />
                  </Pressable>

                  <View style={styles.divider}>
                    <Text style={styles.dividerText}>Ou choisis un modèle</Text>
                  </View>

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
                </ScrollView>
              </>
            )}
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
    justifyContent: 'center',
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
    width: 68,
    height: 68,
    borderRadius: 18,
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

  // Strict Mode Section
  strictModeSection: {
    marginBottom: Spacing.lg,
  },
  strictModeBanner: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  strictModeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.success,
    marginTop: Spacing.sm,
  },
  strictModeDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },

  // Allowed Sites (Strict Mode)
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
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  allowedTileLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.text,
    maxWidth: 120,
  },
  showMoreTile: {
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  showMoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
  modalScrollContent: {
    paddingBottom: Spacing.xl,
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

  // Enhanced Photo Action Card
  photoActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.primary + '20',
    borderStyle: 'dashed',
  },
  photoActionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  photoActionContent: {
    flex: 1,
    marginLeft: 16,
  },
  photoActionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 2,
  },
  photoActionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  galleryPickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: Spacing.lg,
  },
  galleryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: Spacing.sm,
  },
  galleryPhotoOption: {
    width: 90,
    height: 90,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  galleryPhotoImage: {
    width: '100%' as any,
    height: '100%' as any,
  },
  galleryEmptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
    paddingVertical: Spacing.xl,
  },
});

export default BrowserHomePage;
