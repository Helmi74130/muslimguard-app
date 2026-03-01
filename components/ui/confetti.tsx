/**
 * ConfettiOverlay - MuslimGuard
 * Reusable confetti burst animation using React Native Animated API.
 * Zero external dependencies.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COUNT = 35;
const CONFETTI_COLORS = ['#F59E0B', '#EF4444', '#8B5CF6', '#10B981', '#3B82F6', '#EC4899', '#6366F1', '#14B8A6'];
const CONFETTI_SHAPES = ['square', 'circle', 'strip'] as const;

interface ConfettiPiece {
  x: number;
  color: string;
  size: number;
  shape: typeof CONFETTI_SHAPES[number];
  delay: number;
  drift: number;
  rotation: number;
}

function generateConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, () => ({
    x: Math.random(),
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 6 + Math.random() * 8,
    shape: CONFETTI_SHAPES[Math.floor(Math.random() * CONFETTI_SHAPES.length)],
    delay: Math.random() * 400,
    drift: (Math.random() - 0.5) * 120,
    rotation: 360 + Math.random() * 720,
  }));
}

export function ConfettiOverlay() {
  const pieces = useRef(generateConfetti()).current;
  const anims = useRef(pieces.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = anims.map((anim, i) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 2000 + Math.random() * 1000,
        delay: pieces[i].delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    Animated.stagger(30, animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.map((piece, i) => {
        const translateY = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: [-20, SCREEN_HEIGHT + 40],
        });
        const translateX = anims[i].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, piece.drift * 0.6, piece.drift],
        });
        const rotate = anims[i].interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${piece.rotation}deg`],
        });
        const opacity = anims[i].interpolate({
          inputRange: [0, 0.1, 0.8, 1],
          outputRange: [0, 1, 1, 0],
        });

        const shapeStyle =
          piece.shape === 'circle'
            ? { borderRadius: piece.size / 2 }
            : piece.shape === 'strip'
              ? { width: piece.size * 0.4, height: piece.size * 1.8, borderRadius: 2 }
              : { borderRadius: 2 };

        return (
          <Animated.View
            key={i}
            style={[
              {
                position: 'absolute',
                left: piece.x * SCREEN_WIDTH,
                top: 0,
                width: piece.size,
                height: piece.size,
                backgroundColor: piece.color,
                transform: [{ translateY }, { translateX }, { rotate }],
                opacity,
              },
              shapeStyle,
            ]}
          />
        );
      })}
    </View>
  );
}
