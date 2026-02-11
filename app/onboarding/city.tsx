/**
 * City Selection Screen - MuslimGuard Onboarding
 * Search and select city for prayer times calculation
 * Uses OpenStreetMap Nominatim API for geocoding
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { StorageService } from '@/services/storage.service';
import { GeocodingService, CitySearchResult } from '@/services/geocoding.service';
import { PrayerService } from '@/services/prayer.service';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { CityCoordinates } from '@/types/storage.types';

const t = translations.onboarding.citySelection;

export default function CitySelectionScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CitySearchResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityCoordinates | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search ref
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle search with debounce
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Don't search if query is too short
    if (query.trim().length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    // Debounce search by 500ms
    searchTimeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setHasSearched(true);

      try {
        const results = await GeocodingService.searchCities(query, 8);
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, []);

  const handleSelectCity = (result: CitySearchResult) => {
    const city: CityCoordinates = {
      name: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    };
    setSelectedCity(city);
  };

  const handleContinue = async () => {
    if (selectedCity) {
      await PrayerService.setCity(selectedCity);
      router.push('/onboarding/complete');
    }
  };

  const renderCityItem = ({ item }: { item: CitySearchResult }) => {
    const isSelected =
      selectedCity?.latitude === item.latitude &&
      selectedCity?.longitude === item.longitude;

    return (
      <TouchableOpacity
        style={[styles.cityItem, isSelected && styles.cityItemSelected]}
        onPress={() => handleSelectCity(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cityInfo}>
          <Text style={[styles.cityName, isSelected && styles.cityNameSelected]}>
            {item.name}
          </Text>
          <Text style={[styles.cityCountry, isSelected && styles.cityCountrySelected]}>
            {item.country}
          </Text>
        </View>
        {isSelected && (
          <MaterialCommunityIcons
            name="check-circle"
            size={24}
            color={Colors.primary}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="map-marker"
              size={48}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        {/* Search Input */}
        <Input
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChangeText={handleSearch}
          leftIcon={
            <MaterialCommunityIcons
              name="magnify"
              size={20}
              color={Colors.light.textSecondary}
            />
          }
          rightIcon={
            isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : undefined
          }
          containerStyle={styles.searchInput}
        />

        {/* Instructions or Results */}
        {!hasSearched && !selectedCity && (
          <View style={styles.instructionsContainer}>
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={Colors.light.textSecondary}
            />
            <Text style={styles.instructionsText}>
              Tapez le nom de votre ville pour la rechercher
            </Text>
          </View>
        )}

        {/* Results Section */}
        {hasSearched && (
          <>
            <Text style={styles.sectionTitle}>
              {isLoading ? 'Recherche...' : `${searchResults.length} résultat(s)`}
            </Text>

            <FlatList
              data={searchResults}
              keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
              renderItem={renderCityItem}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                !isLoading ? (
                  <View style={styles.emptyContainer}>
                    <MaterialCommunityIcons
                      name="map-marker-off"
                      size={48}
                      color={Colors.light.textSecondary}
                    />
                    <Text style={styles.emptyText}>{t.noResults}</Text>
                    <Text style={styles.emptySubtext}>
                      Essayez avec un autre nom ou vérifiez l'orthographe
                    </Text>
                  </View>
                ) : null
              }
            />
          </>
        )}

        {/* Selected City Display */}
        {selectedCity && (
          <Card style={styles.selectedCard}>
            <View style={styles.selectedContent}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={Colors.success}
              />
              <Text style={styles.selectedText}>
                {t.selectedCity}:{' '}
                <Text style={styles.selectedCityName}>
                  {selectedCity.name}, {selectedCity.country}
                </Text>
              </Text>
            </View>
          </Card>
        )}

        {/* Continue Button */}
        <Button
          title={translations.common.continue}
          onPress={handleContinue}
          size="large"
          fullWidth
          disabled={!selectedCity}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  searchInput: {
    marginBottom: Spacing.md,
  },
  instructionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
  },
  instructionsText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cityItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  cityInfo: {
    flex: 1,
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cityNameSelected: {
    color: Colors.primary,
  },
  cityCountry: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  cityCountrySelected: {
    color: Colors.primary + 'AA',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: Spacing.md,
  },
  emptySubtext: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: 13,
    marginTop: Spacing.xs,
  },
  selectedCard: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success,
    borderWidth: 1,
  },
  selectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  selectedText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  selectedCityName: {
    fontWeight: '600',
    color: Colors.success,
  },
});
