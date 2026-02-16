/**
 * Kid-Friendly Stopwatch - MuslimGuard
 * Colorful stopwatch with laps for children
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

// Kid-friendly colors
const COLORS = {
  bg: '#F0F7FF',
  timerBg: '#FFFFFF',
  timerRing: '#DBEAFE',
  timerRingActive: '#60A5FA',
  start: '#4CAF50',
  startPressed: '#388E3C',
  pause: '#FF9800',
  pausePressed: '#F57C00',
  reset: '#EF5350',
  resetPressed: '#D32F2F',
  lap: '#42A5F5',
  lapPressed: '#1E88E5',
  lapEven: '#F0F7FF',
  lapOdd: '#FFFFFF',
  lapBest: '#E8F5E9',
  lapWorst: '#FFF3E0',
};

interface Lap {
  number: number;
  time: number;
}

export default function StopwatchScreen() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse animation when running
  useEffect(() => {
    if (running) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [running]);

  const start = useCallback(() => {
    startTimeRef.current = Date.now() - elapsed;
    intervalRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 16);
    setRunning(true);
  }, [elapsed]);

  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setRunning(false);
    setElapsed(0);
    setLaps([]);
  }, []);

  const addLap = useCallback(() => {
    const prevLapEnd = laps.length > 0 ? laps[0].time : 0;
    setLaps(prev => [{
      number: prev.length + 1,
      time: elapsed - prevLapEnd,
    }, ...prev]);
  }, [elapsed, laps]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Format time: MM:SS.cc
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return {
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
      centiseconds: String(centiseconds).padStart(2, '0'),
    };
  };

  const time = formatTime(elapsed);

  // Find best/worst lap times
  const lapTimes = laps.map(l => l.time);
  const bestLap = lapTimes.length >= 2 ? Math.min(...lapTimes) : -1;
  const worstLap = lapTimes.length >= 2 ? Math.max(...lapTimes) : -1;

  const formatLapTime = (ms: number) => {
    const t = formatTime(ms);
    return `${t.minutes}:${t.seconds}.${t.centiseconds}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="timer-outline" size={24} color={Colors.primary} />
          <Text style={styles.title}>Chronomètre</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      {/* Timer Display */}
      <View style={styles.timerSection}>
        <Animated.View style={[
          styles.timerCircle,
          running && { borderColor: COLORS.timerRingActive },
          { transform: [{ scale: pulseAnim }] },
        ]}>
          <View style={styles.timeRow}>
            <Text style={styles.timeDigits}>{time.minutes}</Text>
            <Text style={styles.timeSeparator}>:</Text>
            <Text style={styles.timeDigits}>{time.seconds}</Text>
            <Text style={styles.timeSeparatorSmall}>.</Text>
            <Text style={styles.timeCenti}>{time.centiseconds}</Text>
          </View>
          {laps.length > 0 && (
            <Text style={styles.lapCount}>
              Tour {laps.length}
            </Text>
          )}
        </Animated.View>
      </View>

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!running && elapsed === 0 ? (
          // Initial state: only Start
          <Pressable
            style={({ pressed }) => [
              styles.controlButton,
              styles.controlButtonLarge,
              { backgroundColor: pressed ? COLORS.startPressed : COLORS.start },
            ]}
            onPress={start}
          >
            <MaterialCommunityIcons name="play" size={40} color="#FFFFFF" />
            <Text style={styles.controlLabel}>Démarrer</Text>
          </Pressable>
        ) : running ? (
          // Running: Lap + Pause
          <View style={styles.controlsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                { backgroundColor: pressed ? COLORS.lapPressed : COLORS.lap },
              ]}
              onPress={addLap}
            >
              <MaterialCommunityIcons name="flag-variant" size={28} color="#FFFFFF" />
              <Text style={styles.controlLabel}>Tour</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                styles.controlButtonCenter,
                { backgroundColor: pressed ? COLORS.pausePressed : COLORS.pause },
              ]}
              onPress={pause}
            >
              <MaterialCommunityIcons name="pause" size={36} color="#FFFFFF" />
              <Text style={styles.controlLabel}>Pause</Text>
            </Pressable>
          </View>
        ) : (
          // Paused: Reset + Resume
          <View style={styles.controlsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                { backgroundColor: pressed ? COLORS.resetPressed : COLORS.reset },
              ]}
              onPress={reset}
            >
              <MaterialCommunityIcons name="refresh" size={28} color="#FFFFFF" />
              <Text style={styles.controlLabel}>Effacer</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.controlButton,
                styles.controlButtonCenter,
                { backgroundColor: pressed ? COLORS.startPressed : COLORS.start },
              ]}
              onPress={start}
            >
              <MaterialCommunityIcons name="play" size={36} color="#FFFFFF" />
              <Text style={styles.controlLabel}>Reprendre</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Laps List */}
      {laps.length > 0 && (
        <View style={styles.lapsSection}>
          <Text style={styles.lapsTitle}>Tours</Text>
          <FlatList
            data={laps}
            keyExtractor={(item) => String(item.number)}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => {
              const isBest = item.time === bestLap;
              const isWorst = item.time === worstLap;
              return (
                <View style={[
                  styles.lapRow,
                  index % 2 === 0 ? { backgroundColor: COLORS.lapEven } : { backgroundColor: COLORS.lapOdd },
                  isBest && { backgroundColor: COLORS.lapBest },
                  isWorst && { backgroundColor: COLORS.lapWorst },
                ]}>
                  <View style={styles.lapLeft}>
                    {isBest && <MaterialCommunityIcons name="trophy" size={16} color={Colors.success} />}
                    {isWorst && <MaterialCommunityIcons name="turtle" size={16} color="#FF9800" />}
                    <Text style={[
                      styles.lapNumber,
                      isBest && { color: Colors.success },
                      isWorst && { color: '#FF9800' },
                    ]}>
                      Tour {item.number}
                    </Text>
                  </View>
                  <Text style={[
                    styles.lapTime,
                    isBest && { color: Colors.success },
                    isWorst && { color: '#FF9800' },
                  ]}>
                    {formatLapTime(item.time)}
                  </Text>
                </View>
              );
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Timer
  timerSection: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  timerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.timerBg,
    borderWidth: 6,
    borderColor: COLORS.timerRing,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  timeDigits: {
    fontSize: 48,
    fontWeight: '700',
    color: Colors.light.text,
    fontVariant: ['tabular-nums'],
  },
  timeSeparator: {
    fontSize: 44,
    fontWeight: '700',
    color: Colors.primary,
    marginHorizontal: 2,
  },
  timeSeparatorSmall: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.primary,
    marginHorizontal: 1,
  },
  timeCenti: {
    fontSize: 32,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  lapCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginTop: Spacing.xs,
  },

  // Controls
  controls: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  controlButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  controlButtonLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  controlButtonCenter: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },

  // Laps
  lapsSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  lapsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  lapRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  lapLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  lapNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  lapTime: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    fontVariant: ['tabular-nums'],
  },
});
