/**
 * Arabic Letter Tracing - MuslimGuard
 * Kid-friendly screen to learn writing Arabic letters by tracing
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
import * as Speech from 'expo-speech';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { ARABIC_ALPHABET, ArabicLetter } from '@/constants/arabic-alphabet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - Spacing.lg * 2;

// Tracing pen colors
const PEN_COLORS = [
  '#2563EB', // blue
  '#059669', // green
  '#DC2626', // red
  '#7C3AED', // purple
  '#EA580C', // orange
];

interface TracePath {
  path: SkPath;
  color: string;
}

export default function ArabicTracingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [paths, setPaths] = useState<TracePath[]>([]);
  const [penColor, setPenColor] = useState(PEN_COLORS[0]);
  const currentPathRef = useRef<SkPath | null>(null);

  const letter: ArabicLetter = ARABIC_ALPHABET[currentIndex];
  const progress = `${currentIndex + 1} / ${ARABIC_ALPHABET.length}`;

  const speakLetter = useCallback(() => {
    Speech.stop();
    Speech.speak(letter.letter, { language: 'ar', rate: 0.7 });
  }, [letter.letter]);

  const handleTouchStart = useCallback((x: number, y: number) => {
    const path = Skia.Path.Make();
    path.moveTo(x, y);
    currentPathRef.current = path;
    setPaths((prev) => [...prev, { path, color: penColor }]);
  }, [penColor]);

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
      Speech.speak(ARABIC_ALPHABET[newIndex].letter, { language: 'ar', rate: 0.7 });
    }
  };

  const handleNext = () => {
    if (currentIndex < ARABIC_ALPHABET.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      handleClear();
      Speech.stop();
      Speech.speak(ARABIC_ALPHABET[newIndex].letter, { language: 'ar', rate: 0.7 });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.headerBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Alphabet Arabe</Text>
          <Text style={styles.progress}>{progress}</Text>
        </View>
        <Pressable style={styles.headerBtn} onPress={handleClear}>
          <MaterialCommunityIcons name="eraser-variant" size={22} color="#DC2626" />
        </Pressable>
      </View>

      {/* Letter info */}
      <View style={styles.letterInfo}>
        <View style={styles.letterNameRow}>
          <Text style={styles.letterName}>{letter.name}</Text>
          <Pressable style={styles.soundButton} onPress={speakLetter}>
            <MaterialCommunityIcons name="volume-high" size={22} color={Colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.letterHint}>{letter.frenchHint}</Text>
      </View>

      {/* Tracing canvas area */}
      <View style={styles.canvasWrapper}>
        {/* Guide letter behind canvas */}
        <View style={styles.guideLetterContainer} pointerEvents="none">
          <Text style={styles.guideLetter}>{letter.letter}</Text>
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
                strokeWidth={14}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
          </Canvas>
        </View>

        {/* Trace hint */}
        {paths.length === 0 && (
          <View style={styles.hintOverlay} pointerEvents="none">
            <MaterialCommunityIcons name="gesture" size={28} color="#94A3B8" />
            <Text style={styles.hintText}>Trace la lettre avec ton doigt !</Text>
          </View>
        )}
      </View>

      {/* Pen color selector */}
      <View style={styles.penRow}>
        {PEN_COLORS.map((color) => (
          <Pressable
            key={color}
            style={[
              styles.penButton,
              { backgroundColor: color },
              penColor === color && styles.penButtonSelected,
            ]}
            onPress={() => setPenColor(color)}
          >
            {penColor === color && (
              <MaterialCommunityIcons name="check" size={16} color="#FFF" />
            )}
          </Pressable>
        ))}
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

        {/* Current letter badge */}
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeLetter}>{letter.letter}</Text>
        </View>

        <Pressable
          style={[
            styles.navButton,
            currentIndex === ARABIC_ALPHABET.length - 1 && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === ARABIC_ALPHABET.length - 1}
        >
          <Text
            style={[
              styles.navText,
              currentIndex === ARABIC_ALPHABET.length - 1 && styles.navTextDisabled,
            ]}
          >
            Suivant
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={
              currentIndex === ARABIC_ALPHABET.length - 1 ? '#CBD5E1' : Colors.primary
            }
          />
        </Pressable>
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
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
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

  // Letter info
  letterInfo: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  letterNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  letterName: {
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
  letterHint: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },

  // Canvas
  canvasWrapper: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    alignSelf: 'center',
    borderRadius: BorderRadius.xl,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  guideLetterContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideLetter: {
    fontSize: CANVAS_SIZE * 0.65,
    color: '#E2E8F0',
    fontWeight: '300',
  },
  canvasOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  canvas: {
    flex: 1,
  },
  hintOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 4,
  },
  hintText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Pen colors
  penRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  penButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  penButtonSelected: {
    borderColor: '#FFFFFF',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentBadgeLetter: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
