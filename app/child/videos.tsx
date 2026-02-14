/**
 * Videos Screen - MuslimGuard
 * Curated YouTube videos organized by categories.
 * Videos play in an isolated YouTube iframe player.
 * Sound can be permanently disabled per video (hasSound field from backend).
 * Below the player, suggested videos from the same category are shown.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import YoutubeIframe from 'react-native-youtube-iframe';
import { Colors, Spacing, BorderRadius, KidColors } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { VideoService } from '@/services/video.service';
import { VideoCategory, Video } from '@/types/video.types';

const t = translations.videos;
const SCREEN_WIDTH = Dimensions.get('window').width;
const PLAYER_HEIGHT = (SCREEN_WIDTH - Spacing.lg * 2) * (9 / 16); // 16:9 ratio
const THUMB_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md) / 2;

export default function VideosScreen() {
  const [categories, setCategories] = useState<VideoCategory[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      loadCategories();
      return () => {
        // Stop playback when leaving the screen
        setPlaying(false);
        setActiveVideo(null);
      };
    }, [])
  );

  const loadCategories = async () => {
    setLoading(true);
    setError(false);
    try {
      const cats = await VideoService.getCategories();
      setCategories(cats);
      // Load all videos initially
      const allVideos = await VideoService.getVideos();
      setVideos(allVideos);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const selectCategory = async (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setActiveVideo(null);
    setPlaying(false);
    setLoadingVideos(true);
    try {
      const vids = await VideoService.getVideos(
        categoryId ?? undefined
      );
      setVideos(vids);
    } catch {
      // Keep current videos on error
    } finally {
      setLoadingVideos(false);
    }
  };

  const playVideo = (video: Video) => {
    setActiveVideo(video);
    setPlaying(true);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const onPlayerStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  // Videos in the same category as active video (excluding the active one)
  const suggestedVideos = activeVideo
    ? videos.filter((v) => v.id !== activeVideo.id)
    : [];

  // Thumbnail URL helper
  const getThumb = (video: Video) => VideoService.getThumbnailUrl(video);

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
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Active video player */}
        {activeVideo && (
          <View style={styles.playerSection}>
            <View style={styles.playerWrapper}>
              <YoutubeIframe
                videoId={activeVideo.youtubeId}
                height={PLAYER_HEIGHT}
                play={playing}
                mute={!activeVideo.hasSound}
                webViewProps={{
                  allowsInlineMediaPlayback: true,
                  mediaPlaybackRequiresUserAction: false,
                  allowsLinking: false,
                }}
                initialPlayerParams={{
                  rel: false,
                  modestbranding: true,
                  controls: true,
                  fs: false,
                }}
                onChangeState={onPlayerStateChange}
              />
              {/* Overlay to block YouTube logo (top-right of player) */}
              <View style={styles.youtubeBlockerTopRight} pointerEvents="box-only" />
              {/* Overlay to block YouTube watermark (bottom-right of player) */}
              <View style={styles.youtubeBlockerBottomRight} pointerEvents="box-only" />
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
        )}

        {/* Video grid (when no video is playing) */}
        {!activeVideo && (
          <>
            {loadingVideos ? (
              <View style={styles.centered}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : videos.length === 0 ? (
              <View style={styles.centered}>
                <MaterialCommunityIcons
                  name="video-off-outline"
                  size={64}
                  color={Colors.light.textSecondary}
                />
                <Text style={styles.errorTitle}>{t.noVideos}</Text>
                <Text style={styles.errorDesc}>{t.noVideosDesc}</Text>
              </View>
            ) : (
              <View style={styles.videoGrid}>
                {videos.map((video) => (
                  <Pressable
                    key={video.id}
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
                    </View>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
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
  // Invisible overlay blocking YouTube logo (top-right corner)
  youtubeBlockerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 40,
    zIndex: 10,
  },
  // Invisible overlay blocking YouTube watermark (bottom-right)
  youtubeBlockerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 130,
    height: 50,
    zIndex: 10,
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

  // Video grid
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  videoCard: {
    width: THUMB_WIDTH,
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
  videoTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 6,
  },
});
