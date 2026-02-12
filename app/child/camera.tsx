/**
 * Camera & Filtres Muslim-Friendly - MuslimGuard
 * Camera with decorative Islamic frame overlays + draggable stickers
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  Image,
  ActivityIndicator,
  PanResponder,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { CAMERA_FRAMES, CameraFrame } from '@/constants/camera-frames';
import { CAMERA_STICKERS, CameraSticker } from '@/constants/camera-stickers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CAMERA_HEIGHT = SCREEN_HEIGHT * 0.6;

// Placed sticker instance
interface PlacedSticker {
  id: string;
  sticker: CameraSticker;
  x: number;
  y: number;
}

// Draggable sticker component using PanResponder
function DraggableSticker({
  placed,
  onRemove,
}: {
  placed: PlacedSticker;
  onRemove: (id: string) => void;
}) {
  const posRef = useRef({ x: placed.x, y: placed.y });
  const [pos, setPos] = useState({ x: placed.x, y: placed.y });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        const newX = posRef.current.x + gesture.dx;
        const newY = posRef.current.y + gesture.dy;
        setPos({ x: newX, y: newY });
      },
      onPanResponderRelease: (_, gesture) => {
        posRef.current = {
          x: posRef.current.x + gesture.dx,
          y: posRef.current.y + gesture.dy,
        };
      },
    })
  ).current;

  const { sticker } = placed;

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.placedSticker,
        {
          left: pos.x - sticker.size / 2,
          top: pos.y - sticker.size / 2,
          width: sticker.size,
          height: sticker.size,
        },
      ]}
    >
      {sticker.type === 'icon' && sticker.icon ? (
        <MaterialCommunityIcons
          name={sticker.icon as any}
          size={sticker.size}
          color={sticker.iconColor || '#FFF'}
        />
      ) : sticker.image ? (
        <Image
          source={sticker.image}
          style={{ width: sticker.size, height: sticker.size }}
          resizeMode="contain"
        />
      ) : null}
      {/* Remove button */}
      <Pressable
        style={styles.removeSticker}
        onPress={() => onRemove(placed.id)}
        hitSlop={8}
      >
        <MaterialCommunityIcons name="close-circle" size={18} color="#FF4444" />
      </Pressable>
    </View>
  );
}

