/**
 * Camera & Filtres Muslim-Friendly - MuslimGuard
 * Camera with decorative Islamic frame overlays + draggable stickers
 *
 * Capture strategy: the CameraView is NEVER inside a ViewShot (Android SurfaceView
 * cannot be captured by PixelCopy). Instead, takePictureAsync() grabs the photo,
 * then a SEPARATE ViewShot (containing only an <Image> + overlays) is rendered
 * and captured.
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

// Current transform for a sticker (tracked in parent via ref)
interface StickerTransform {
  x: number;
  y: number;
  scale: number;
}

// Placed sticker instance
interface PlacedSticker {
  id: string;
  sticker: CameraSticker;
  x: number;
  y: number;
  scale: number;
}

// Draggable sticker component using PanResponder
function DraggableSticker({
  placed,
  onRemove,
  onTransformChange,
  hideControls,
}: {
  placed: PlacedSticker;
  onRemove: (id: string) => void;
  onTransformChange: (id: string, x: number, y: number, scale: number) => void;
  hideControls?: boolean;
}) {
  const posRef = useRef({ x: placed.x, y: placed.y });
  const scaleRef = useRef(placed.scale);
  const [pos, setPos] = useState({ x: placed.x, y: placed.y });
  const [scale, setScale] = useState(placed.scale);

  // Keep a ref to the callback so PanResponder always calls the latest version
  const onTransformChangeRef = useRef(onTransformChange);
  onTransformChangeRef.current = onTransformChange;

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
        onTransformChangeRef.current(
          placed.id,
          posRef.current.x,
          posRef.current.y,
          scaleRef.current
        );
      },
    })
  ).current;

  const { sticker } = placed;
  const scaledSize = sticker.size * scale;

  const grow = () => {
    const newScale = Math.min(scaleRef.current + 0.25, 3);
    scaleRef.current = newScale;
    setScale(newScale);
    onTransformChange(placed.id, posRef.current.x, posRef.current.y, newScale);
  };

  const shrink = () => {
    const newScale = Math.max(scaleRef.current - 0.25, 0.5);
    scaleRef.current = newScale;
    setScale(newScale);
    onTransformChange(placed.id, posRef.current.x, posRef.current.y, newScale);
  };

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        styles.placedSticker,
        {
          left: pos.x - scaledSize / 2,
          top: pos.y - scaledSize / 2,
          width: scaledSize,
          height: scaledSize,
        },
      ]}
    >
      {sticker.type === 'icon' && sticker.icon ? (
        <MaterialCommunityIcons
          name={sticker.icon as any}
          size={scaledSize}
          color={sticker.iconColor || '#FFF'}
        />
      ) : sticker.image ? (
        <Image
          source={sticker.image}
          style={{ width: scaledSize, height: scaledSize }}
          resizeMode="contain"
        />
      ) : null}
      {/* Resize & remove buttons (hidden during capture) */}
      {!hideControls && (
        <View style={styles.stickerControlsRow}>
          <Pressable style={styles.stickerControlBtn} onPress={shrink} hitSlop={6}>
            <MaterialCommunityIcons name="minus-circle" size={18} color="#FFF" />
          </Pressable>
          <Pressable style={styles.stickerControlBtn} onPress={grow} hitSlop={6}>
            <MaterialCommunityIcons name="plus-circle" size={18} color="#FFF" />
          </Pressable>
          <Pressable style={styles.stickerControlBtn} onPress={() => onRemove(placed.id)} hitSlop={6}>
            <MaterialCommunityIcons name="close-circle" size={18} color="#FF4444" />
          </Pressable>
        </View>
      )}
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
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const captureViewShotRef = useRef<ViewShot>(null);
  const onPhotoReadyRef = useRef<(() => void) | null>(null);
  let stickerCounter = useRef(0);

  // Track sticker transforms (position + scale) in a ref to avoid re-renders
  const stickerTransformsRef = useRef<Map<string, StickerTransform>>(new Map());

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

  const handleTransformChange = useCallback(
    (id: string, x: number, y: number, scale: number) => {
      stickerTransformsRef.current.set(id, { x, y, scale });
    },
    []
  );

  const addSticker = useCallback((sticker: CameraSticker) => {
    stickerCounter.current += 1;
    const id = `${sticker.id}-${stickerCounter.current}`;
    const newPlaced: PlacedSticker = {
      id,
      sticker,
      x: SCREEN_WIDTH / 2,
      y: CAMERA_HEIGHT / 2,
      scale: 1,
    };
    stickerTransformsRef.current.set(id, {
      x: SCREEN_WIDTH / 2,
      y: CAMERA_HEIGHT / 2,
      scale: 1,
    });
    setPlacedStickers((prev) => [...prev, newPlaced]);
  }, []);

  const removeSticker = useCallback((id: string) => {
    stickerTransformsRef.current.delete(id);
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearStickers = useCallback(() => {
    stickerTransformsRef.current.clear();
    setPlacedStickers([]);
  }, []);

  // Render frame overlay (shared between live view and capture view)
  const renderFrameOverlay = () => {
    if (currentFrame.id === 'none') return null;
    return (
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
    );
  };

  // Render static (non-draggable) stickers for the capture view
  const renderStaticStickers = () => {
    return placedStickers.map((placed) => {
      const transform = stickerTransformsRef.current.get(placed.id);
      if (!transform) return null;
      const scaledSize = placed.sticker.size * transform.scale;
      return (
        <View
          key={placed.id}
          style={{
            position: 'absolute',
            left: transform.x - scaledSize / 2,
            top: transform.y - scaledSize / 2,
            width: scaledSize,
            height: scaledSize,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {placed.sticker.type === 'icon' && placed.sticker.icon ? (
            <MaterialCommunityIcons
              name={placed.sticker.icon as any}
              size={scaledSize}
              color={placed.sticker.iconColor || '#FFF'}
            />
          ) : placed.sticker.image ? (
            <Image
              source={placed.sticker.image}
              style={{ width: scaledSize, height: scaledSize }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      );
    });
  };

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
      // 1. Take photo from camera native surface
      const photo = await cameraRef.current?.takePictureAsync();
      if (!photo?.uri) throw new Error('No photo captured');

      const hasOverlays = currentFrame.id !== 'none' || placedStickers.length > 0;

      if (!hasOverlays) {
        // No overlays: save raw photo directly (bypasses ViewShot entirely)
        await MediaLibrary.saveToLibraryAsync(photo.uri);
        setLastPhoto(photo.uri);
        setTimeout(() => setLastPhoto(null), 2000);
      } else {
        // Has overlays: composite with ViewShot
        // 2. Show captured photo in separate capture ViewShot, wait for Image to load
        await new Promise<void>((resolve) => {
          onPhotoReadyRef.current = resolve;
          setCapturedPhoto(photo.uri);
        });

        // 3. Wait for rendering to fully complete
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setTimeout(resolve, 100);
            });
          });
        });

        // 4. Capture the SEPARATE ViewShot (never contained a CameraView)
        if (captureViewShotRef.current?.capture) {
          const compositeUri = await captureViewShotRef.current.capture();
          await MediaLibrary.saveToLibraryAsync(compositeUri);
          setLastPhoto(compositeUri);
          setTimeout(() => setLastPhoto(null), 2000);
        }
      }
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert('Erreur', 'Impossible de prendre la photo. Réessaye.');
    } finally {
      setCapturedPhoto(null);
      onPhotoReadyRef.current = null;
      setCapturing(false);
    }
  }, [capturing, mediaPermission, requestMediaPermission, currentFrame, placedStickers.length]);

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

      {/* Camera live preview (NO ViewShot — SurfaceView can't be captured) */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mirror={facing === 'front'}
        />

        {/* Frame overlay (live) */}
        {renderFrameOverlay()}

        {/* Draggable stickers (interactive, live) */}
        {placedStickers.map((placed) => (
          <DraggableSticker
            key={placed.id}
            placed={placed}
            onRemove={removeSticker}
            onTransformChange={handleTransformChange}
            hideControls={capturing}
          />
        ))}
      </View>

      {/*
        CAPTURE ViewShot — rendered ON TOP of the camera only during capture.
        This ViewShot NEVER contained a CameraView/SurfaceView, so PixelCopy
        will reliably capture the Image + overlays.
      */}
      {capturedPhoto && (
        <ViewShot
          ref={captureViewShotRef}
          options={{ format: 'jpg', quality: 0.9 }}
          style={styles.captureViewShot}
          // @ts-ignore — ensures Android keeps this View in native hierarchy
          collapsable={false}
        >
          <Image
            source={{ uri: capturedPhoto }}
            style={{ width: SCREEN_WIDTH, height: CAMERA_HEIGHT }}
            resizeMode="cover"
            onLoad={() => onPhotoReadyRef.current?.()}
          />
          {/* Frame overlay (static copy) */}
          {renderFrameOverlay()}
          {/* Static stickers at their current tracked positions */}
          {renderStaticStickers()}
        </ViewShot>
      )}

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

  // Capture ViewShot (positioned on top of camera, only during capture)
  captureViewShot: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: CAMERA_HEIGHT,
    // offset to match camera container position (header height)
    marginTop: Spacing.xl + Spacing.xs + 44,
    overflow: 'hidden',
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
  stickerControlsRow: {
    position: 'absolute',
    top: -10,
    right: -10,
    flexDirection: 'row',
    gap: 4,
  },
  stickerControlBtn: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
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
