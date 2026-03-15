/**
 * Sound Mixer - MuslimGuard
 * Simplified mixing board with nature/white noise sounds
 * Children can toggle sounds on/off and mix them together
 */

import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import { PremiumModal } from '@/components/PremiumModal';
import { useSubscription } from '@/contexts/subscription.context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const FREE_SOUNDS_COUNT = 3;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TILE_GAP = 16;
const TILE_SIZE = (SCREEN_WIDTH - Spacing.lg * 2 - TILE_GAP) / 2;

interface SoundItem {
  id: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  file: any;
  color: string;
  colorLight: string;
}

const SOUNDS: SoundItem[] = [
  {
    id: 'rain',
    label: 'Pluie',
    icon: 'weather-rainy',
    file: require('@/assets/sounds/rain.mp3'),
    color: '#2563EB',
    colorLight: '#DBEAFE',
  },
  {
    id: 'wind',
    label: 'Vent',
    icon: 'weather-windy',
    file: require('@/assets/sounds/wind.mp3'),
    color: '#0891B2',
    colorLight: '#CFFAFE',
  },
  {
    id: 'birds',
    label: 'Oiseaux',
    icon: 'bird',
    file: require('@/assets/sounds/birds.mp3'),
    color: '#D97706',
    colorLight: '#FEF3C7',
  },
  {
    id: 'forest',
    label: 'Forêt',
    icon: 'pine-tree',
    file: require('@/assets/sounds/forest.mp3'),
    color: '#16A34A',
    colorLight: '#DCFCE7',
  },
  {
    id: 'ocean',
    label: 'Océan',
    icon: 'waves',
    file: require('@/assets/sounds/ocean.mp3'),
    color: '#0284C7',
    colorLight: '#E0F2FE',
  },
  {
    id: 'campfire',
    label: 'Feu',
    icon: 'campfire',
    file: require('@/assets/sounds/campfire.mp3'),
    color: '#EA580C',
    colorLight: '#FED7AA',
  },
  {
    id: 'night',
    label: 'Nuit',
    icon: 'weather-night',
    file: require('@/assets/sounds/night.mp3'),
    color: '#4338CA',
    colorLight: '#E0E7FF',
  },
  {
    id: 'riviere',
    label: 'Rivière',
    icon: 'water-percent',
    file: require('@/assets/sounds/riviere.mp3'),
    color: '#0369A1',
    colorLight: '#E0F2FE',
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: 'tree',
    file: require('@/assets/sounds/nature.mp3'),
    color: '#10B981',
    colorLight: '#D1FAE5',
  },
  {
    id: 'marche',
    label: 'Marche',
    icon: 'shoe-print',
    file: require('@/assets/sounds/marche.mp3'),
    color: '#71717A',
    colorLight: '#F4F4F5',
  },
  {
    id: 'vagues',
    label: 'Vagues',
    icon: 'water',
    file: require('@/assets/sounds/vagues.mp3'),
    color: '#2563EB',
    colorLight: '#DBEAFE',
  },
  {
    id: 'ronronnement',
    label: 'Ronronnement',
    icon: 'cat',
    file: require('@/assets/sounds/ronronement.mp3'),
    color: '#D946EF',
    colorLight: '#FAE8FF',
  }
];

