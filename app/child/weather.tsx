/**
 * Weather Screen - MuslimGuard
 * Kid-friendly weather display using WeatherAPI.com
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import {
  WeatherService,
  WeatherData,
  getWeatherIcon,
  getWeatherColor,
} from '@/services/weather.service';

export default function WeatherScreen() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadWeather();
    }, [])
  );

  const loadWeather = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await WeatherService.getCurrentWeather();
      if (data) {
        setWeather(data);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const data = await WeatherService.getCurrentWeather(true);
      if (data) {
        setWeather(data);
      }
    } catch {
      // Keep existing data
    } finally {
      setRefreshing(false);
    }
  };

  const iconName = weather
    ? getWeatherIcon(weather.conditionCode, weather.isDay)
    : 'weather-cloudy';
  const accentColor = weather
    ? getWeatherColor(weather.conditionCode, weather.isDay)
    : '#60A5FA';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Météo</Text>
          {weather && (
            <Text style={styles.headerSubtitle}>{weather.cityName}</Text>
          )}
        </View>
        <Pressable
          onPress={handleRefresh}
          style={styles.refreshButton}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <MaterialCommunityIcons name="refresh" size={22} color={Colors.primary} />
          )}
        </Pressable>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : error || !weather ? (
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="weather-cloudy-alert" size={64} color="#94A3B8" />
          <Text style={styles.errorTitle}>Impossible de charger la météo</Text>
          <Text style={styles.errorSubtitle}>Vérifie ta connexion Internet</Text>
          <Pressable onPress={loadWeather} style={styles.retryButton}>
            <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          {/* Main weather card */}
          <View style={[styles.mainCard, { borderColor: accentColor + '40' }]}>
            <View style={[styles.iconCircle, { backgroundColor: accentColor + '20' }]}>
              <MaterialCommunityIcons
                name={iconName as any}
                size={72}
                color={accentColor}
              />
            </View>

            <Text style={styles.temperature}>{weather.tempC}°</Text>
            <Text style={styles.conditionText}>{weather.conditionText}</Text>
            <Text style={styles.feelsLike}>
              Ressenti {weather.feelsLikeC}°
            </Text>
          </View>

          {/* Details grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <MaterialCommunityIcons name="water-percent" size={28} color="#3B82F6" />
              <Text style={styles.detailValue}>{weather.humidity}%</Text>
              <Text style={styles.detailLabel}>Humidité</Text>
            </View>

            <View style={styles.detailCard}>
              <MaterialCommunityIcons name="weather-windy" size={28} color="#10B981" />
              <Text style={styles.detailValue}>{weather.windKph} km/h</Text>
              <Text style={styles.detailLabel}>Vent</Text>
            </View>

            <View style={styles.detailCard}>
              <MaterialCommunityIcons name="compass-outline" size={28} color="#F59E0B" />
              <Text style={styles.detailValue}>{weather.windDir}</Text>
              <Text style={styles.detailLabel}>Direction</Text>
            </View>
          </View>

          {/* Last update */}
          <Text style={styles.lastUpdate}>
            Mis à jour : {new Date(weather.fetchedAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  // Center content (loading / error)
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Content
  content: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  // Main card
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.lg,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    borderWidth: 2,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  temperature: {
    fontSize: 64,
    fontWeight: '800',
    color: Colors.light.text,
    lineHeight: 72,
  },
  conditionText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  feelsLike: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
  },
  // Details grid
  detailsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  detailCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: Spacing.xs,
  },
  detailLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  // Last update
  lastUpdate: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.lg,
  },
});
