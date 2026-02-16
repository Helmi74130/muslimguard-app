/**
 * Calligraphy Workshop - MuslimGuard
 * Trace sacred Arabic words over calligraphy guides
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Speech from 'expo-speech';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { CALLIGRAPHY_MODELS, CalligraphyModel } from '@/constants/calligraphy-models';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - Spacing.lg * 2;

// Ink colors for calligraphy
const INK_COLORS = [
  { color: '#1B1B1B', label: 'Encre noire' },
  { color: '#1E3A5F', label: 'Encre bleue' },
  { color: '#5C2D0A', label: 'Encre marron' },
  { color: '#0E6B3A', label: 'Encre verte' },
  { color: '#8B0000', label: 'Encre rouge' },
];

const BRUSH_SIZES = [
  { size: 4, label: 'Fin' },
  { size: 10, label: 'Moyen' },
  { size: 18, label: 'Gros' },
];

interface TracePath {
  path: SkPath;
  color: string;
  strokeWidth: number;
}

export default function CalligraphyScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paths, setPaths] = useState<TracePath[]>([]);
  const [inkColor, setInkColor] = useState(INK_COLORS[0].color);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const currentPathRef = useRef<SkPath | null>(null);
  const [saving, setSaving] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  const model: CalligraphyModel = CALLIGRAPHY_MODELS[currentIndex];
  const progress = `${currentIndex + 1} / ${CALLIGRAPHY_MODELS.length}`;

  const speakWord = useCallback(() => {
    Speech.stop();
    Speech.speak(model.arabic, { language: 'ar', rate: 0.6, pitch: 0.8 });
  }, [model.arabic]);

  const handleSave = useCallback(async () => {
    if (paths.length === 0 || saving) return;
    setSaving(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission requise', 'Autorise l\'accès à la galerie pour sauvegarder.');
        setSaving(false);
        return;
      }
      const uri = await (viewShotRef.current as any).capture();
      await MediaLibrary.saveToLibraryAsync(uri);
      Alert.alert('Sauvegardé !', 'Ta calligraphie a été enregistrée dans la galerie.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder la calligraphie.');
    } finally {
      setSaving(false);
    }
  }, [paths.length, saving]);

  const handleTouchStart = useCallback((x: number, y: number) => {
    const path = Skia.Path.Make();
    path.moveTo(x, y);
    currentPathRef.current = path;
    setPaths((prev) => [...prev, { path, color: inkColor, strokeWidth: brushSize }]);
  }, [inkColor, brushSize]);

  const handleTouchMove = useCallback((x: number, y: number) => {
    if (currentPathRef.current) {
      currentPathRef.current.lineTo(x, y);
      setPaths((prev) => [...prev]);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    currentPathRef.current = null;
  }, []);

  const handleClear = () => {
    setPaths([]);
    currentPathRef.current = null;
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      handleClear();
      Speech.stop();
      Speech.speak(CALLIGRAPHY_MODELS[newIndex].arabic, { language: 'ar', rate: 0.6, pitch: 0.8 });
    }
  };

  const handleNext = () => {
    if (currentIndex < CALLIGRAPHY_MODELS.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      handleClear();
      Speech.stop();
      Speech.speak(CALLIGRAPHY_MODELS[newIndex].arabic, { language: 'ar', rate: 0.6, pitch: 0.8 });
    }
  };

  // Dynamic font size based on word length
  const guideFontSize = model.arabic.length > 10
    ? CANVAS_SIZE * 0.12
    : model.arabic.length > 4
      ? CANVAS_SIZE * 0.25
      : CANVAS_SIZE * 0.45;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Calligraphie</Text>
          <Text style={styles.progress}>{progress}</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.headerBtn, paths.length > 0 && styles.saveButtonActive]}
            onPress={handleSave}
            disabled={paths.length === 0 || saving}
          >
            <MaterialCommunityIcons
              name="content-save"
              size={22}
              color={paths.length > 0 ? '#22C55E' : '#CBD5E1'}
            />
          </Pressable>
          <Pressable style={styles.headerBtn} onPress={handleClear}>
            <MaterialCommunityIcons name="eraser-variant" size={22} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* Model info */}
      <View style={styles.modelInfo}>
        <View style={styles.modelNameRow}>
          <Text style={styles.modelName}>{model.name}</Text>
          <Pressable style={styles.soundButton} onPress={speakWord}>
            <MaterialCommunityIcons name="volume-high" size={22} color={Colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.modelTranslation} numberOfLines={2}>{model.translation}</Text>
      </View>

      {/* Canvas */}
      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.canvasWrapper}>
        {/* Guide: image or text fallback */}
        <View style={styles.guideContainer} pointerEvents="none">
          {model.image ? (
            <Image
              source={model.image}
              style={styles.guideImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={[styles.guideText, { fontSize: guideFontSize }]}>
              {model.arabic}
            </Text>
          )}
        </View>

        {/* Touch canvas overlay */}
        <View
          style={styles.canvasOverlay}
          onTouchStart={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            handleTouchStart(locationX, locationY);
          }}
          onTouchMove={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            handleTouchMove(locationX, locationY);
          }}
          onTouchEnd={handleTouchEnd}
        >
          <Canvas style={styles.canvas}>
            {paths.map((p, index) => (
              <Path
                key={index}
                path={p.path}
                color={p.color}
                style="stroke"
                strokeWidth={p.strokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
          </Canvas>
        </View>

        {/* Hint */}
        {paths.length === 0 && (
          <View style={styles.hintOverlay} pointerEvents="none">
            <MaterialCommunityIcons name="gesture" size={24} color="#94A3B8" />
            <Text style={styles.hintText}>Trace par-dessus le modèle</Text>
          </View>
        )}
      </ViewShot>

      {/* Brush size + Ink color */}
      <View style={styles.toolbarRow}>
        {/* Brush sizes */}
        <View style={styles.brushRow}>
          {BRUSH_SIZES.map((b) => (
            <Pressable
              key={b.size}
              style={[
                styles.brushButton,
                brushSize === b.size && styles.brushButtonSelected,
              ]}
              onPress={() => setBrushSize(b.size)}
            >
              <View
                style={[
                  styles.brushDot,
                  {
                    width: b.size + 6,
                    height: b.size + 6,
                    borderRadius: (b.size + 6) / 2,
                    backgroundColor: brushSize === b.size ? Colors.primary : '#94A3B8',
                  },
                ]}
              />
              <Text style={[styles.brushLabel, brushSize === b.size && styles.brushLabelSelected]}>
                {b.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Ink colors */}
        <View style={styles.inkRow}>
          {INK_COLORS.map((ink) => (
            <Pressable
              key={ink.color}
              style={[
                styles.inkButton,
                { backgroundColor: ink.color },
                inkColor === ink.color && styles.inkButtonSelected,
              ]}
              onPress={() => setInkColor(ink.color)}
            >
              {inkColor === ink.color && (
                <MaterialCommunityIcons name="check" size={14} color="#FFF" />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.navigation}>
        <Pressable
          style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={currentIndex === 0 ? '#CBD5E1' : Colors.primary}
          />
          <Text style={[styles.navText, currentIndex === 0 && styles.navTextDisabled]}>
            Précédent
          </Text>
        </Pressable>

        <View style={styles.currentBadge}>
          <MaterialCommunityIcons name="fountain-pen-tip" size={24} color="#FFF" />
        </View>

        <Pressable
          style={[
            styles.navButton,
            currentIndex === CALLIGRAPHY_MODELS.length - 1 && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === CALLIGRAPHY_MODELS.length - 1}
        >
          <Text
            style={[
              styles.navText,
              currentIndex === CALLIGRAPHY_MODELS.length - 1 && styles.navTextDisabled,
            ]}
          >
            Suivant
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={currentIndex === CALLIGRAPHY_MODELS.length - 1 ? '#CBD5E1' : Colors.primary}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF8F0',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  saveButtonActive: {
    backgroundColor: '#ECFDF5',
  },
  headerCenter: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  progress: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Model info
  modelInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  modelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modelName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.light.text,
  },
  soundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modelTranslation: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },

  // Canvas
  canvasWrapper: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    alignSelf: 'center',
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFFBF2',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: '#F0E6D4',
  },
  guideContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  guideImage: {
    width: '85%',
    height: '85%',
    opacity: 0.15,
    tintColor: '#8B7355',
  },
  guideText: {
    color: '#D4C5A9',
    fontWeight: '300',
    textAlign: 'center',
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
  hintOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Toolbar
  toolbarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },

  // Brush sizes
  brushRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brushButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0E6D4',
  },
  brushButtonSelected: {
    backgroundColor: '#DBEAFE',
    borderColor: Colors.primary,
  },
  brushDot: {
    backgroundColor: '#94A3B8',
  },
  brushLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  brushLabelSelected: {
    color: Colors.primary,
  },

  // Ink colors
  inkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inkButtonSelected: {
    borderColor: '#F0E6D4',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    transform: [{ scale: 1.15 }],
  },

  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  navTextDisabled: {
    color: '#CBD5E1',
  },
  currentBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
