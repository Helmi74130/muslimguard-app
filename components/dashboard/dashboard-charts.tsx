
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { HistoryEntry } from '@/types/storage.types';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import React, { useMemo } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_HEIGHT = 180;
const DONUT_SIZE = 120;
const STROKE_WIDTH = 12;

interface DashboardChartsProps {
  history: HistoryEntry[];
}

export const DashboardCharts = ({ history }: DashboardChartsProps) => {
  // --- Data Processing for Bar Chart (Weekly Activity) ---
  const weeklyData = useMemo(() => {
    const days = ['Di', 'Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa'];
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      return d;
    });

    const data = last7Days.map((date, i) => {
      const startOfDay = new Date(date).setHours(0, 0, 0, 0);
      const endOfDay = new Date(date).setHours(23, 59, 59, 999);

      const count = history.filter(
        (h) => h.timestamp >= startOfDay && h.timestamp <= endOfDay
      ).length;

      return {
        day: days[date.getDay()],
        count,
        isToday: i === 6,
      };
    });

    const maxCount = Math.max(...data.map((d) => d.count), 5); // Minimum 5 to avoid div/0
    return { data, maxCount };
  }, [history]);

  // --- Data Processing for Donut Chart (Block Rate Today) ---
  const blockStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTs = today.getTime();

    const todayHistory = history.filter((h) => h.timestamp >= todayTs);
    const total = todayHistory.length;
    const blocked = todayHistory.filter((h) => h.wasBlocked).length;
    const rate = total === 0 ? 0 : blocked / total;

    return { total, blocked, rate };
  }, [history]);

  // --- Skia Donut Path ---
  const donutPath = useMemo(() => {
    const radius = (DONUT_SIZE - STROKE_WIDTH) / 2;
    const center = DONUT_SIZE / 2;
    const path = Skia.Path.Make();
    path.addCircle(center, center, radius);
    return path;
  }, []);

  const progressPath = useMemo(() => {
    const radius = (DONUT_SIZE - STROKE_WIDTH) / 2;
    const center = DONUT_SIZE / 2;
    const path = Skia.Path.Make();
    // Start from top (-90 deg)
    const startAngle = -Math.PI / 2;
    const sweepAngle = blockStats.rate * 2 * Math.PI;

    path.addArc(
      { x: center - radius, y: center - radius, width: radius * 2, height: radius * 2 },
      (startAngle * 180) / Math.PI,
      (sweepAngle * 180) / Math.PI
    );
    return path;
  }, [blockStats.rate]);

  return (
    <View style={styles.container}>
      {/* 1. Bar Chart Section */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Activité sur 7 jours</Text>
        <View style={styles.barChartContainer}>
          {weeklyData.data.map((item, index) => {
            const height = (item.count / weeklyData.maxCount) * 100; // In percentage of container
            return (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        height: `${height}%`,
                        backgroundColor: item.isToday ? Colors.primary : Colors.primary + '60'
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.barLabel, item.isToday && styles.barLabelToday]}>
                  {item.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* 2. Donut Chart Section (Blocked Today) */}
      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardTitle}>Taux de blocage (Auj.)</Text>
          <View style={styles.donutContainer}>
            <Canvas style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
              {/* Background Circle */}
              <Path
                path={donutPath}
                color={Colors.light.border}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                strokeCap="round"
              />
              {/* Progress Circle */}
              <Path
                path={progressPath}
                color={Colors.error}
                style="stroke"
                strokeWidth={STROKE_WIDTH}
                strokeCap="round"
              />
            </Canvas>
            <View style={styles.donutTextContainer}>
              <Text style={styles.donutPercentage}>
                {Math.round(blockStats.rate * 100)}%
              </Text>
            </View>
          </View>
          <Text style={styles.donutSubtitle}>
            {blockStats.blocked} bloqués / {blockStats.total} visites
          </Text>
        </View>

        {/* 3. Simple Stats (Visits Today) */}
        <View style={[styles.card, styles.halfCard, styles.centerContent]}>
          <Text style={styles.cardTitle}>Visites (Auj.)</Text>
          <Text style={styles.bigStat}>{blockStats.total}</Text>
          <View style={styles.statTag}>
            <Text style={styles.statTagText}>
              {weeklyData.data[6].count > weeklyData.data[5].count ? '↗ + ' : '↘ '}
              {Math.abs(weeklyData.data[6].count - weeklyData.data[5].count)} vs hier
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  halfCard: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },

  // Bar Chart
  barChartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 120,
    paddingTop: Spacing.sm,
  },
  barWrapper: {
    alignItems: 'center',
    width: '12%',
    height: '100%',
  },
  barTrack: {
    flex: 1,
    width: 6,
    backgroundColor: Colors.light.background,
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  barLabel: {
    marginTop: Spacing.xs,
    fontSize: 10,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  barLabelToday: {
    color: Colors.primary,
    fontWeight: '700',
  },

  // Donut Chart
  donutContainer: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  donutTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutPercentage: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  donutSubtitle: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.light.textSecondary,
  },

  // Big Stat
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  bigStat: {
    fontSize: 42,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  statTag: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  statTagText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
});
