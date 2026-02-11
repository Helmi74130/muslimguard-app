/**
 * Schedule Settings Screen - MuslimGuard
 * Manage time-based access restrictions
 */

import { Card } from '@/components/ui/card';
import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { StorageService } from '@/services/storage.service';
import { ScheduleRule } from '@/types/storage.types';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const t = translations.schedule;

const DAYS = [
  { key: 0, name: t.days.sunday },
  { key: 1, name: t.days.monday },
  { key: 2, name: t.days.tuesday },
  { key: 3, name: t.days.wednesday },
  { key: 4, name: t.days.thursday },
  { key: 5, name: t.days.friday },
  { key: 6, name: t.days.saturday },
];

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export default function ScheduleScreen() {
  const { isAvailable, requireFeature } = usePremiumFeature('schedule_restrictions');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);

  // Load schedule data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settings, schedule] = await Promise.all([
          StorageService.getSettings(),
          StorageService.getSchedule(),
        ]);
        setScheduleEnabled(settings.scheduleEnabled);

        // Initialize time slots for each day
        const initialSlots: TimeSlot[] = DAYS.map((day) => {
          const existingRule = schedule.rules.find(
            (r: ScheduleRule) => r.daysOfWeek.includes(day.key) && r.isAllowed
          );
          return {
            dayOfWeek: day.key,
            startTime: existingRule?.startTime || '08:00',
            endTime: existingRule?.endTime || '20:00',
            enabled: !!existingRule,
          };
        });
        setTimeSlots(initialSlots);
      } catch (error) {
        console.error('Error loading schedule:', error);
      }
    };
    loadData();
  }, []);

  // Save schedule changes
  const saveSchedule = async (slots: TimeSlot[], enabled: boolean) => {
    await StorageService.updateSettings({ scheduleEnabled: enabled });

    const rules = slots
      .filter((slot) => slot.enabled)
      .map((slot, index) => ({
        id: `rule-${index}`,
        daysOfWeek: [slot.dayOfWeek],
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAllowed: true,
      }));

    await StorageService.setSchedule({
      enabled,
      rules,
      temporaryOverride: false,
      overrideExpiresAt: null,
    });
  };

  const handleScheduleToggle = async (value: boolean) => {
    // Check premium access when enabling
    if (value && !isAvailable) {
      requireFeature();
      return;
    }
    setScheduleEnabled(value);
    await saveSchedule(timeSlots, value);
  };

  const handleDayToggle = async (dayIndex: number, value: boolean) => {
    const newSlots = [...timeSlots];
    newSlots[dayIndex].enabled = value;
    setTimeSlots(newSlots);
    await saveSchedule(newSlots, scheduleEnabled);
  };

  const handleTimeChange = (event: any, selectedDate: Date | undefined, index: number, type: 'start' | 'end') => {
    if (event.type === 'dismissed') return;

    if (selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const newTime = `${hours}:${minutes}`;

      const newSlots = [...timeSlots];
      const slot = newSlots[index];

      // Validation basics
      if (type === 'start') {
        if (newTime >= slot.endTime) {
          Alert.alert("Erreur", "L'heure de début doit être avant l'heure de fin");
          return;
        }
        slot.startTime = newTime;
      } else {
        if (newTime <= slot.startTime) {
          Alert.alert("Erreur", "L'heure de fin doit être après l'heure de début");
          return;
        }
        slot.endTime = newTime;
      }

      setTimeSlots(newSlots);
      saveSchedule(newSlots, scheduleEnabled);
    }
  };

  const handleTimePress = (index: number, type: 'start' | 'end') => {
    const slot = timeSlots[index];
    const timeString = type === 'start' ? slot.startTime : slot.endTime;
    const [hours, minutes] = timeString.split(':').map(Number);

    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);

    DateTimePickerAndroid.open({
      value: date,
      onChange: (event, date) => handleTimeChange(event, date, index, type),
      mode: 'time',
      is24Hour: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={Colors.light.text}
            />
          </TouchableOpacity>
          <Text style={styles.title}>{t.title}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Info Card */}
        <Card variant="outlined" style={styles.infoCard}>
          <View style={styles.infoContent}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.infoText}>{t.description}</Text>
          </View>
        </Card>

        {/* Enable Toggle */}
        <Card variant="elevated" style={styles.toggleCard}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleInfo}>
              <MaterialCommunityIcons
                name="clock-check"
                size={24}
                color={scheduleEnabled ? Colors.success : Colors.light.textSecondary}
              />
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>
                  {scheduleEnabled ? t.enabled : t.disabled}
                </Text>
                <Text style={styles.toggleDescription}>
                  Activer les restrictions horaires
                </Text>
              </View>
            </View>
            <Switch
              value={scheduleEnabled}
              onValueChange={handleScheduleToggle}
              trackColor={{ false: Colors.light.border, true: Colors.success + '60' }}
              thumbColor={scheduleEnabled ? Colors.success : Colors.light.surface}
            />
          </View>
        </Card>

        {/* Days Configuration */}
        {scheduleEnabled && (
          <>
            <Text style={styles.sectionTitle}>Jours actifs</Text>
            <Card variant="outlined" style={styles.daysCard}>
              {DAYS.map((day, index) => {
                const slot = timeSlots[index];
                return (
                  <View key={day.key}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.dayRow}>
                      <View style={styles.dayInfo}>
                        <Text
                          style={[
                            styles.dayName,
                            slot?.enabled && styles.dayNameActive,
                          ]}
                        >
                          {day.name}
                        </Text>
                        {slot?.enabled && (
                          <View style={styles.timeContainer}>
                            <TouchableOpacity
                              style={styles.timeButton}
                              onPress={() => handleTimePress(index, 'start')}
                            >
                              <Text style={styles.timeText}>{slot.startTime}</Text>
                            </TouchableOpacity>
                            <Text style={styles.timeSeparator}> - </Text>
                            <TouchableOpacity
                              style={styles.timeButton}
                              onPress={() => handleTimePress(index, 'end')}
                            >
                              <Text style={styles.timeText}>{slot.endTime}</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                      <Switch
                        value={slot?.enabled || false}
                        onValueChange={(value) => handleDayToggle(index, value)}
                        trackColor={{
                          false: Colors.light.border,
                          true: Colors.primary + '60',
                        }}
                        thumbColor={
                          slot?.enabled ? Colors.primary : Colors.light.surface
                        }
                      />
                    </View>
                  </View>
                );
              })}
            </Card>

            <Text style={styles.hintText}>
              Par défaut, la navigation est autorisée de 08:00 à 20:00 les jours activés.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  backButton: {
    padding: Spacing.sm,
    marginLeft: -Spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  placeholder: {
    width: 40,
  },
  infoCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.primary + '08',
    borderColor: Colors.primary + '30',
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  toggleCard: {
    marginBottom: Spacing.lg,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  toggleDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  daysCard: {
    padding: 0,
    overflow: 'hidden',
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  dayNameActive: {
    color: Colors.light.text,
  },
  dayTime: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginHorizontal: Spacing.md,
  },
  hintText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 4,
  },
  timeButton: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  timeText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
