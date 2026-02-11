/**
 * PIN Input Component for MuslimGuard
 * Secure PIN entry with visual feedback
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Keyboard,
} from 'react-native';
import { Colors, BorderRadius, Spacing } from '@/constants/theme';

interface PinInputProps {
  length?: 4 | 6;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  label?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  secureEntry?: boolean;
}

export function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  error,
  label,
  autoFocus = true,
  disabled = false,
  secureEntry = true,
}: PinInputProps) {
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake animation on error
  useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const handleChange = (text: string) => {
    // Only allow digits
    const digits = text.replace(/[^0-9]/g, '').slice(0, length);
    onChange(digits);

    // Call onComplete when PIN is complete
    if (digits.length === length && onComplete) {
      onComplete(digits);
    }
  };

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const renderDots = () => {
    const dots = [];
    for (let i = 0; i < length; i++) {
      const isFilled = i < value.length;
      const isActive = i === value.length;

      dots.push(
        <View
          key={i}
          style={[
            styles.dot,
            isFilled && styles.dotFilled,
            isActive && styles.dotActive,
            error && styles.dotError,
          ]}
        >
          {isFilled && secureEntry && <View style={styles.dotInner} />}
          {isFilled && !secureEntry && (
            <Text style={styles.dotText}>{value[i]}</Text>
          )}
        </View>
      );
    }
    return dots;
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <Pressable onPress={handlePress} disabled={disabled}>
        <Animated.View
          style={[
            styles.dotsContainer,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {renderDots()}
        </Animated.View>
      </Pressable>

      <TextInput
        ref={inputRef}
        style={styles.hiddenInput}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        editable={!disabled}
        caretHidden
        contextMenuHidden
        selectTextOnFocus={false}
      />

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const DOT_SIZE = 56;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotFilled: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  dotActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  dotError: {
    borderColor: Colors.error,
  },
  dotInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  dotText: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.primary,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  error: {
    fontSize: 14,
    color: Colors.error,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

export default PinInput;
