/**
 * Stories List Screen - MuslimGuard
 * Grille 2 colonnes des histoires pour enfants
 */

import { STORIES, Story } from '@/data/stories';
import { StorageService } from '@/services/storage.service';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2;
const CARD_HEIGHT = CARD_WIDTH * 1.4;

function StoryCard({
  story,
  isFavorite,
  onToggleFavorite,
}: {
  story: Story;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/child/stories/${story.id}` as any)}
    >
      {/* Image ou gradient de fond */}
      {story.image ? (
        <Image source={story.image} style={styles.cardImage} />
      ) : (
        <LinearGradient
          colors={[story.color, story.color + 'AA']}
          style={styles.cardImage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <MaterialCommunityIcons name="book-open-page-variant" size={48} color="rgba(255,255,255,0.6)" />
        </LinearGradient>
      )}

      {/* Bouton favori */}
      <Pressable
        style={styles.favoriteButton}
        onPress={() => onToggleFavorite(story.id)}
        hitSlop={8}
      >
        <MaterialCommunityIcons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={20}
          color={isFavorite ? '#EF4444' : 'rgba(255,255,255,0.9)'}
        />
      </Pressable>

      {/* Infos */}
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{story.title}</Text>
        {story.duration && (
          <View style={styles.durationRow}>
            <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.light.tabIconDefault} />
            <Text style={styles.durationText}>{story.duration}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

export default function StoriesScreen() {
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    StorageService.getFavoriteStories().then(setFavorites);
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    await StorageService.toggleFavoriteStory(id);
    const updated = await StorageService.getFavoriteStories();
    setFavorites(updated);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={8}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Histoires</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={STORIES}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <StoryCard
            story={item}
            isFavorite={favorites.includes(item.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      />
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
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  grid: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  row: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  cardImage: {
    width: '100%',
    height: CARD_HEIGHT * 0.6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 20,
    padding: 5,
  },
  cardInfo: {
    padding: Spacing.sm,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    lineHeight: 18,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  durationText: {
    fontSize: 11,
    color: Colors.light.tabIconDefault,
  },
});