export default function SoundMixerScreen() {
  const { isPremium } = useSubscription();
  const [activeSounds, setActiveSounds] = useState<Set<string>>(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const soundRefs = useRef<Map<string, Audio.Sound>>(new Map());

  // Cleanup all sounds when leaving the screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopAll();
      };
    }, [])
  );

  const toggleSound = async (item: SoundItem) => {
    const isActive = activeSounds.has(item.id);

    if (isActive) {
      // Stop this sound
      const sound = soundRefs.current.get(item.id);
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        soundRefs.current.delete(item.id);
      }
      setActiveSounds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    } else {
      // Play this sound
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          item.file,
          { isLooping: true, volume: 0.7 }
        );
        soundRefs.current.set(item.id, sound);
        await sound.playAsync();

        setActiveSounds(prev => {
          const next = new Set(prev);
          next.add(item.id);
          return next;
        });
      } catch (error) {
        console.error(`[SoundMixer] Error playing ${item.id}:`, error);
      }
    }
  };

  const stopAll = async () => {
    for (const [id, sound] of soundRefs.current) {
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (e) {
        // Sound may already be unloaded
      }
    }
    soundRefs.current.clear();
    setActiveSounds(new Set());
  };

  const activeCount = activeSounds.size;

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* Hero image */}
      <View style={styles.heroImageWrapper}>
        <Image
          source={require('@/assets/images/cascade.jpg')}
          style={styles.heroImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={() => router.back()} style={styles.backBtnOnImage}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <View style={styles.imageTitleContainer}>
          <Text style={styles.heroTitleOnImage}>Sons relaxants</Text>
          <Text style={styles.heroSubtitleOnImage}>Mélange tes sons préférés</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sound Grid */}
        <View style={styles.grid}>
          {SOUNDS.map((item, index) => {
            const isLocked = !isPremium && index >= FREE_SOUNDS_COUNT;
            const isActive = activeSounds.has(item.id);
            return (
              <Pressable
                key={item.id}
                style={[
                  styles.tile,
                  isLocked && styles.tileLocked,
                  !isLocked && isActive && { backgroundColor: item.color },
                  !isLocked && !isActive && { backgroundColor: item.colorLight },
                ]}
                onPress={() => isLocked ? setShowPremiumModal(true) : toggleSound(item)}
              >
                <View style={[
                  styles.iconCircle,
                  isLocked
                    ? { backgroundColor: 'rgba(0,0,0,0.08)' }
                    : isActive
                      ? { backgroundColor: 'rgba(255,255,255,0.25)' }
                      : { backgroundColor: 'rgba(0,0,0,0.06)' },
                ]}>
                  <MaterialCommunityIcons
                    name={isLocked ? 'lock' : item.icon}
                    size={32}
                    color={isLocked ? '#AAAAAA' : isActive ? '#FFFFFF' : item.color}
                  />
                </View>
                <Text style={[
                  styles.tileLabel,
                  isLocked && styles.tileLabelLocked,
                  !isLocked && isActive && styles.tileLabelActive,
                  !isLocked && !isActive && { color: item.color },
                ]}>
                  {item.label}
                </Text>
                {isLocked && (
                  <View style={styles.premiumChip}>
                    <MaterialCommunityIcons name="crown" size={9} color={Colors.warning} />
                  </View>
                )}
                {!isLocked && isActive && (
                  <View style={styles.activeDot} />
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* Fixed Bottom Controls */}
      <View style={styles.bottomControls}>
        {activeCount > 0 && (
          <Pressable style={styles.stopButton} onPress={stopAll}>
            <MaterialCommunityIcons name="stop-circle" size={24} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Tout arrêter</Text>
          </Pressable>
        )}
        <View style={styles.statusContainer}>
          <MaterialCommunityIcons
            name={activeCount > 0 ? 'volume-high' : 'volume-off'}
            size={20}
            color={Colors.light.textSecondary}
          />
          <Text style={styles.statusText}>
            {activeCount === 0
              ? 'Appuie sur un son pour commencer'
              : `${activeCount} son${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''}`}
          </Text>
        </View>
      </View>

      <PremiumModal visible={showPremiumModal} onClose={() => setShowPremiumModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4FF',
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  bottomControls: {
    backgroundColor: '#F0F4FF',
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  // Hero image
  heroImageWrapper: {
    width: '100%',
    height: SCREEN_WIDTH * 0.38,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  backBtnOnImage: {
    position: 'absolute',
    top: 48,
    left: 16,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 22,
  },
  imageTitleContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroTitleOnImage: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSubtitleOnImage: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: TILE_GAP,
    justifyContent: 'center',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  tileLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  tileLabelActive: {
    color: '#FFFFFF',
  },
  activeDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  tileLocked: {
    backgroundColor: '#F0F0F0',
    opacity: 0.75,
  },
  tileLabelLocked: {
    color: '#AAAAAA',
  },
  premiumChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: Colors.warning + 'DD',
    borderRadius: 8,
    padding: 3,
  },
  // Stop button
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  stopButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Status
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
});
