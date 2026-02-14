/**
 * Browsing History Screen - MuslimGuard
 * View child's browsing history and blocked attempts
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui/card';
import { StorageService } from '@/services/storage.service';
import { HistoryEntry } from '@/types/storage.types';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { format, isToday, isYesterday } from 'date-fns';
import { fr } from 'date-fns/locale';

const t = translations.history;

type FilterType = 'all' | 'blocked' | 'allowed';

/**
 * Extract domain from URL for cleaner display
 */
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function HistoryScreen() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [allHistory, setAllHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history
  const loadHistory = useCallback(async () => {
    try {
      const entries = await StorageService.getHistory();
      setAllHistory(entries);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Filter and group history by date
  const sections = useMemo(() => {
    const filtered = allHistory.filter((entry) => {
      if (filter === 'all') return true;
      if (filter === 'blocked') return entry.wasBlocked;
      if (filter === 'allowed') return !entry.wasBlocked;
      return true;
    });

    // Group by date
    const groups: { [key: string]: HistoryEntry[] } = {};
    filtered.forEach((entry) => {
      const date = new Date(entry.timestamp);
      let dateKey: string;

      if (isToday(date)) {
        dateKey = "Aujourd'hui";
      } else if (isYesterday(date)) {
        dateKey = 'Hier';
      } else {
        dateKey = format(date, 'EEEE d MMMM', { locale: fr });
        // Capitalize first letter
        dateKey = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
      }

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(entry);
    });

    // Convert to sections array
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
    }));
  }, [filter, allHistory]);

  const handleClearHistory = useCallback(() => {
    Alert.alert(
      t.clearHistory,
      t.clearConfirm,
      [
        { text: translations.common.cancel, style: 'cancel' },
        {
          text: translations.common.confirm,
          style: 'destructive',
          onPress: async () => {
            await StorageService.clearHistory();
            loadHistory();
          },
        },
      ]
    );
  }, [loadHistory]);

  const handleShowUrl = useCallback((url: string) => {
    Alert.alert('URL complète', url, [{ text: 'OK' }]);
  }, []);

  // Get display text for block reason
  const getBlockReasonText = (reason?: string): string => {
    switch (reason) {
      case 'domain':
        return 'Site bloqué';
      case 'keyword':
        return 'Mot-clé détecté';
      case 'whitelist':
        return 'Non autorisé';
      case 'prayer':
        return 'Heure de prière';
      case 'schedule':
        return 'Horaire restreint';
      default:
        return 'Bloqué';
    }
  };

  const renderHistoryItem = ({ item }: { item: HistoryEntry }) => {
    const time = format(new Date(item.timestamp), 'HH:mm');
    const domain = extractDomain(item.url);
    const isKeywordBlock = item.blockReason === 'keyword';

    return (
      <Card
        variant="outlined"
        style={styles.historyItem}
        onPress={() => handleShowUrl(item.url)}
      >
        <View style={styles.historyContent}>
          <View
            style={[
              styles.statusIndicator,
              item.wasBlocked ? styles.blockedIndicator : styles.allowedIndicator,
            ]}
          />
          <View style={styles.historyInfo}>
            <Text style={styles.historyDomain} numberOfLines={1}>
              {domain}
            </Text>
            {item.wasBlocked && item.blockedBy ? (
              <View style={styles.blockReasonContainer}>
                <Text style={styles.blockReasonText}>
                  {getBlockReasonText(item.blockReason)}
                </Text>
                {isKeywordBlock && (
                  <Text style={styles.blockedByText}>
                    « {item.blockedBy} »
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.historyTitle} numberOfLines={1}>
                {item.title !== item.url ? item.title : ''}
              </Text>
            )}
          </View>
          <View style={styles.historyMeta}>
            <Text style={styles.historyTime}>{time}</Text>
            {item.wasBlocked && (
              <View style={[
                styles.blockedBadge,
                isKeywordBlock && styles.keywordBadge
              ]}>
                <Text style={[
                  styles.blockedBadgeText,
                  isKeywordBlock && styles.keywordBadgeText
                ]}>
                  {isKeywordBlock ? 'Mot-clé' : t.blocked}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <TouchableOpacity onPress={handleClearHistory}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={24}
            color={Colors.light.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <FilterTab
          label={t.filterAll}
          isActive={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterTab
          label={t.filterBlocked}
          isActive={filter === 'blocked'}
          onPress={() => setFilter('blocked')}
          color={Colors.error}
        />
        <FilterTab
          label={t.filterAllowed}
          isActive={filter === 'allowed'}
          onPress={() => setFilter('allowed')}
          color={Colors.success}
        />
      </View>

      {/* History List */}
      {sections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name="history"
            size={64}
            color={Colors.light.border}
          />
          <Text style={styles.emptyText}>{t.empty}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderHistoryItem}
          renderSectionHeader={({ section: { title } }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionHeaderText}>{title}</Text>
            </View>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
        />
      )}
    </SafeAreaView>
  );
}

function FilterTab({
  label,
  isActive,
  onPress,
  color,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
  color?: string;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterTab,
        isActive && [styles.filterTabActive, color && { backgroundColor: color + '15' }],
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.filterTabText,
          isActive && [styles.filterTabTextActive, color && { color }],
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  filterTab: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surface,
  },
  filterTabActive: {
    backgroundColor: Colors.primary + '15',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.primary,
  },
  listContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  historyItem: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  allowedIndicator: {
    backgroundColor: Colors.success,
  },
  blockedIndicator: {
    backgroundColor: Colors.error,
  },
  historyInfo: {
    flex: 1,
  },
  historyDomain: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  historyTitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  blockReasonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  blockReasonText: {
    fontSize: 12,
    color: Colors.error,
  },
  blockedByText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
  },
  historyMeta: {
    alignItems: 'flex-end',
  },
  historyTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  blockedBadge: {
    marginTop: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: Colors.error + '15',
    borderRadius: BorderRadius.sm,
  },
  blockedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.error,
  },
  keywordBadge: {
    backgroundColor: Colors.warning + '15',
  },
  keywordBadgeText: {
    color: Colors.warning,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
});
