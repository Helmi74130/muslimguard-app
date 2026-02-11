/**
 * Kid-Friendly Drawing / Coloriage - MuslimGuard
 * Touch canvas with colorful palette using react-native-skia
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Kid-friendly color palette
const PALETTE = [
  { color: '#1E1E1E', label: 'Noir' },
  { color: '#EF4444', label: 'Rouge' },
  { color: '#F97316', label: 'Orange' },
  { color: '#EAB308', label: 'Jaune' },
  { color: '#22C55E', label: 'Vert' },
  { color: '#3B82F6', label: 'Bleu' },
  { color: '#8B5CF6', label: 'Violet' },
  { color: '#EC4899', label: 'Rose' },
  { color: '#06B6D4', label: 'Cyan' },
  { color: '#A16207', label: 'Marron' },
];

const BRUSH_SIZES = [
  { size: 3, label: 'Fin' },
  { size: 8, label: 'Moyen' },
  { size: 16, label: 'Gros' },
];

const CANVAS_BG = '#FFFFFF';

interface DrawPath {
  path: SkPath;
  color: string;
  strokeWidth: number;
}

export default function DrawingScreen() {
  const [selectedColor, setSelectedColor] = useState(PALETTE[0].color);
  const [selectedSize, setSelectedSize] = useState(BRUSH_SIZES[1].size);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [isEraser, setIsEraser] = useState(false);
  const currentPathRef = useRef<SkPath | null>(null);

  const handleTouchStart = useCallback((x: number, y: number) => {
    const path = Skia.Path.Make();
    path.moveTo(x, y);
    currentPathRef.current = path;

    const drawColor = isEraser ? CANVAS_BG : selectedColor;
    const drawWidth = isEraser ? 24 : selectedSize;

    setPaths((prev) => [
      ...prev,
      { path, color: drawColor, strokeWidth: drawWidth },
    ]);
  }, [selectedColor, selectedSize, isEraser]);

  const handleTouchMove = useCallback((x: number, y: number) => {
    if (currentPathRef.current) {
      currentPathRef.current.lineTo(x, y);
      // Force re-render by creating new array ref
      setPaths((prev) => [...prev]);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    currentPathRef.current = null;
  }, []);

  const handleUndo = () => {
    setPaths((prev) => {
      if (prev.length === 0) return prev;
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setPaths([]);
    currentPathRef.current = null;
  };

  const toggleEraser = () => {
    setIsEraser((prev) => !prev);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.title}>Coloriage</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.headerButton} onPress={handleUndo}>
            <MaterialCommunityIcons name="undo" size={22} color={Colors.primary} />
          </Pressable>
          <Pressable style={styles.headerButton} onPress={handleClear}>
            <MaterialCommunityIcons name="delete-outline" size={22} color="#DC2626" />
          </Pressable>
        </View>
      </View>

      {/* Canvas */}
      <View
        style={styles.canvasContainer}
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

      {/* Toolbar */}
      <View style={styles.toolbar}>
        {/* Brush sizes */}
        <View style={styles.brushRow}>
          {BRUSH_SIZES.map((brush) => (
            <Pressable
              key={brush.size}
              style={[
                styles.brushButton,
                selectedSize === brush.size && !isEraser && styles.brushButtonSelected,
              ]}
              onPress={() => {
                setSelectedSize(brush.size);
                setIsEraser(false);
              }}
            >
              <View
                style={[
                  styles.brushDot,
                  {
                    width: brush.size + 8,
                    height: brush.size + 8,
                    borderRadius: (brush.size + 8) / 2,
                    backgroundColor: selectedSize === brush.size && !isEraser
                      ? Colors.primary
                      : '#94A3B8',
                  },
                ]}
              />
              <Text style={[
                styles.brushLabel,
                selectedSize === brush.size && !isEraser && styles.brushLabelSelected,
              ]}>
                {brush.label}
              </Text>
            </Pressable>
          ))}

          {/* Eraser */}
          <Pressable
            style={[
              styles.brushButton,
              isEraser && styles.eraserSelected,
            ]}
            onPress={toggleEraser}
          >
            <MaterialCommunityIcons
              name="eraser"
              size={20}
              color={isEraser ? '#FFFFFF' : '#94A3B8'}
            />
            <Text style={[
              styles.brushLabel,
              isEraser && { color: '#FFFFFF' },
            ]}>
              Gomme
            </Text>
          </Pressable>
        </View>

        {/* Color palette */}
        <View style={styles.paletteRow}>
          {PALETTE.map((item) => (
            <Pressable
              key={item.color}
              style={[
                styles.colorButton,
                { backgroundColor: item.color },
                selectedColor === item.color && !isEraser && styles.colorButtonSelected,
              ]}
              onPress={() => {
                setSelectedColor(item.color);
                setIsEraser(false);
              }}
            >
              {selectedColor === item.color && !isEraser && (
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={item.color === '#EAB308' || item.color === '#F97316' ? '#000' : '#FFF'}
                />
              )}
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F7FF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  headerButton: {
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Canvas
  canvasContainer: {
    flex: 1,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    backgroundColor: CANVAS_BG,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  canvas: {
    flex: 1,
  },

  // Toolbar
  toolbar: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },

  // Brush sizes
  brushRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  brushButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#FFFFFF',
    minWidth: 60,
    gap: 4,
  },
  brushButtonSelected: {
    backgroundColor: '#DBEAFE',
  },
  brushDot: {
    backgroundColor: '#94A3B8',
  },
  brushLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  brushLabelSelected: {
    color: Colors.primary,
  },
  eraserSelected: {
    backgroundColor: '#F97316',
  },

  // Color palette
  paletteRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    transform: [{ scale: 1.15 }],
  },
});
