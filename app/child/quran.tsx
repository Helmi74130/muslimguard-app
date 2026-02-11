/**
 * Quran Screen - MuslimGuard Child Mode
 * Browse and listen to the Holy Quran with Arabic text and audio
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { Colors, KidColors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import {
  QuranService,
  SurahInfo,
  SurahDetails,
  RECITERS,
  ReciterId,
  DEFAULT_RECITER,
} from '@/services/quran.service';

const t = translations.quran;

type ViewMode = 'list' | 'surah';

interface SurahWithNumber extends SurahInfo {
  surahNo: number;
}

export default function QuranScreen() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [surahs, setSurahs] = useState<SurahWithNumber[]>([]);
  const [filteredSurahs, setFilteredSurahs] = useState<SurahWithNumber[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Surah detail state
  const [selectedSurah, setSelectedSurah] = useState<SurahDetails | null>(null);
  const [surahLoading, setSurahLoading] = useState(false);

  // Audio state
  const [selectedReciter, setSelectedReciter] = useState<ReciterId>(DEFAULT_RECITER);
  const [showReciterModal, setShowReciterModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentAyahRef = useRef<number | null>(null);
  const selectedSurahRef = useRef<SurahDetails | null>(null);

  // Keep refs in sync
  useEffect(() => {
    currentAyahRef.current = currentAyah;
  }, [currentAyah]);

  useEffect(() => {
    selectedSurahRef.current = selectedSurah;
  }, [selectedSurah]);

  // Load surahs list
  useEffect(() => {
    loadSurahs();
    return () => {
      // Cleanup audio on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Filter surahs when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSurahs(surahs);
    } else {
      const filtered = QuranService.searchSurahs(
        surahs.map(s => ({ ...s })),
        searchQuery
      );
      setFilteredSurahs(filtered);
    }
  }, [searchQuery, surahs]);

  const loadSurahs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await QuranService.getAllSurahs();
      const withNumbers = data.map((surah, index) => ({
        ...surah,
        surahNo: index + 1,
      }));
      setSurahs(withNumbers);
      setFilteredSurahs(withNumbers);
    } catch (err) {
      setError(t.error);
      console.error('Error loading surahs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSurah = async (surahNo: number) => {
    try {
      setSurahLoading(true);
      setError(null);
      const data = await QuranService.getSurah(surahNo);
      setSelectedSurah(data);
      setViewMode('surah');
    } catch (err) {
      setError(t.error);
      console.error('Error loading surah:', err);
    } finally {
      setSurahLoading(false);
    }
  };

  const handleBack = () => {
    if (viewMode === 'surah') {
      stopAudio();
      setViewMode('list');
      setSelectedSurah(null);
      setCurrentAyah(null);
    } else {
      router.back();
    }
  };

  // Audio functions
  const playAyahAudio = async (ayahNo: number) => {
    if (!selectedSurah) return;

    try {
      // Stop current audio if playing
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setCurrentAyah(ayahNo);
      setIsPlaying(true);

      // Get audio URL for the ayah
      const audioData = await QuranService.getAyahAudio(selectedSurah.surahNo, ayahNo);
      const reciterData = audioData[selectedReciter.toString()];

      if (!reciterData || !reciterData.url) {
        console.error('No audio URL for reciter:', selectedReciter);
        setIsPlaying(false);
        return;
      }

      const audioUrl = reciterData.url;

      // Create and play sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );
      soundRef.current = sound;
    } catch (err) {
      console.error('Error playing audio:', err);
      setIsPlaying(false);
      setCurrentAyah(null);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      const surah = selectedSurahRef.current;
      const ayah = currentAyahRef.current;

      if (surah && ayah !== null && ayah < surah.totalAyah) {
        // Play next ayah
        playAyahAudio(ayah + 1);
      } else {
        // End of surah
        setIsPlaying(false);
        setCurrentAyah(null);
      }
    }
  };

  const stopAudio = async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setCurrentAyah(null);
  };

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    } else {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  // Render surah item in list
  const renderSurahItem = ({ item }: { item: SurahWithNumber }) => (
    <Pressable
      style={({ pressed }) => [
        styles.surahItem,
        pressed && styles.surahItemPressed,
      ]}
      onPress={() => loadSurah(item.surahNo)}
    >
      <View style={styles.surahNumber}>
        <Text style={styles.surahNumberText}>{item.surahNo}</Text>
      </View>
      <View style={styles.surahInfo}>
        <Text style={styles.surahNameArabic}>{item.surahNameArabic}</Text>
        <Text style={styles.surahName}>{item.surahName}</Text>
        <Text style={styles.surahMeta}>
          {item.revelationPlace === 'Mecca' ? t.meccan : t.medinan} - {item.totalAyah} {t.verses}
        </Text>
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={24}
        color={Colors.light.textSecondary}
      />
    </Pressable>
  );

  // Render ayah (verse) in surah view
  const renderAyah = (ayahNo: number, text: string) => {
    const isCurrentAyah = currentAyah === ayahNo;

    return (
      <View
        key={ayahNo}
        style={[
          styles.ayahContainer,
          isCurrentAyah && styles.ayahContainerActive,
        ]}
      >
        <View style={styles.ayahHeader}>
          <View style={styles.ayahNumber}>
            <Text style={styles.ayahNumberText}>{ayahNo}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.playButton,
              isCurrentAyah && styles.playButtonActive,
              pressed && styles.playButtonPressed,
            ]}
            onPress={() => {
              if (isCurrentAyah && isPlaying) {
                togglePlayPause();
              } else {
                playAyahAudio(ayahNo);
              }
            }}
          >
            <MaterialCommunityIcons
              name={isCurrentAyah && isPlaying ? 'pause' : 'play'}
              size={20}
              color={isCurrentAyah ? '#FFFFFF' : Colors.primary}
            />
          </Pressable>
        </View>
        <Text style={styles.ayahText}>{text}</Text>
      </View>
    );
  };

  // Render header for surah view
  const renderSurahHeader = () => {
    if (!selectedSurah) return null;

    return (
      <View style={styles.surahHeader}>
        <Text style={styles.surahHeaderArabic}>
          {selectedSurah.surahNameArabicLong}
        </Text>
        <Text style={styles.surahHeaderName}>{selectedSurah.surahName}</Text>
        <Text style={styles.surahHeaderMeta}>
          {selectedSurah.revelationPlace === 'Mecca' ? t.meccan : t.medinan} - {selectedSurah.totalAyah} {t.verses}
        </Text>

        {/* Reciter selector */}
        <Pressable
          style={styles.reciterSelector}
          onPress={() => setShowReciterModal(true)}
        >
          <MaterialCommunityIcons
            name="account-voice"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.reciterText}>
            {RECITERS[selectedReciter]}
          </Text>
          <MaterialCommunityIcons
            name="chevron-down"
            size={20}
            color={Colors.primary}
          />
        </Pressable>

        {/* Bismillah (except for Surah 9) */}
        {selectedSurah.surahNo !== 9 && (
          <Text style={styles.bismillah}>
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </Text>
        )}
      </View>
    );
  };

  // Reciter selection modal
  const renderReciterModal = () => (
    <Modal
      visible={showReciterModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReciterModal(false)}
    >
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowReciterModal(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{t.selectReciter}</Text>
          {(Object.entries(RECITERS) as [string, string][]).map(([id, name]) => {
            const reciterId = Number(id) as ReciterId;
            const isSelected = reciterId === selectedReciter;

            return (
              <Pressable
                key={id}
                style={[
                  styles.reciterOption,
                  isSelected && styles.reciterOptionSelected,
                ]}
                onPress={() => {
                  setSelectedReciter(reciterId);
                  setShowReciterModal(false);
                  // If audio is playing, restart with new reciter
                  if (currentAyah && isPlaying) {
                    playAyahAudio(currentAyah);
                  }
                }}
              >
                <MaterialCommunityIcons
                  name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color={isSelected ? Colors.primary : Colors.light.textSecondary}
                />
                <Text
                  style={[
                    styles.reciterOptionText,
                    isSelected && styles.reciterOptionTextSelected,
                  ]}
                >
                  {name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Pressable>
    </Modal>
  );

  // Error view
  if (error && !loading && !surahLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={80}
            color={Colors.error}
          />
          <Text style={styles.errorTitle}>{t.error}</Text>
          <Text style={styles.errorDesc}>{t.errorDesc}</Text>
          <Pressable style={styles.retryButton} onPress={loadSurahs}>
            <Text style={styles.retryButtonText}>{t.retry}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color={Colors.primary}
          />
        </Pressable>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons
            name="book-open-variant"
            size={24}
            color={Colors.primary}
          />
          <Text style={styles.headerText}>{t.title}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Search bar (only in list mode) */}
      {viewMode === 'list' && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons
              name="magnify"
              size={22}
              color={KidColors.safeGreen}
            />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t.searchPlaceholder}
              placeholderTextColor={KidColors.searchPlaceholder}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={20}
                  color={Colors.light.textSecondary}
                />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : viewMode === 'list' ? (
        // Surah list
        <FlatList
          data={filteredSurahs}
          renderItem={renderSurahItem}
          keyExtractor={(item) => item.surahNo.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="book-search"
                size={60}
                color={Colors.light.textSecondary}
              />
              <Text style={styles.emptyText}>{t.noResults}</Text>
            </View>
          }
        />
      ) : surahLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      ) : selectedSurah ? (
        // Surah detail view
        <ScrollView
          style={styles.surahContent}
          contentContainerStyle={styles.surahContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderSurahHeader()}

          {/* Render ayahs */}
          {Object.entries(selectedSurah.arabic1 || {})
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([ayahNo, text]) => renderAyah(Number(ayahNo) + 1, text))}
        </ScrollView>
      ) : null}

      {/* Audio playback indicator */}
      {isPlaying && currentAyah && (
        <View style={styles.playingIndicator}>
          <MaterialCommunityIcons
            name="volume-high"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.playingText}>
            {t.playing} {t.ayah} {currentAyah}
          </Text>
          <Pressable onPress={stopAudio} style={styles.stopButton}>
            <MaterialCommunityIcons name="stop" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}

      {/* Reciter modal */}
      {renderReciterModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KidColors.homeBg,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
  },
  headerRight: {
    width: 40,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: KidColors.searchBg,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.text,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },

  // Error
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
  },
  errorDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Surah list
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  surahItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  surahItemPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  surahNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahNumberText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  surahInfo: {
    flex: 1,
  },
  surahNameArabic: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'right',
    marginBottom: 2,
  },
  surahName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  surahMeta: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
    gap: Spacing.md,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },

  // Surah detail
  surahContent: {
    flex: 1,
  },
  surahContentContainer: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl * 2,
  },
  surahHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  surahHeaderArabic: {
    fontSize: 32,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  surahHeaderName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  surahHeaderMeta: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  reciterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  reciterText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  bismillah: {
    fontSize: 26,
    color: Colors.primary,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    width: '100%',
  },

  // Ayah
  ayahContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ayahContainerActive: {
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  ayahNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ayahNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonActive: {
    backgroundColor: Colors.primary,
  },
  playButtonPressed: {
    opacity: 0.8,
  },
  ayahText: {
    fontSize: 24,
    lineHeight: 48,
    color: Colors.light.text,
    textAlign: 'right',
  },

  // Playing indicator
  playingIndicator: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  playingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  stopButton: {
    padding: Spacing.xs,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  reciterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  reciterOptionSelected: {
    backgroundColor: Colors.primary + '08',
    marginHorizontal: -Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  reciterOptionText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  reciterOptionTextSelected: {
    fontWeight: '600',
    color: Colors.primary,
  },
});
