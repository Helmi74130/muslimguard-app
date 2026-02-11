/**
 * Prayer Settings Screen - MuslimGuard
 * Configure prayer time settings with city search
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/card';
import { StorageService } from '@/services/storage.service';
import { PrayerService } from '@/services/prayer.service';
import { GeocodingService, CitySearchResult } from '@/services/geocoding.service';
import { PRAYER_METHODS, PRAYER_METHODS_ORDER, PrayerMethodId, CityCoordinates } from '@/types/storage.types';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.prayer.settings;

export default function PrayerSettingsScreen() {
  const [city, setCity] = useState<CityCoordinates | null>(null);
  const [prayerMethod, setPrayerMethod] = useState<PrayerMethodId>(12);
  const [autoPause, setAutoPause] = useState(true);
  const [pauseDuration, setPauseDuration] = useState(15);

  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showMethodPicker, setShowMethodPicker] = useState(false);

  // City search state
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<CitySearchResult[]>([]);
  const [isCitySearching, setIsCitySearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await StorageService.getSettings();
        setCity(settings.city);
        setPrayerMethod(settings.prayerMethod as PrayerMethodId);
        setAutoPause(settings.autoPauseDuringPrayer);
        setPauseDuration(settings.pauseDurationMinutes);
      } catch (error) {
        console.error('Error loading prayer settings:', error);
      }
    };
    loadSettings();
  }, []);

  // Handle city search with debounce
  const handleCitySearch = useCallback((query: string) => {
    setCitySearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.trim().length < 2) {
      setCitySearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsCitySearching(true);
      try {
        const results = await GeocodingService.searchCities(query, 8);
        setCitySearchResults(results);
      } catch (error) {
        console.error('City search error:', error);
        setCitySearchResults([]);
      } finally {
        setIsCitySearching(false);
      }
    }, 500);
  }, []);

  const handleCitySelect = async (result: CitySearchResult) => {
    const selectedCity: CityCoordinates = {
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    };
    setCity(selectedCity);
    await PrayerService.setCity(selectedCity);
    setShowCityPicker(false);
    setCitySearchQuery('');
    setCitySearchResults([]);
  };

  const handleMethodSelect = async (methodId: PrayerMethodId) => {
    setPrayerMethod(methodId);
    await PrayerService.setCalculationMethod(methodId);
    setShowMethodPicker(false);
  };

  const handleAutoPauseToggle = async (value: boolean) => {
    setAutoPause(value);
    await PrayerService.setAutoPause(value);
  };

  const handlePauseDurationChange = async (duration: number) => {
    setPauseDuration(duration);
    await PrayerService.setPauseDuration(duration);
  };

  const openCityPicker = () => {
    setCitySearchQuery('');
    setCitySearchResults([]);
    setShowCityPicker(true);
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

        {/* City Selection */}
        <Text style={styles.sectionTitle}>{t.city}</Text>
        <Card
          variant="outlined"
          onPress={openCityPicker}
          style={styles.optionCard}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="map-marker"
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{t.city}</Text>
              <Text style={styles.optionValue}>
                {city ? `${city.name}, ${city.country}` : 'Non configurée'}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={Colors.light.textSecondary}
            />
          </View>
        </Card>

        {/* Calculation Method */}
        <Text style={styles.sectionTitle}>{t.calculationMethod}</Text>
        <Card
          variant="outlined"
          onPress={() => setShowMethodPicker(true)}
          style={styles.optionCard}
        >
          <View style={styles.optionContent}>
            <View style={styles.optionIconContainer}>
              <MaterialCommunityIcons
                name="calculator"
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>{t.calculationMethod}</Text>
              <Text style={styles.optionValue} numberOfLines={1}>
                {translations.prayer.methods[prayerMethod] || PRAYER_METHODS[prayerMethod]}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={Colors.light.textSecondary}
            />
          </View>
        </Card>

        {/* Auto Pause */}
        <Text style={styles.sectionTitle}>{t.autoPause}</Text>
        <Card variant="outlined" style={styles.optionCard}>
          <View style={styles.toggleContent}>
            <View style={styles.toggleInfo}>
              <View style={styles.optionIconContainer}>
                <MaterialCommunityIcons
                  name="pause-circle"
                  size={22}
                  color={autoPause ? Colors.success : Colors.light.textSecondary}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{t.autoPause}</Text>
                <Text style={styles.optionDescription}>
                  {t.autoPauseDescription}
                </Text>
              </View>
            </View>
            <Switch
              value={autoPause}
              onValueChange={handleAutoPauseToggle}
              trackColor={{ false: Colors.light.border, true: Colors.success + '60' }}
              thumbColor={autoPause ? Colors.success : Colors.light.surface}
            />
          </View>
        </Card>

        {/* Pause Duration */}
        {autoPause && (
          <Card variant="outlined" style={styles.pauseDurationCard}>
            <View style={styles.optionContent}>
              <View style={styles.optionIconContainer}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={22}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionLabel}>{t.pauseDuration}</Text>
                <Text style={styles.optionDescription}>
                  {t.pauseDurationDescription}
                </Text>
              </View>
            </View>
            <View style={styles.durationPicker}>
              {[10, 15, 20, 30].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    pauseDuration === duration && styles.durationOptionActive,
                  ]}
                  onPress={() => handlePauseDurationChange(duration)}
                >
                  <Text
                    style={[
                      styles.durationText,
                      pauseDuration === duration && styles.durationTextActive,
                    ]}
                  >
                    {duration} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>

      {/* City Picker Modal */}
      <Modal visible={showCityPicker} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rechercher une ville</Text>
            <TouchableOpacity onPress={() => setShowCityPicker(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={Colors.light.text}
              />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <MaterialCommunityIcons
                name="magnify"
                size={20}
                color={Colors.light.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Tapez le nom de votre ville..."
                placeholderTextColor={Colors.light.textSecondary}
                value={citySearchQuery}
                onChangeText={handleCitySearch}
                autoFocus
              />
              {isCitySearching && (
                <ActivityIndicator size="small" color={Colors.primary} />
              )}
            </View>
          </View>

          {/* Search Results */}
          {citySearchQuery.length < 2 ? (
            <View style={styles.instructionsContainer}>
              <MaterialCommunityIcons
                name="information-outline"
                size={24}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.instructionsText}>
                Tapez au moins 2 caractères pour rechercher
              </Text>
            </View>
          ) : (
            <FlatList
              data={citySearchResults}
              keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleCitySelect(item)}
                >
                  <View style={styles.cityResultInfo}>
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Text style={styles.pickerItemSubtext}>{item.country}</Text>
                  </View>
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={Colors.light.textSecondary}
                  />
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.pickerList}
              ListEmptyComponent={
                !isCitySearching ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="map-marker-off"
                      size={48}
                      color={Colors.light.textSecondary}
                    />
                    <Text style={styles.emptyText}>Aucun résultat</Text>
                    <Text style={styles.emptySubtext}>
                      Essayez avec un autre nom
                    </Text>
                  </View>
                ) : null
              }
            />
          )}
        </SafeAreaView>
      </Modal>

      {/* Method Picker Modal */}
      <Modal visible={showMethodPicker} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Méthode de calcul</Text>
            <TouchableOpacity onPress={() => setShowMethodPicker(false)}>
              <MaterialCommunityIcons
                name="close"
                size={24}
                color={Colors.light.text}
              />
            </TouchableOpacity>
          </View>
          <FlatList
            data={PRAYER_METHODS_ORDER.map((id) => ({
              id,
              name: PRAYER_METHODS[id],
            }))}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.pickerItem,
                  prayerMethod === item.id && styles.pickerItemActive,
                ]}
                onPress={() => handleMethodSelect(item.id)}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    prayerMethod === item.id && styles.pickerItemTextActive,
                  ]}
                >
                  {translations.prayer.methods[item.id] || item.name}
                </Text>
                {prayerMethod === item.id && (
                  <MaterialCommunityIcons
                    name="check"
                    size={20}
                    color={Colors.primary}
                  />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.pickerList}
          />
        </SafeAreaView>
      </Modal>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionCard: {
    padding: Spacing.md,
  },
  pauseDurationCard: {
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  optionValue: {
    fontSize: 13,
    color: Colors.primary,
    marginTop: 2,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
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
  durationPicker: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  durationOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  durationOptionActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  durationText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  durationTextActive: {
    color: Colors.primary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  searchContainer: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.light.text,
  },
  instructionsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  pickerList: {
    padding: Spacing.lg,
  },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  pickerItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  cityResultInfo: {
    flex: 1,
  },
  pickerItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  pickerItemTextActive: {
    color: Colors.primary,
  },
  pickerItemSubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
});
