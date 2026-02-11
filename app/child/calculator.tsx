/**
 * Kid-Friendly Calculator - MuslimGuard
 * Simple calculator with colorful buttons for children
 */

import React, { useState } from 'react';
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
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_GAP = 12;
const BUTTON_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - BUTTON_GAP * 3) / 4;

type Operator = '+' | '-' | 'x' | '/' | null;

export default function CalculatorScreen() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleOperator = (op: Operator) => {
    const current = parseFloat(display);

    if (previousValue !== null && !waitingForOperand) {
      const result = calculate(previousValue, current, operator);
      setDisplay(formatResult(result));
      setPreviousValue(result);
    } else {
      setPreviousValue(current);
    }

    setOperator(op);
    setWaitingForOperand(true);
  };

  const calculate = (a: number, b: number, op: Operator): number => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case 'x': return a * b;
      case '/': return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const formatResult = (num: number): string => {
    if (Number.isInteger(num)) return String(num);
    // Limit decimals to 8 digits
    const str = num.toFixed(8);
    // Remove trailing zeros
    return parseFloat(str).toString();
  };

  const handleEquals = () => {
    if (previousValue === null || operator === null) return;
    const current = parseFloat(display);
    const result = calculate(previousValue, current, operator);
    setDisplay(formatResult(result));
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleDelete = () => {
    if (display.length === 1 || (display.length === 2 && display[0] === '-')) {
      setDisplay('0');
    } else {
      setDisplay(display.slice(0, -1));
    }
  };

  const handleDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    setDisplay(formatResult(current / 100));
  };

  // Button colors for kid-friendly look
  const numColor = '#FFFFFF';
  const numTextColor = Colors.light.text;
  const opColor = '#DBEAFE';
  const opTextColor = '#2563EB';
  const equalsColor = Colors.primary;
  const equalsTextColor = '#FFFFFF';
  const clearColor = '#FEE2E2';
  const clearTextColor = '#DC2626';
  const funcColor = '#F3F4F6';
  const funcTextColor = '#6B7280';

  const renderButton = (
    label: string,
    onPress: () => void,
    bgColor: string,
    textColor: string,
    wide?: boolean,
    icon?: string,
  ) => (
    <Pressable
      key={label}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bgColor },
        wide && styles.buttonWide,
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
    >
      {icon ? (
        <MaterialCommunityIcons name={icon as any} size={28} color={textColor} />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }, label.length > 1 && styles.buttonTextSmall]}>
          {label}
        </Text>
      )}
    </Pressable>
  );

  // Limit display font size for long numbers
  const displayFontSize = display.length > 12 ? 32 : display.length > 8 ? 40 : 52;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <Text style={styles.title}>Calculatrice</Text>
        <View style={styles.backButton} />
      </View>

      {/* Display */}
      <View style={styles.displayContainer}>
        {previousValue !== null && operator && (
          <Text style={styles.operationText}>
            {formatResult(previousValue)} {operator}
          </Text>
        )}
        <Text
          style={[styles.displayText, { fontSize: displayFontSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {display}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {renderButton('C', handleClear, clearColor, clearTextColor)}
          {renderButton('%', handlePercent, funcColor, funcTextColor)}
          {renderButton('', handleDelete, funcColor, funcTextColor, false, 'backspace-outline')}
          {renderButton('/', () => handleOperator('/'), opColor, opTextColor)}
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {renderButton('7', () => handleNumber('7'), numColor, numTextColor)}
          {renderButton('8', () => handleNumber('8'), numColor, numTextColor)}
          {renderButton('9', () => handleNumber('9'), numColor, numTextColor)}
          {renderButton('x', () => handleOperator('x'), opColor, opTextColor)}
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          {renderButton('4', () => handleNumber('4'), numColor, numTextColor)}
          {renderButton('5', () => handleNumber('5'), numColor, numTextColor)}
          {renderButton('6', () => handleNumber('6'), numColor, numTextColor)}
          {renderButton('-', () => handleOperator('-'), opColor, opTextColor)}
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          {renderButton('1', () => handleNumber('1'), numColor, numTextColor)}
          {renderButton('2', () => handleNumber('2'), numColor, numTextColor)}
          {renderButton('3', () => handleNumber('3'), numColor, numTextColor)}
          {renderButton('+', () => handleOperator('+'), opColor, opTextColor)}
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          {renderButton('0', () => handleNumber('0'), numColor, numTextColor, true)}
          {renderButton('.', handleDecimal, numColor, numTextColor)}
          {renderButton('=', handleEquals, equalsColor, equalsTextColor)}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Display
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  operationText: {
    fontSize: 20,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.xs,
  },
  displayText: {
    fontWeight: '700',
    color: Colors.light.text,
  },

  // Buttons
  buttonsContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: BUTTON_GAP,
  },
  row: {
    flexDirection: 'row',
    gap: BUTTON_GAP,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE * 0.75,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  buttonWide: {
    width: BUTTON_SIZE * 2 + BUTTON_GAP,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.96 }],
  },
  buttonText: {
    fontSize: 26,
    fontWeight: '600',
  },
  buttonTextSmall: {
    fontSize: 20,
  },
});
