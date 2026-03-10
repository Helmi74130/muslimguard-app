/**
 * Story Reader Screen - MuslimGuard
 * Affiche le contenu complet d'une histoire
 */

import { STORIES } from '@/data/stories';
import { StorageService } from '@/services/storage.service';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = SCREEN_WIDTH * 0.55;

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const story = STORIES.find((s) => s.id === id);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!story) return;
    StorageService.getFavoriteStories().then((favs) => {
      setIsFavorite(favs.includes(story.id));
    });
  }, [story]);

  const handleToggleFavorite = async () => {
    if (!story) return;
    const result = await StorageService.toggleFavoriteStory(story.id);
    setIsFavorite(result);
  };

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <Pressable onPress={() => router.back()} style={styles.backButtonOverlay}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </Pressable>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Histoire introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image ou gradient */}
        <View style={styles.hero}>
          {story.image ? (
            <Image source={story.image} style={styles.heroImage} />
          ) : (
            <LinearGradient
              colors={[story.color, story.color + 'BB']}
              style={styles.heroImage}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={80}
                color="rgba(255,255,255,0.5)"
              />
            </LinearGradient>
          )}

          {/* Bouton retour par dessus le hero */}
          <Pressable onPress={() => router.back()} style={styles.backButtonOverlay} hitSlop={8}>
            <View style={styles.backButtonBg}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </View>
          </Pressable>
        </View>

        {/* Contenu */}
        <View style={styles.content}>
          {/* Titre + favori */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={3}>{story.title}</Text>
            <Pressable onPress={handleToggleFavorite} style={styles.favoriteButton} hitSlop={8}>
              <MaterialCommunityIcons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={28}
                color={isFavorite ? '#EF4444' : Colors.light.tabIconDefault}
              />
            </Pressable>
          </View>

          {/* Meta */}
          <View style={styles.metaRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{story.category}</Text>
            </View>
            {story.duration && (
              <View style={styles.durationRow}>
                <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.light.tabIconDefault} />
                <Text style={styles.durationText}>{story.duration}</Text>
              </View>
            )}
          </View>

          {/* Texte */}
          <Text style={styles.body}>{story.content}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  hero: {
    position: 'relative',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 48,
    left: Spacing.lg,
  },
  backButtonBg: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    padding: 8,
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 30,
  },
  favoriteButton: {
    paddingTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  badge: {
    backgroundColor: Colors.primary + '18',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: Colors.light.tabIconDefault,
  },
  body: {
    fontSize: 17,
    color: Colors.light.text,
    lineHeight: 28,
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.light.tabIconDefault,
  },
});
