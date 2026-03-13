/**
 * Browser Home Page - MuslimGuard Kid-Friendly Browser
 * Custom start page with search bar and quick links for children
 */

import { ArabicLearningModal } from '@/components/arabic-learning/ArabicLearningModal';
import { GamesModal } from '@/components/games/GamesModal';
import AllahNamesIcon from '@/assets/icons/allah-names.svg';
import ArabicIcon from '@/assets/icons/arabic.svg';
import BreatheIcon from '@/assets/icons/breathe.svg';
import CalculatorIcon from '@/assets/icons/calculator.svg';
import CalligraphyIcon from '@/assets/icons/calligraphy.svg';
import CamleraIcon from '@/assets/icons/camera.svg';
import ChronoIcon from '@/assets/icons/chrono.svg';
import DrawingIcon from '@/assets/icons/drawing.svg';
import ArabIcon from '@/assets/icons/iconarabe.svg';
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
import StoriesIcon from '@/assets/icons/stories.svg';
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
import { RewardsService, REWARD_EVENT, COINS_CHANGED_EVENT } from '@/services/rewards.service';
import { ShopService } from '@/services/shop.service';
import { ShopPurchaseModal } from '@/components/ShopPurchaseModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  DeviceEventEmitter,
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

const CATEGORIES = [
  {
    title: 'Religion',
    links: [
      { label: t.links.quiz, url: 'quiz', icon: 'head-question' as const, isInternal: true, customIcon: QuizIcon, gradient: ['#7C3AED', '#6D28D9'] as const },
      { label: t.links.quran, url: 'quran', icon: 'book-open-variant' as const, isInternal: true, customIcon: QuranIcon, gradient: ['#059669', '#047857'] as const },
      { label: t.links.allahNames, url: 'allah-names', icon: 'star-crescent' as const, isInternal: true, customIcon: AllahNamesIcon, gradient: ['#D97706', '#B45309'] as const },
      { label: t.links.ablutions, url: 'ablutions', icon: 'hand-wash' as const, isInternal: true, customIcon: WuduIcon, gradient: ['#0891B2', '#0E7490'] as const },
      { label: t.links.stories, url: 'stories', icon: 'book-open-variant' as const, isInternal: true, customIcon: StoriesIcon, gradient: ['#EA580C', '#C2410C'] as const },
      { label: t.links.prayerTimes, url: 'prayer-times', icon: 'mosque' as const, isInternal: true, customIcon: MasjidIcon, gradient: ['#4338CA', '#3730A3'] as const },
    ],
  },
  {
    title: 'Apprentissage',
    links: [
      { label: t.links.arabicLearning, url: 'arabic-learning', icon: 'abjad-arabic' as const, isInternal: false, customIcon: ArabIcon, gradient: ['#E11D48', '#9F1239'] as const },
      { label: t.links.arabicTracing, url: 'arabic-tracing', icon: 'abjad-arabic' as const, isInternal: true, customIcon: ArabicIcon, gradient: ['#D97706', '#92400E'] as const },
      { label: t.links.calligraphy, url: 'calligraphy', icon: 'fountain-pen-tip' as const, isInternal: true, customIcon: CalligraphyIcon, gradient: ['#9333EA', '#7E22CE'] as const },
      { label: t.links.calculator, url: 'calculator', icon: 'calculator-variant' as const, isInternal: true, customIcon: CalculatorIcon, gradient: ['#475569', '#1E293B'] as const },
    ],
  },
  {
    title: 'Jeux & Activités',
    links: [
      { label: t.links.games, url: 'games', icon: 'gamepad-variant-outline' as const, isInternal: false, customIcon: undefined, gradient: ['#16A34A', '#15803D'] as const },
      { label: t.links.microMission, url: 'micro-mission', icon: 'target' as const, isInternal: true, customIcon: MissionIcon, gradient: ['#F97316', '#C2410C'] as const },
      { label: t.links.drawing, url: 'drawing', icon: 'draw' as const, isInternal: true, customIcon: DrawingIcon, gradient: ['#DB2777', '#9D174D'] as const },
      { label: 'Boutique', url: 'shop', icon: 'store' as const, isInternal: true, customIcon: undefined, gradient: ['#F59E0B', '#D97706'] as const },
    ],
  },
  {
    title: 'Bien-être',
    links: [
      { label: t.links.emotions, url: 'emotions', icon: 'emoticon-happy-outline' as const, isInternal: true, customIcon: EmotionIcon, gradient: ['#CA8A04', '#92400E'] as const },
      { label: t.links.breathing, url: 'breathing', icon: 'leaf' as const, isInternal: true, customIcon: BreatheIcon, gradient: ['#0D9488', '#0F766E'] as const },
      { label: t.links.soundMixer, url: 'sound-mixer', icon: 'music-box-multiple' as const, isInternal: true, customIcon: SoundIcon, gradient: ['#8B5CF6', '#6D28D9'] as const },
    ],
  },
  {
    title: 'Outils',
    links: [
      { label: t.links.camera, url: 'camera', icon: 'camera' as const, isInternal: true, customIcon: CamleraIcon, gradient: ['#7C3AED', '#4F46E5'] as const },
      { label: t.links.gallery, url: 'gallery', icon: 'image-multiple' as const, isInternal: true, customIcon: GaleryIcon, gradient: ['#EC4899', '#BE185D'] as const },
      { label: t.links.notes, url: 'notes', icon: 'notebook-edit' as const, isInternal: true, customIcon: NoteIcon, gradient: ['#2563EB', '#1D4ED8'] as const },
      { label: t.links.stopwatch, url: 'stopwatch', icon: 'timer-outline' as const, isInternal: true, customIcon: ChronoIcon, gradient: ['#DC2626', '#991B1B'] as const },
      { label: t.links.pedometer, url: 'pedometer', icon: 'shoe-sneaker' as const, isInternal: true, customIcon: PodometreIcon, gradient: ['#16A34A', '#166534'] as const },
      { label: t.links.weather, url: 'weather', icon: 'weather-partly-cloudy' as const, isInternal: true, customIcon: MeteoIcon, gradient: ['#0284C7', '#075985'] as const },
      { label: t.links.background, url: 'background-picker', icon: 'palette' as const, isInternal: true, customIcon: GalerieIcon, gradient: ['#A855F7', '#7C3AED'] as const },
    ],
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
  const [galleryEndCursor, setGalleryEndCursor] = useState<string | undefined>();
  const [galleryHasMore, setGalleryHasMore] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);
  const [showArabicLearning, setShowArabicLearning] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [rewardCoins, setRewardCoins] = useState(0);
  const [rewardXP, setRewardXP] = useState(0);
  const [bgUnlockedMap, setBgUnlockedMap] = useState<any>({});
  const [bgPurchaseTarget, setBgPurchaseTarget] = useState<{
    itemId: string; itemName: string; price: number; previewImage?: any; previewColor?: string;
  } | null>(null);

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

    const loadRewards = async () => {
      const [coins, xp] = await Promise.all([
        RewardsService.getCoins(),
        RewardsService.getXP(),
      ]);
      setRewardCoins(coins);
      setRewardXP(xp);
    };

    loadData();
    loadRewards();
    ShopService.preloadUnlocked().then(setBgUnlockedMap);

    const sub = DeviceEventEmitter.addListener(REWARD_EVENT, ({ coins, xp }: { coins: number; xp: number }) => {
      setRewardCoins(prev => prev + coins);
      setRewardXP(prev => prev + xp);
    });
    const subSpend = DeviceEventEmitter.addListener(COINS_CHANGED_EVENT, ({ coins }: { coins: number }) => {
      setRewardCoins(coins);
    });
    return () => { sub.remove(); subSpend.remove(); };
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

  const loadGalleryPhotos = async (cursor?: string) => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') return;
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [[MediaLibrary.SortBy.modificationTime, false]],
        first: 30,
        after: cursor,
      });
      setGalleryPhotos((prev) => cursor ? [...prev, ...result.assets] : result.assets);
      setGalleryEndCursor(result.endCursor);
      setGalleryHasMore(result.hasNextPage);
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

      {/* Bandeau pièces d'or + niveau */}
      <View style={styles.rewardsBanner}>
        <View style={styles.rewardsBadge}>
          <Text style={styles.rewardsEmoji}>🪙</Text>
          <Text style={styles.rewardsText}>{rewardCoins}</Text>
        </View>
        <View style={styles.rewardsBadge}>
          <Text style={styles.rewardsEmoji}>⭐</Text>
          <Text style={styles.rewardsText}>Niv. {RewardsService.getLevelInfo(rewardXP).level}</Text>
        </View>
        <Pressable style={styles.shopBtn} onPress={() => router.push('/child/shop' as any)}>
          <Text style={styles.shopBtnText}>🛍️</Text>
        </Pressable>
      </View>

      {/* Search Bar (hidden when browser disabled or strict mode) */}
      {browserEnabled && !effectiveStrictMode && (
        <CopilotStep text={tour.childSearch} order={1} name="child-search" active={browserEnabled && !effectiveStrictMode}>
          <CopilotView collapsable={false} style={styles.searchContainer}>
            <LinearGradient
              colors={['#2563EB', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.searchCard}
            >
              {/* Label */}
              <View style={styles.searchCardHeader}>
                <MaterialCommunityIcons name="web" size={16} color="rgba(255,255,255,0.9)" />
                <Text style={styles.searchCardLabel}>Naviguer sur internet</Text>
                <View style={styles.searchSafeBadge}>
                  <MaterialCommunityIcons name="shield-check" size={12} color="#4ADE80" />
                  <Text style={styles.searchSafeBadgeText}>{t.safeSearch}</Text>
                </View>
              </View>

              {/* Input row */}
              <View style={styles.searchBar}>
                <MaterialCommunityIcons
                  name="magnify"
                  size={22}
                  color="#94A3B8"
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={handleSearch}
                  placeholder={t.searchPlaceholder}
                  placeholderTextColor="#94A3B8"
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
                    <LinearGradient
                      colors={['#2563EB', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.searchGoBtn}
                    >
                      <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" />
                    </LinearGradient>
                  </Pressable>
                )}
              </View>
            </LinearGradient>
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

          {/* Hero row: Muslim Tube + Caméra */}
          <Text style={[styles.categoryTitle, dark && styles.textLight]}>⭐ En vedette</Text>
          <View style={[styles.heroRow]}>
            {/* Muslim Tube – dominant */}
            <Pressable
              style={({ pressed }) => [styles.heroCardMain, pressed && styles.tilePressed]}
              onPress={() => router.push('/child/videos' as any)}
            >
              <LinearGradient
                colors={['#FF2020', '#A80000']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradientMain}
              >
                <YoutubeIcon width={38} height={38} fill="#FFF" />
                <Text style={styles.heroCardTitle}>Muslim Tube</Text>
                <View style={styles.heroPlayBadge}>
                  <MaterialCommunityIcons name="play-circle" size={18} color="#FFF" />
                  <Text style={styles.heroPlayText}>Regarder</Text>
                </View>
              </LinearGradient>
            </Pressable>

            {/* Caméra – secondaire */}
            <Pressable
              style={({ pressed }) => [styles.heroCardSide, pressed && styles.tilePressed]}
              onPress={() => router.push('/child/camera' as any)}
            >
              <LinearGradient
                colors={['#7C3AED', '#4F46E5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradientSide}
              >
                <CamleraIcon width={34} height={34} fill="#FFF" />
                <Text style={styles.heroCardTitle}>Caméra</Text>
                <Text style={styles.heroCardSubtitle}>Photos & vidéos</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Catégories */}
          {CATEGORIES.map((category) => (
            <View key={category.title} style={styles.categorySection}>
              <Text style={[styles.categoryTitle, dark && styles.textLight]}>{category.title}</Text>
              <View style={styles.quickLinksGrid}>
                {category.links.map((link) => (
                  <Pressable
                    key={link.url}
                    style={({ pressed }) => [styles.appCard, pressed && styles.tilePressed]}
                    onPress={() => {
                      if (link.url === 'arabic-learning') {
                        setShowArabicLearning(true);
                      } else if (link.url === 'games') {
                        setShowGames(true);
                      } else if (link.url === 'background-picker') {
                        setShowBgPicker(true);
                      } else if (link.isInternal) {
                        router.push(`/child/${link.url}` as any);
                      } else {
                        onQuickLink(link.url);
                      }
                    }}
                  >
                    <LinearGradient
                      colors={link.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.appCardInner}
                    >
                      {link.customIcon ? (
                        <link.customIcon width={30} height={30} fill="#FFF" />
                      ) : (
                        <MaterialCommunityIcons name={link.icon} size={30} color="#FFF" />
                      )}
                      <Text style={styles.appCardLabel} numberOfLines={2}>
                        {link.label}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

        </CopilotView>
      </CopilotStep>

      {/* Arabic Learning Modal */}
      <ArabicLearningModal
        visible={showArabicLearning}
        onClose={() => setShowArabicLearning(false)}
      />

      {/* Games Modal */}
      <GamesModal
        visible={showGames}
        onClose={() => setShowGames(false)}
      />

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
                {/* Gallery picker header */}
                <LinearGradient
                  colors={['#A855F7', '#EC4899']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.galleryPickerHeader}
                >
                  <Pressable style={styles.galleryBackBtn} onPress={() => setShowGalleryPicker(false)}>
                    <MaterialCommunityIcons name="arrow-left" size={22} color="#FFF" />
                  </Pressable>
                  <Text style={styles.galleryPickerTitle}>🖼️ Mes photos</Text>
                  <View style={{ width: 38 }} />
                </LinearGradient>

                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                  <View style={styles.galleryGrid}>
                    {galleryPhotos.map((asset) => {
                      const isSelected = selectedBgId === CUSTOM_PHOTO_BACKGROUND_ID && customPhotoUri === asset.uri;
                      return (
                        <Pressable
                          key={asset.id}
                          style={[styles.galleryPhotoOption, isSelected && styles.galleryPhotoOptionSelected]}
                          onPress={() => selectCustomPhoto(asset)}
                        >
                          <Image source={{ uri: asset.uri }} style={styles.galleryPhotoImage} />
                          {isSelected && (
                            <View style={styles.galleryCheckBadge}>
                              <MaterialCommunityIcons name="check-bold" size={14} color="#FFF" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                  {galleryPhotos.length === 0 && (
                    <View style={styles.galleryEmptyContainer}>
                      <Text style={styles.galleryEmptyEmoji}>📷</Text>
                      <Text style={styles.galleryEmptyText}>Aucune photo disponible</Text>
                    </View>
                  )}
                  {galleryHasMore && (
                    <Pressable
                      style={styles.loadMoreBtn}
                      onPress={() => loadGalleryPhotos(galleryEndCursor)}
                    >
                      <MaterialCommunityIcons name="image-plus" size={18} color="#FFF" />
                      <Text style={styles.loadMoreText}>Voir plus de photos</Text>
                    </Pressable>
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
                  {/* Fun "Use a photo" Card */}
                  <Pressable
                    onPress={() => { loadGalleryPhotos(); setShowGalleryPicker(true); }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}
                  >
                    <LinearGradient
                      colors={['#A855F7', '#EC4899', '#F97316']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.photoActionCard}
                    >
                      <View style={styles.photoActionIconContainer}>
                        <Text style={{ fontSize: 32 }}>🌟</Text>
                      </View>
                      <View style={styles.photoActionContent}>
                        <Text style={styles.photoActionTitle}>Ma propre photo !</Text>
                        <Text style={styles.photoActionSubtitle}>Utilise une photo de ta galerie</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={26} color="#FFF" />
                    </LinearGradient>
                  </Pressable>

                  <View style={styles.divider}>
                    <Text style={styles.dividerText}>Ou choisis un modèle</Text>
                  </View>

                  <View style={styles.bgGrid}>
                    {BACKGROUNDS.map((bg) => {
                      const isSelected = bg.id === selectedBgId;
                      const isBgOwned = !bg.price || ShopService.isUnlockedSync(bgUnlockedMap, 'background', bg.id);
                      return (
                        <Pressable
                          key={bg.id}
                          style={styles.bgOption}
                          onPress={() => {
                            if (!isBgOwned) {
                              setShowBgPicker(false);
                              setBgPurchaseTarget({
                                itemId: bg.id, itemName: bg.label,
                                price: bg.price!,
                                previewImage: bg.source,
                                previewColor: bg.preview,
                              });
                            } else {
                              selectBackground(bg);
                            }
                          }}
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
                            {!isBgOwned && (
                              <View style={styles.bgLockBadge}>
                                <MaterialCommunityIcons name="lock" size={12} color="#FFF" />
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

  const renderShopModal = () => bgPurchaseTarget ? (
    <ShopPurchaseModal
      visible={!!bgPurchaseTarget}
      onClose={() => setBgPurchaseTarget(null)}
      onPurchased={() => ShopService.preloadUnlocked().then(setBgUnlockedMap)}
      category="background"
      itemId={bgPurchaseTarget.itemId}
      itemName={bgPurchaseTarget.itemName}
      price={bgPurchaseTarget.price}
      previewImage={bgPurchaseTarget.previewImage}
      previewColor={bgPurchaseTarget.previewColor}
    />
  ) : null;

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
        {renderShopModal()}
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: selectedBg.color || KidColors.homeBg }]}>
      {renderScrollContent()}
      {renderShopModal()}
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
  rewardsBanner: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  rewardsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  rewardsEmoji: {
    fontSize: 14,
  },
  rewardsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  shopBtn: {
    backgroundColor: '#F59E0B',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  shopBtnText: {
    fontSize: 18,
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
  },
  searchCard: {
    borderRadius: 24,
    padding: 16,
    elevation: 6,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    gap: 12,
  },
  searchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  searchCardLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
  },
  searchSafeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  searchSafeBadgeText: {
    fontSize: 11,
    color: '#4ADE80',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    height: 52,
    paddingHorizontal: Spacing.md,
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
    padding: 2,
  },
  searchGoBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Hero Row (Muslim Tube + Caméra)
  heroRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  heroCardMain: {
    flex: 3,
  },
  heroCardSide: {
    flex: 2,
  },
  heroGradientMain: {
    borderRadius: 22,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#FF0000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroGradientSide: {
    borderRadius: 22,
    padding: 16,
    height: 120,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  heroCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFF',
  },
  heroCardSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  heroPlayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroPlayText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },

  // Category Sections
  categorySection: {
    marginBottom: Spacing.lg,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  quickLinksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: Spacing.md,
  },
  tilePressed: {
    opacity: 0.8,
    transform: [{ scale: 0.92 }],
  },
  appCard: {
    width: '30%',
  },
  appCardInner: {
    borderRadius: 18,
    padding: 12,
    height: 88,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  appCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    color: '#FFF',
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
  bgLockBadge: {
    position: 'absolute' as const,
    top: 4,
    right: 4,
    backgroundColor: '#F59E0B',
    borderRadius: 8,
    padding: 2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
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

  // Photo Action Card (gradient, child-friendly)
  photoActionCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 18,
    borderRadius: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  photoActionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  photoActionContent: {
    flex: 1,
    marginLeft: 14,
  },
  photoActionTitle: {
    fontSize: 17,
    fontWeight: '800' as const,
    color: '#FFF',
    marginBottom: 3,
  },
  photoActionSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '500' as const,
  },
  divider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  // Gallery picker header (gradient)
  galleryPickerHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: Spacing.md,
  },
  galleryBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  galleryPickerTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFF',
  },
  galleryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  galleryPhotoOption: {
    width: 100,
    height: 100,
    borderRadius: 18,
    overflow: 'hidden' as const,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  galleryPhotoOptionSelected: {
    borderColor: '#A855F7',
  },
  galleryPhotoImage: {
    width: '100%' as any,
    height: '100%' as any,
  },
  galleryCheckBadge: {
    position: 'absolute' as const,
    bottom: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#A855F7',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  galleryEmptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: Spacing.xl,
    gap: 8,
  },
  galleryEmptyEmoji: {
    fontSize: 48,
  },
  galleryEmptyText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  loadMoreBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    gap: 8,
    marginVertical: Spacing.md,
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: '#A855F7',
    elevation: 3,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
});

export default BrowserHomePage;