export default function CameraScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [frameIndex, setFrameIndex] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [showStickers, setShowStickers] = useState(false);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const viewShotRef = useRef<ViewShot>(null);
  let stickerCounter = useRef(0);

  const currentFrame: CameraFrame = CAMERA_FRAMES[frameIndex];

  const handlePrevFrame = useCallback(() => {
    setFrameIndex((prev) =>
      prev === 0 ? CAMERA_FRAMES.length - 1 : prev - 1
    );
  }, []);

  const handleNextFrame = useCallback(() => {
    setFrameIndex((prev) =>
      prev === CAMERA_FRAMES.length - 1 ? 0 : prev + 1
    );
  }, []);

  const toggleFacing = useCallback(() => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  }, []);

  const addSticker = useCallback((sticker: CameraSticker) => {
    stickerCounter.current += 1;
    const newPlaced: PlacedSticker = {
      id: `${sticker.id}-${stickerCounter.current}`,
      sticker,
      x: SCREEN_WIDTH / 2,
      y: CAMERA_HEIGHT / 2,
    };
    setPlacedStickers((prev) => [...prev, newPlaced]);
  }, []);

  const removeSticker = useCallback((id: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearStickers = useCallback(() => {
    setPlacedStickers([]);
  }, []);

  const takePhoto = useCallback(async () => {
    if (capturing) return;

    if (!mediaPermission?.granted) {
      const result = await requestMediaPermission();
      if (!result.granted) {
        Alert.alert('Permission requise', 'Autorise l\'accès à la galerie pour sauvegarder les photos.');
        return;
      }
    }

    setCapturing(true);
    try {
      if (viewShotRef.current?.capture) {
        const uri = await viewShotRef.current.capture();
        await MediaLibrary.saveToLibraryAsync(uri);
        setLastPhoto(uri);
        setTimeout(() => setLastPhoto(null), 2000);
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo. Réessaye.');
    } finally {
      setCapturing(false);
    }
  }, [capturing, mediaPermission, requestMediaPermission]);

  // Permission not yet determined
  if (!cameraPermission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Permission denied
  if (!cameraPermission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#94A3B8" />
        <Text style={styles.permissionTitle}>Accès à la caméra</Text>
        <Text style={styles.permissionText}>
          Autorise l'accès à la caméra pour prendre de belles photos avec des cadres islamiques.
        </Text>
        <Pressable style={styles.permissionButton} onPress={requestCameraPermission}>
          <Text style={styles.permissionButtonText}>Autoriser la caméra</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Retour</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
        </Pressable>
        <Text style={styles.title}>Caméra</Text>
        <Pressable style={styles.headerBtn} onPress={toggleFacing}>
          <MaterialCommunityIcons name="camera-flip" size={24} color="#FFF" />
        </Pressable>
      </View>

      {/* Camera + Frame + Stickers (captured together) */}
      <ViewShot
        ref={viewShotRef}
        options={{ format: 'jpg', quality: 0.9 }}
        style={styles.cameraContainer}
      >
        <CameraView
          style={styles.camera}
          facing={facing}
          mirror={facing === 'front'}
        />

        {/* Frame overlay */}
        {currentFrame.id !== 'none' && (
          <View style={styles.frameOverlay} pointerEvents="none">
            {currentFrame.overlay ? (
              <Image
                source={currentFrame.overlay}
                style={styles.frameImage}
                resizeMode="contain"
              />
            ) : (
              <View
                style={[
                  styles.fallbackFrame,
                  { borderColor: currentFrame.borderColor },
                ]}
              >
                <View style={[styles.corner, styles.cornerTL, { borderColor: currentFrame.borderColor }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: currentFrame.borderColor }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: currentFrame.borderColor }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: currentFrame.borderColor }]} />
                <View style={[styles.frameNameBadge, { backgroundColor: currentFrame.borderColor + 'CC' }]}>
                  <MaterialCommunityIcons name={currentFrame.icon as any} size={16} color="#FFF" />
                  <Text style={styles.frameNameText}>{currentFrame.name}</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Placed stickers (draggable) */}
        {placedStickers.map((placed) => (
          <DraggableSticker
            key={placed.id}
            placed={placed}
            onRemove={removeSticker}
          />
        ))}
      </ViewShot>

      {/* Saved feedback */}
      {lastPhoto && (
        <View style={styles.savedFeedback}>
          <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
          <Text style={styles.savedText}>Photo sauvegardée !</Text>
        </View>
      )}

      {/* Toolbar: Frames + Sticker toggle */}
      <View style={styles.toolbarRow}>
        {/* Frame selector */}
        <View style={styles.frameSelectorRow}>
          <Pressable style={styles.frameArrow} onPress={handlePrevFrame}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#FFF" />
          </Pressable>
          <View style={styles.frameIndicators}>
            {CAMERA_FRAMES.map((frame, index) => (
              <Pressable
                key={frame.id}
                style={[
                  styles.frameChip,
                  frameIndex === index && [
                    styles.frameChipActive,
                    { backgroundColor: frame.borderColor === 'transparent' ? Colors.primary : frame.borderColor },
                  ],
                ]}
                onPress={() => setFrameIndex(index)}
              >
                <MaterialCommunityIcons
                  name={frame.icon as any}
                  size={16}
                  color={frameIndex === index ? '#FFF' : '#94A3B8'}
                />
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.frameArrow} onPress={handleNextFrame}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#FFF" />
          </Pressable>
        </View>

        {/* Sticker toggle + clear */}
        <View style={styles.stickerActions}>
          <Pressable
            style={[styles.stickerToggle, showStickers && styles.stickerToggleActive]}
            onPress={() => setShowStickers(!showStickers)}
          >
            <MaterialCommunityIcons
              name="sticker-emoji"
              size={22}
              color={showStickers ? '#FFF' : '#94A3B8'}
            />
          </Pressable>
          {placedStickers.length > 0 && (
            <Pressable style={styles.clearStickersBtn} onPress={clearStickers}>
              <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B6B" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Sticker picker tray */}
      {showStickers && (
        <View style={styles.stickerTray}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.stickerTrayContent}
          >
            {CAMERA_STICKERS.map((sticker) => (
              <Pressable
                key={sticker.id}
                style={({ pressed }) => [
                  styles.stickerPickerItem,
                  pressed && styles.stickerPickerItemPressed,
                ]}
                onPress={() => addSticker(sticker)}
              >
                {sticker.type === 'icon' && sticker.icon ? (
                  <MaterialCommunityIcons
                    name={sticker.icon as any}
                    size={28}
                    color={sticker.iconColor || '#FFF'}
                  />
                ) : sticker.image ? (
                  <Image
                    source={sticker.image}
                    style={styles.stickerPickerImage}
                    resizeMode="contain"
                  />
                ) : null}
                <Text style={styles.stickerPickerLabel} numberOfLines={1}>
                  {sticker.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Capture button */}
      <View style={styles.captureRow}>
        <View style={styles.captureSpacing} />
        <Pressable
          style={({ pressed }) => [
            styles.captureButton,
            pressed && styles.captureButtonPressed,
          ]}
          onPress={takePhoto}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <View style={styles.captureInner} />
          )}
        </Pressable>
        <View style={styles.captureSpacing} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Permission screen
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
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
  backButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xs,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFF',
  },

  // Camera
  cameraContainer: {
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },

  // Frame overlay
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  frameImage: {
    width: '100%',
    height: '100%',
  },

  // Fallback decorative frame
  fallbackFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 6,
    borderRadius: 4,
    margin: 12,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderWidth: 4,
  },
  cornerTL: {
    top: -4,
    left: -4,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: -4,
    right: -4,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: -4,
    left: -4,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: -4,
    right: -4,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 8,
  },
  frameNameBadge: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: BorderRadius.full,
  },
  frameNameText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Placed stickers
  placedSticker: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeSticker: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 9,
  },

  // Saved feedback
  savedFeedback: {
    position: 'absolute',
    top: CAMERA_HEIGHT + 60,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  savedText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },

  // Toolbar row
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },

  // Frame selector
  frameSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  frameArrow: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  frameIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frameChip: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  frameChipActive: {
    transform: [{ scale: 1.15 }],
  },

  // Sticker actions
  stickerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stickerToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickerToggleActive: {
    backgroundColor: Colors.primary,
  },
  clearStickersBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,100,100,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Sticker picker tray
  stickerTray: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    paddingVertical: 8,
  },
  stickerTrayContent: {
    paddingHorizontal: Spacing.md,
    gap: 12,
  },
  stickerPickerItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    gap: 2,
  },
  stickerPickerItemPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.9 }],
  },
  stickerPickerImage: {
    width: 28,
    height: 28,
  },
  stickerPickerLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Capture button
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  captureSpacing: {
    flex: 1,
  },
  captureButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 4,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  captureButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  captureInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFF',
  },
});
