/**
 * Custom Videos Settings Screen - MuslimGuard
 * Allows parents to add YouTube videos for their children
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { StorageService } from '@/services/storage.service';
import { LocalVideo } from '@/types/storage.types';
import { extractYouTubeId, fetchYouTubeTitle, getYouTubeThumbnail } from '@/utils/youtube';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const t = translations.customVideos;

export default function CustomVideosScreen() {
  const [videos, setVideos] = useState<LocalVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [addingVideo, setAddingVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const customVideos = await StorageService.getCustomVideos();
      setVideos(customVideos);
    } catch (e) {
      console.error('Error loading custom videos:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async () => {
    setError(null);
    if (!urlInput.trim()) return;

    // Validate YouTube URL
    const videoId = extractYouTubeId(urlInput);
    if (!videoId) {
      setError(t.errors.invalidUrlDesc);
      return;
    }

    setAddingVideo(true);
    try {
      // Fetch the real title from YouTube
      const videoTitle = await fetchYouTubeTitle(videoId);

      // Create new video object
      const newVideo: LocalVideo = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        youtubeId: videoId,
        title: videoTitle || `Vidéo YouTube`, // Fallback title
        addedAt: Date.now(),
        hasSound: true,
      };

      const result = await StorageService.addCustomVideo(newVideo);

      if (result.success) {
        setUrlInput('');
        loadVideos();
        Alert.alert(t.success.added, t.success.addedDesc);
      } else {
        if (result.error === 'duplicate') {
          setError(t.errors.duplicateDesc);
        } else if (result.error === 'limit_reached') {
          setError(t.errors.limitReachedDesc);
        } else {
          setError('Erreur inconnue lors de l\'ajout.');
        }
      }
    } catch (e) {
      console.error('Error adding video:', e);
      setError('Une erreur est survenue.');
    } finally {
      setAddingVideo(false);
    }
  };

  const handleDeleteVideo = (video: LocalVideo) => {
    Alert.alert(
      t.deleteConfirm,
      t.deleteConfirmDesc,
      [
        { text: translations.common.cancel, style: 'cancel' },
        {
          text: t.delete,
          style: 'destructive',
          onPress: async () => {
            await StorageService.removeCustomVideo(video.id);
            loadVideos();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Video Section */}
        <View style={styles.addSection}>
          <Text style={styles.sectionTitle}>{t.addVideo}</Text>
          <Text style={styles.sectionSubtitle}>{t.subtitle}</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={t.urlPlaceholder}
              value={urlInput}
              onChangeText={(text) => {
                setUrlInput(text);
                setError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {urlInput.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setUrlInput('');
                  setError(null);
                }}
              >
                <MaterialCommunityIcons name="close-circle" size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.addButton,
              (!urlInput.trim() || addingVideo) && styles.addButtonDisabled
            ]}
            onPress={handleAddVideo}
            disabled={!urlInput.trim() || addingVideo}
          >
            {addingVideo ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>{t.add}</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.hintText}>{t.urlHint}</Text>
        </View>

        {/* Video List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>
            {t.myVideos} ({videos.length})
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: Spacing.xl }} />
          ) : videos.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="youtube" size={48} color={Colors.light.textSecondary} style={{ opacity: 0.5 }} />
              <Text style={styles.emptyTitle}>{t.noVideos}</Text>
              <Text style={styles.emptyDesc}>{t.noVideosDesc}</Text>
            </View>
          ) : (
            <View style={styles.videoList}>
              {videos.map((video) => (
                <View key={video.id} style={styles.videoCard}>
                  <Image
                    source={{ uri: getYouTubeThumbnail(video.youtubeId) }}
                    style={styles.thumbnail}
                  />
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={2}>
                      {video.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteVideo(video)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Bottom padding */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.background,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  content: {
    flex: 1,
  },
  addSection: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.sm,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: Colors.light.text,
  },
  clearButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 48,
    gap: 8,
    marginTop: Spacing.xs,
  },
  addButtonDisabled: {
    backgroundColor: '#BDBDBD',
    opacity: 0.7,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
  },

  // List Section
  listSection: {
    padding: Spacing.lg,
  },
  videoList: {
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  videoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    height: 80,
  },
  thumbnail: {
    width: 120,
    height: '100%',
    backgroundColor: Colors.light.surfaceVariant,
  },
  videoInfo: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  videoMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  deleteButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: Colors.light.border,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
