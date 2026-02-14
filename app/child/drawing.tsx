/**
 * Kid-Friendly Drawing / Coloriage - MuslimGuard
 * Touch canvas with colorful palette using react-native-skia
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, Path, Skia, SkPath } from '@shopify/react-native-skia';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { COLORING_PAGES, ColoringPage } from '@/constants/coloring-pages';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLORING_ITEM_SIZE = Math.floor((SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3);

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
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const [selectedColoring, setSelectedColoring] = useState<ColoringPage | null>(null);
  const [showColoringSheet, setShowColoringSheet] = useState(false);

  const hasColoringPages = COLORING_PAGES.length > 0;

  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const handleSelectColoring = (page: ColoringPage | null) => {
    setSelectedColoring(page);
    setPaths([]);
    currentPathRef.current = null;
    setShowColoringSheet(false);
  };

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
      <View style={styles.canvasContainer}>
        {/* Background coloring image */}
        {selectedColoring && (
          <View style={styles.coloringBgContainer} pointerEvents="none">
            <Image
              source={selectedColoring.source}
              style={styles.coloringBgImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Touch canvas overlay */}
        <View
          style={selectedColoring ? styles.canvasOverlay : styles.canvas}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            canvasSizeRef.current = { width, height };
          }}
          onTouchStart={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            const { width, height } = canvasSizeRef.current;
            if (width === 0) return;
            handleTouchStart(clamp(locationX, 0, width), clamp(locationY, 0, height));
          }}
          onTouchMove={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            const { width, height } = canvasSizeRef.current;
            if (width === 0) return;
            const x = clamp(locationX, 0, width);
            const y = clamp(locationY, 0, height);
            // If finger is outside bounds, stop the stroke
            if (locationX < -10 || locationX > width + 10 || locationY < -10 || locationY > height + 10) {
              handleTouchEnd();
              return;
            }
            handleTouchMove(x, y);
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

        {/* Coloring pages button */}
        {hasColoringPages && (
          <View style={styles.coloringButtonRow}>
            <Pressable
              style={[
                styles.coloringButton,
                selectedColoring && styles.coloringButtonActive,
              ]}
              onPress={() => setShowColoringSheet(true)}
            >
              <MaterialCommunityIcons
                name="image-outline"
                size={20}
                color={selectedColoring ? '#FFFFFF' : Colors.primary}
              />
              <Text style={[
                styles.coloringButtonText,
                selectedColoring && styles.coloringButtonTextActive,
              ]}>
                {selectedColoring ? selectedColoring.label : 'Coloriages'}
              </Text>
            </Pressable>
            {selectedColoring && (
              <Pressable
                style={styles.coloringClearButton}
                onPress={() => handleSelectColoring(null)}
              >
                <MaterialCommunityIcons name="close" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        )}

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

      {/* Coloring pages bottom sheet */}
      <Modal
        visible={showColoringSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowColoringSheet(false)}
      >
        <Pressable
          style={styles.sheetOverlay}
          onPress={() => setShowColoringSheet(false)}
        />
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Choisir un coloriage</Text>
          <ScrollView
            contentContainerStyle={styles.sheetGrid}
            showsVerticalScrollIndicator={false}
          >
            {COLORING_PAGES.map((page) => (
              <Pressable
                key={page.id}
                style={[
                  styles.sheetItem,
                  selectedColoring?.id === page.id && styles.sheetItemSelected,
                ]}
                onPress={() => handleSelectColoring(page)}
              >
                <Image
                  source={page.source}
                  style={styles.sheetItemImage}
                  resizeMode="contain"
                />
                <Text
                  style={[
                    styles.sheetItemLabel,
                    selectedColoring?.id === page.id && styles.sheetItemLabelSelected,
                  ]}
                  numberOfLines={1}
                >
                  {page.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
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

  // Background coloring image
  coloringBgContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  coloringBgImage: {
    width: '90%',
    height: '90%',
    opacity: 0.25,
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // Coloring pages button
  coloringButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  coloringButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: '#DBEAFE',
    gap: Spacing.xs,
  },
  coloringButtonActive: {
    backgroundColor: Colors.primary,
  },
  coloringButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  coloringButtonTextActive: {
    color: '#FFFFFF',
  },
  coloringClearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Bottom sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    maxHeight: SCREEN_HEIGHT * 0.45,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  sheetItem: {
    width: COLORING_ITEM_SIZE,
    height: COLORING_ITEM_SIZE + 20,
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  sheetItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#DBEAFE',
  },
  sheetItemImage: {
    width: COLORING_ITEM_SIZE - Spacing.xs * 2 - 4,
    height: COLORING_ITEM_SIZE - Spacing.xs * 2 - 4,
    borderRadius: BorderRadius.sm,
  },
  sheetItemLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  sheetItemLabelSelected: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
