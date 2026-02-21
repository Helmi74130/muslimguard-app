/**
 * Videos Screen - MuslimGuard
 * Curated YouTube videos organized by categories.
 * Videos play in an isolated YouTube iframe player.
 * Sound can be permanently disabled per video (hasSound field from backend).
 * Below the player, suggested videos from the same category are shown.
 */

import { BorderRadius, Colors, KidColors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { StorageService } from '@/services/storage.service';
import { VideoService } from '@/services/video.service';
import { Video, VideoCategory } from '@/types/video.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Dimensions,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubeIframe from 'react-native-youtube-iframe';

const t = translations.videos;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PLAYER_HEIGHT = (SCREEN_WIDTH - Spacing.lg * 2) * (9 / 16); // 16:9 ratio
const THUMB_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

// Special category IDs
const FAVORITES_CATEGORY_ID = -1;
const CUSTOM_VIDEOS_CATEGORY_ID = -2;

export default function VideosScreen() {
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressBarWidth = useRef(0);

  // Helper to generate a stable negative ID from a string
  const getStableId = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return -Math.abs(hash || -1); // Ensure it's always negative and non-zero
  };

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      loadFavorites();

      return () => {
        // Stop playback when leaving the screen
        setPlaying(false);
        setActiveVideo(null);
      };
    }, [])
  );

  // Google Play Store compliance: stop video when app goes to background
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        setPlaying(false);
      }
    });
    return () => sub.remove();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(false);
    try {
      const cats = await VideoService.getCategories();
      setCategories(cats);

      // Load all videos (backend + custom)
      const allBackendVideos = await VideoService.getVideos();
      const customVideos = await StorageService.getCustomVideos();

      // Convert custom videos to Video type
      const mappedCustomVideos: Video[] = customVideos.map(cv => ({
        id: getStableId(cv.id), // Use stable hash
        youtubeId: cv.youtubeId,
        title: cv.title,
        thumbnailUrl: null,
        hasSound: cv.hasSound,
        order: 9999,
        isCustom: true, // Marker property
      }));

      // Combine arrays
      setVideos([...mappedCustomVideos, ...allBackendVideos]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    try {
      const favorites = await StorageService.getFavoriteVideos();
      setFavoriteIds(favorites);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  };

  const toggleFavorite = async (videoId: number) => {
    try {
      const isFavorite = await StorageService.toggleFavoriteVideo(videoId);
      await loadFavorites();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const selectCategory = async (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setActiveVideo(null);
    setPlaying(false);
    setLoadingVideos(true);
    try {
      // Special case for favorites
      if (categoryId === FAVORITES_CATEGORY_ID) {
        const allBackendVideos = await VideoService.getVideos();
        // We only support favorites for backend videos currently
        const favoriteVideos = allBackendVideos.filter(v => favoriteIds.includes(v.id));
        setVideos(favoriteVideos);
      }
      // Special case for custom videos
      else if (categoryId === CUSTOM_VIDEOS_CATEGORY_ID) {
        const customVideos = await StorageService.getCustomVideos();
        const mappedCustomVideos: Video[] = customVideos.map(cv => ({
          id: getStableId(cv.id),
          youtubeId: cv.youtubeId,
          title: cv.title,
          thumbnailUrl: null,
          hasSound: cv.hasSound,
          order: 9999,
          isCustom: true,
        }));
        setVideos(mappedCustomVideos);
      }
      // Specific backend category
      else if (categoryId !== null) {
        const vids = await VideoService.getVideos(categoryId);
        setVideos(vids);
      }
      // All videos (backend + custom)
      else {
        const allBackendVideos = await VideoService.getVideos();
        const customVideos = await StorageService.getCustomVideos();
        const mappedCustomVideos: Video[] = customVideos.map(cv => ({
          id: getStableId(cv.id),
          youtubeId: cv.youtubeId,
          title: cv.title,
          thumbnailUrl: null,
          hasSound: cv.hasSound,
          order: 9999,
          isCustom: true,
        }));
        setVideos([...mappedCustomVideos, ...allBackendVideos]);
      }
    } catch {
      // Keep current videos on error
    } finally {
      setLoadingVideos(false);
    }
  };

  const playVideo = (video: Video) => {
    setPlayerReady(false);
    setCurrentTime(0);
    setDuration(0);
    setActiveVideo(video);
    setPlaying(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Determine if current video should be muted
  const shouldMute = activeVideo ? !activeVideo.hasSound : false;

  const onPlayerReady = useCallback(() => {
    setPlayerReady(true);
    setTimeout(async () => {
      if (playerRef.current) {
        try {
          const dur = await playerRef.current.getDuration();
          if (dur > 0) setDuration(dur);
        } catch {}
      }
    }, 500);
  }, []);

  const onPlayerStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    } else if (state === 'paused') {
      setPlaying(false);
    } else if (state === 'playing') {
      setPlaying(true);
    }
  }, []);

  // JS injected directly into the WebView to enforce mute via postMessage
  // to the YouTube iframe. This bypasses the React Native bridge entirely
  // and sends mute + setVolume(0) commands on a fast loop.
  const muteEnforcementScript = shouldMute
    ? `(function() {
        function enforceMute() {
          try {
            var frames = document.querySelectorAll('iframe');
            for (var i = 0; i < frames.length; i++) {
              frames[i].contentWindow.postMessage(
                JSON.stringify({event: 'command', func: 'mute', args: []}), '*'
              );
              frames[i].contentWindow.postMessage(
                JSON.stringify({event: 'command', func: 'setVolume', args: [0]}), '*'
              );
            }
          } catch(e) {}
        }
        // Aggressive: every 150ms for first 5s, then every 500ms
        var fast = setInterval(enforceMute, 150);
        setTimeout(function() { clearInterval(fast); setInterval(enforceMute, 500); }, 5000);
        enforceMute();
      })(); true;`
    : undefined;

  // Poll current time from YouTube player
  useEffect(() => {
    if (!playing || !playerReady) return;
    const interval = setInterval(async () => {
      if (playerRef.current) {
        try {
          const time = await playerRef.current.getCurrentTime();
          setCurrentTime(time);
          const dur = await playerRef.current.getDuration();
          if (dur > 0) setDuration(dur);
        } catch {}
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playing, playerReady]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Videos in the same category as active video (excluding the active one)
  const suggestedVideos = activeVideo
    ? videos.filter((v) => v.id !== activeVideo.id)
    : [];

  // Thumbnail URL helper
  const getThumb = (video: Video) => VideoService.getThumbnailUrl(video);

  // Render a single video card for FlatList
  const renderVideoCard = useCallback(({ item: video }: { item: Video }) => (
    <Pressable
      style={({ pressed }) => [
        styles.videoCard,
        pressed && styles.pressed,
      ]}
      onPress={() => playVideo(video)}
    >
      <View style={styles.thumbContainer}>
        <Image
          source={{ uri: getThumb(video) }}
          style={styles.thumbnail}
        />
        <View style={styles.playOverlay}>
          <MaterialCommunityIcons
            name="play-circle"
            size={40}
            color="rgba(255, 255, 255, 0.9)"
          />
        </View>
        {!video.hasSound && (
          <View style={styles.mutedOverlay}>
            <MaterialCommunityIcons
              name="volume-off"
              size={14}
              color="#FFFFFF"
            />
          </View>
        )}
        {!video.isCustom && (
          <Pressable
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(video.id);
            }}
          >
            <MaterialCommunityIcons
              name={favoriteIds.includes(video.id) ? "heart" : "heart-outline"}
              size={20}
              color={favoriteIds.includes(video.id) ? "#FF4444" : "#FFFFFF"}
            />
          </Pressable>
        )}
      </View>
      <Text style={styles.videoTitle} numberOfLines={2}>
        {video.title}
      </Text>
    </Pressable>
  ), [favoriteIds]);

  // ── Loading state ──
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t.title}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{t.title}</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centered}>
          <MaterialCommunityIcons name="wifi-off" size={64} color={Colors.light.textSecondary} />
          <Text style={styles.errorTitle}>{t.loadError}</Text>
          <Text style={styles.errorDesc}>{t.loadErrorDesc}</Text>
          <Pressable onPress={loadCategories} style={styles.retryButton}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryText}>{t.retry}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t.title}</Text>
          <Text style={styles.headerSubtitle}>{t.subtitle}</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Categories chips */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {/* "All" chip */}
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === null && styles.categoryChipActive,
            ]}
            onPress={() => selectCategory(null)}
          >
            <MaterialCommunityIcons
              name="play-box-multiple"
              size={16}
              color={selectedCategory === null ? '#FFFFFF' : Colors.primary}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === null && styles.categoryChipTextActive,
              ]}
            >
              {t.allCategories}
            </Text>
          </Pressable>

          {/* "Favorites" chip */}
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === FAVORITES_CATEGORY_ID && styles.categoryChipActive,
            ]}
            onPress={() => selectCategory(FAVORITES_CATEGORY_ID)}
          >
            <MaterialCommunityIcons
              name={selectedCategory === FAVORITES_CATEGORY_ID ? "heart" : "heart-outline"}
              size={16}
              color={selectedCategory === FAVORITES_CATEGORY_ID ? '#FFFFFF' : Colors.primary}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === FAVORITES_CATEGORY_ID && styles.categoryChipTextActive,
              ]}
            >
              {t.favorites}
              {favoriteIds.length > 0 && ` (${favoriteIds.length})`}
            </Text>
          </Pressable>

          {/* "Custom Videos" chip */}
          <Pressable
            style={[
              styles.categoryChip,
              selectedCategory === CUSTOM_VIDEOS_CATEGORY_ID && styles.categoryChipActive,
            ]}
            onPress={() => selectCategory(CUSTOM_VIDEOS_CATEGORY_ID)}
          >
            <MaterialCommunityIcons
              name={selectedCategory === CUSTOM_VIDEOS_CATEGORY_ID ? "folder-play" : "folder-play-outline"}
              size={16}
              color={selectedCategory === CUSTOM_VIDEOS_CATEGORY_ID ? '#FFFFFF' : Colors.primary}
            />
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === CUSTOM_VIDEOS_CATEGORY_ID && styles.categoryChipTextActive,
              ]}
            >
              {t.myVideos}
            </Text>
          </Pressable>

          {categories.map((cat) => (
            <Pressable
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategory === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => selectCategory(cat.id)}
            >
              <MaterialCommunityIcons
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? '#FFFFFF' : Colors.primary}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main content */}
      {activeVideo ? (
        <ScrollView
          ref={scrollRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.playerSection}>
            <View style={styles.playerWrapper}>
              <YoutubeIframe
                key={activeVideo.id}
                ref={playerRef}
                videoId={activeVideo.youtubeId}
                height={PLAYER_HEIGHT}
                play={playerReady ? playing : false}
                mute={shouldMute}
                volume={shouldMute ? 0 : 100}
                onReady={onPlayerReady}
                onChangeState={onPlayerStateChange}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  allowsLinking: false,
                  ...(muteEnforcementScript ? { injectedJavaScript: muteEnforcementScript } : {}),
                }}
                initialPlayerParams={{
                  rel: false,
                  modestbranding: true,
                  controls: false,
                  fs: false,
                }}
              />
              {/* Overlay to block YouTube links at top (logo/title) */}
              <View style={styles.overlayTop} pointerEvents="box-only" />
              {/* Overlay to block YouTube links at bottom (watermark) */}
              <View style={styles.overlayBottom} pointerEvents="box-only" />
              {/* Custom controls bar */}
              <View style={styles.controlsBar}>
                <Pressable
                  onPress={() => setPlaying(prev => !prev)}
                  style={styles.playPauseBtn}
                >
                  <MaterialCommunityIcons
                    name={playing ? 'pause' : 'play'}
                    size={22}
                    color="#FFFFFF"
                  />
                </Pressable>
                <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
                <Pressable
                  style={styles.progressBarContainer}
                  onLayout={(e) => { progressBarWidth.current = e.nativeEvent.layout.width; }}
                  onPress={(e) => {
                    if (duration > 0 && progressBarWidth.current > 0) {
                      const seekTime = (e.nativeEvent.locationX / progressBarWidth.current) * duration;
                      playerRef.current?.seekTo(seekTime, true);
                      setCurrentTime(seekTime);
                    }
                  }}
                >
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` },
                      ]}
                    />
                  </View>
                </Pressable>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
                {shouldMute && (
                  <MaterialCommunityIcons name="volume-off" size={16} color={Colors.warning} />
                )}
              </View>
            </View>

            {/* Now playing info */}
            <View style={styles.nowPlayingInfo}>
              <View style={styles.nowPlayingHeader}>
                <MaterialCommunityIcons name="play-circle" size={18} color={Colors.primary} />
                <Text style={styles.nowPlayingLabel}>{t.nowPlaying}</Text>
              </View>
              <Text style={styles.nowPlayingTitle} numberOfLines={2}>
                {activeVideo.title}
              </Text>
              {!activeVideo.hasSound && (
                <View style={styles.mutedBadge}>
                  <MaterialCommunityIcons name="volume-off" size={14} color={Colors.warning} />
                  <Text style={styles.mutedText}>{t.muted}</Text>
                </View>
              )}
            </View>

            {/* Suggested videos from same category */}
            {suggestedVideos.length > 0 && (
              <View style={styles.suggestedSection}>
                <Text style={styles.suggestedTitle}>{t.sameCategory}</Text>
                {suggestedVideos.map((video) => (
                  <Pressable
                    key={video.id}
                    style={({ pressed }) => [
                      styles.suggestedItem,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => playVideo(video)}
                  >
                    <Image
                      source={{ uri: getThumb(video) }}
                      style={styles.suggestedThumb}
                    />
                    <View style={styles.suggestedInfo}>
                      <Text style={styles.suggestedItemTitle} numberOfLines={2}>
                        {video.title}
                      </Text>
                      {!video.hasSound && (
                        <MaterialCommunityIcons
                          name="volume-off"
                          size={14}
                          color={Colors.light.textSecondary}
                        />
                      )}
                    </View>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      ) : loadingVideos ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={videos}
          numColumns={2}
          renderItem={renderVideoCard}
          keyExtractor={(item) => item.id.toString()}
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, styles.videoGridContent]}
          columnWrapperStyle={videos.length > 1 ? styles.videoGridRow : undefined}
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={8}
          windowSize={5}
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons
                name={
                  selectedCategory === FAVORITES_CATEGORY_ID ? "heart-outline" :
                    selectedCategory === CUSTOM_VIDEOS_CATEGORY_ID ? "folder-play-outline" :
                      "video-off-outline"
                }
                size={64}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.errorTitle}>
                {
                  selectedCategory === FAVORITES_CATEGORY_ID ? t.noFavorites :
                    selectedCategory === CUSTOM_VIDEOS_CATEGORY_ID ? t.noCustomVideos :
                      t.noVideos
                }
              </Text>
              <Text style={styles.errorDesc}>
                {
                  selectedCategory === FAVORITES_CATEGORY_ID ? t.noFavoritesDesc :
                    selectedCategory === CUSTOM_VIDEOS_CATEGORY_ID ? t.noCustomVideosDesc :
                      t.noVideosDesc
                }
              </Text>
            </View>
          }
        />
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KidColors.homeBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },

  // Categories
  categoriesContainer: {
    paddingBottom: Spacing.sm,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },

  // Centered states (loading, error, empty)
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  retryText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Player section
  playerSection: {
    marginTop: Spacing.sm,
  },
  playerWrapper: {
    position: 'relative',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: '#000',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  // Overlays to block YouTube clickable areas (top logo + bottom watermark)
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 62,
    zIndex: 10,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    height: 70,
    zIndex: 10,
  },
  // Custom player controls
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryDark,
    gap: Spacing.sm,
  },
  playPauseBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 28,
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    minWidth: 36,
    textAlign: 'center',
  },
  nowPlayingInfo: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  nowPlayingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  nowPlayingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  nowPlayingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
  },
  mutedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    backgroundColor: Colors.warning + '15',
    borderRadius: BorderRadius.full,
  },
  mutedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.warning,
  },

  // Suggested videos
  suggestedSection: {
    marginTop: Spacing.lg,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  suggestedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  suggestedThumb: {
    width: 120,
    height: 68,
    backgroundColor: Colors.light.surfaceVariant,
  },
  suggestedInfo: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingRight: Spacing.md,
    gap: 4,
  },
  suggestedItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },

  // Video grid (FlatList)
  videoGridContent: {
    paddingTop: Spacing.md,
  },
  videoGridRow: {
    gap: Spacing.md,
  },
  videoCard: {
    width: THUMB_WIDTH,
    marginBottom: Spacing.md,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  thumbContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.light.surfaceVariant,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  thumbnail: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.light.surfaceVariant,
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  mutedOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: BorderRadius.full,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 6,
  },
});
