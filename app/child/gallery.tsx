/**
 * Gallery - MuslimGuard
 * Browse photos taken with the camera from the device's media library
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const NUM_COLUMNS = 3;
const TILE_GAP = 2;
const TILE_SIZE = (SCREEN_WIDTH - TILE_GAP * (NUM_COLUMNS + 1)) / NUM_COLUMNS;
const PAGE_SIZE = 30;

export default function GalleryScreen() {
  const [permission, requestPermission] = MediaLibrary.usePermissions();
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<MediaLibrary.Asset | null>(null);

  const loadPhotos = useCallback(async (cursor?: string) => {
    try {
      const result = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
        first: PAGE_SIZE,
        after: cursor,
      });

      if (cursor) {
        setAssets((prev) => [...prev, ...result.assets]);
      } else {
        setAssets(result.assets);
      }
      setEndCursor(result.endCursor);
      setHasMore(result.hasNextPage);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permission?.granted) {
      loadPhotos();
    }
  }, [permission?.granted, loadPhotos]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && endCursor) {
      loadPhotos(endCursor);
    }
  }, [hasMore, loading, endCursor, loadPhotos]);

  // Permission not yet determined
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <MaterialCommunityIcons name="image-off" size={64} color="#94A3B8" />
        <Text style={styles.permissionTitle}>Accès aux photos</Text>
        <Text style={styles.permissionText}>
          Autorise l'accès aux photos pour voir tes images.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Autoriser</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  const renderPhoto = ({ item }: { item: MediaLibrary.Asset }) => (
    <Pressable
      style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
      onPress={() => setSelectedAsset(item)}
    >
      <Image source={{ uri: item.uri }} style={styles.tileImage} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>Galerie</Text>
        <View style={styles.headerBtn}>
          <MaterialCommunityIcons name="image-multiple" size={24} color="#FFF" />
        </View>
      </View>

      {/* Photo count */}
      {assets.length > 0 && (
        <View style={styles.countBar}>
          <Text style={styles.countText}>
            {assets.length} photo{assets.length > 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {/* Grid */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement des photos...</Text>
        </View>
      ) : assets.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons name="camera-plus" size={64} color="#94A3B8" />
          <Text style={styles.emptyTitle}>Aucune photo</Text>
          <Text style={styles.emptyText}>
            Prends des photos avec la caméra et elles apparaîtront ici !
          </Text>
          <Pressable
            style={styles.cameraButton}
            onPress={() => router.replace('/child/camera')}
          >
            <MaterialCommunityIcons name="camera" size={20} color="#FFF" />
            <Text style={styles.cameraButtonText}>Ouvrir la caméra</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={assets}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={NUM_COLUMNS}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            hasMore ? (
              <ActivityIndicator
                size="small"
                color={Colors.primary}
                style={styles.footer}
              />
            ) : null
          }
        />
      )}

      {/* Fullscreen viewer */}
      <Modal
        visible={selectedAsset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAsset(null)}
        statusBarTranslucent
      >
        <View style={styles.viewerContainer}>
          <StatusBar hidden />
          <Pressable
            style={styles.viewerCloseBtn}
            onPress={() => setSelectedAsset(null)}
          >
            <MaterialCommunityIcons name="close" size={28} color="#FFF" />
          </Pressable>
          {selectedAsset && (
            <Image
              source={{ uri: selectedAsset.uri }}
              style={styles.viewerImage}
              resizeMode="contain"
            />
          )}
          {selectedAsset && (
            <View style={styles.viewerInfo}>
              <Text style={styles.viewerDate}>
                {new Date(selectedAsset.creationTime).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
    backgroundColor: '#87CEEB',
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },

  // Count bar
  countBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    backgroundColor: '#DBEAFE',
  },
  countText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },

  // Grid
  grid: {
    paddingTop: TILE_GAP,
  },
  row: {
    gap: TILE_GAP,
    paddingHorizontal: TILE_GAP,
    marginBottom: TILE_GAP,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tilePressed: {
    opacity: 0.7,
  },
  tileImage: {
    width: '100%',
    height: '100%',
  },

  // Loading / Empty
  loadingText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  emptyText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  cameraButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Permission
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: Spacing.md,
  },
  permissionText: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backBtnText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Footer
  footer: {
    paddingVertical: Spacing.lg,
  },

  // Fullscreen viewer
  viewerContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerCloseBtn: {
    position: 'absolute',
    top: Spacing.xl + 10,
    right: Spacing.lg,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewerImage: {
    width: '100%',
    height: '80%',
  },
  viewerInfo: {
    position: 'absolute',
    bottom: Spacing.xxl,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
  },
  viewerDate: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
});
