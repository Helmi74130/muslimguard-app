/**
 * Blocklist Settings Screen - MuslimGuard
 * Manage blocked domains, keywords, and whitelist (strict mode)
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { BlockingService } from '@/services/blocking.service';
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';

const t = translations.blocklist;

type TabType = 'domains' | 'keywords' | 'whitelist';

export default function BlocklistScreen() {
  const { isAvailable: strictModeAvailable, requireFeature } = usePremiumFeature('strict_mode');
  const [activeTab, setActiveTab] = useState<TabType>('domains');
  const [newItem, setNewItem] = useState('');
  const [domains, setDomains] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);

  // Load blocklist data
  const loadData = useCallback(async () => {
    try {
      const [domainsData, keywordsData, whitelistData, strictMode] = await Promise.all([
        BlockingService.getBlockedDomains(),
        BlockingService.getBlockedKeywords(),
        BlockingService.getWhitelistDomains(),
        BlockingService.isStrictModeEnabled(),
      ]);
      setDomains(domainsData);
      setKeywords(keywordsData);
      setWhitelist(whitelistData);
      setStrictModeEnabled(strictMode);
    } catch (error) {
      console.error('Error loading blocklist:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAdd = useCallback(async () => {
    if (!newItem.trim()) return;

    Keyboard.dismiss();

    if (activeTab === 'domains') {
      const result = await BlockingService.addBlockedDomain(newItem);
      if (result.success) {
        setNewItem('');
        loadData();
        Alert.alert(translations.common.success, t.domains.addSuccess);
      } else {
        Alert.alert(translations.common.error, result.error);
      }
    } else if (activeTab === 'keywords') {
      const result = await BlockingService.addBlockedKeyword(newItem);
      if (result.success) {
        setNewItem('');
        loadData();
        Alert.alert(translations.common.success, t.keywords.addSuccess);
      } else {
        Alert.alert(translations.common.error, result.error);
      }
    } else if (activeTab === 'whitelist') {
      const result = await BlockingService.addWhitelistDomain(newItem);
      if (result.success) {
        setNewItem('');
        loadData();
        Alert.alert(translations.common.success, t.whitelist.addSuccess);
      } else {
        Alert.alert(translations.common.error, result.error);
      }
    }
  }, [activeTab, newItem, loadData]);

  const handleRemove = useCallback(
    (item: string) => {
      Alert.alert(
        translations.common.confirm,
        translations.confirmations.deleteBlocklist,
        [
          { text: translations.common.cancel, style: 'cancel' },
          {
            text: translations.common.delete,
            style: 'destructive',
            onPress: async () => {
              if (activeTab === 'domains') {
                await BlockingService.removeBlockedDomain(item);
              } else if (activeTab === 'keywords') {
                await BlockingService.removeBlockedKeyword(item);
              } else if (activeTab === 'whitelist') {
                await BlockingService.removeWhitelistDomain(item);
              }
              loadData();
            },
          },
        ]
      );
    },
    [activeTab, loadData]
  );

  const handleToggleStrictMode = useCallback(async (enabled: boolean) => {
    // Check premium access when enabling
    if (enabled && !strictModeAvailable) {
      requireFeature();
      return;
    }

    if (enabled && whitelist.length === 0) {
      Alert.alert(
        t.strictMode.title,
        t.strictMode.noSitesWarning,
        [{ text: translations.common.ok }]
      );
      return;
    }

    if (enabled) {
      Alert.alert(
        t.strictMode.title,
        t.strictMode.warning,
        [
          { text: translations.common.cancel, style: 'cancel' },
          {
            text: translations.common.confirm,
            onPress: async () => {
              await BlockingService.setStrictMode(true);
              setStrictModeEnabled(true);
            },
          },
        ]
      );
    } else {
      await BlockingService.setStrictMode(false);
      setStrictModeEnabled(false);
    }
  }, [whitelist.length, strictModeAvailable, requireFeature]);

  const handleReset = useCallback(() => {
    Alert.alert(t.resetToDefault, t.resetConfirm, [
      { text: translations.common.cancel, style: 'cancel' },
      {
        text: translations.common.confirm,
        onPress: async () => {
          await BlockingService.resetToDefaults();
          loadData();
        },
      },
    ]);
  }, [loadData]);

  const handleLoadDefaultDomains = useCallback(async () => {
    await BlockingService.loadDefaultDomains();
    loadData();
    Alert.alert(translations.common.success, t.domains.loadDefaultSuccess);
  }, [loadData]);

  const handleLoadDefaultKeywords = useCallback(async () => {
    await BlockingService.loadDefaultKeywords();
    loadData();
    Alert.alert(translations.common.success, t.keywords.loadDefaultSuccess);
  }, [loadData]);

  const handleClearDomains = useCallback(() => {
    Alert.alert(t.domains.clearAll, t.domains.clearAllConfirm, [
      { text: translations.common.cancel, style: 'cancel' },
      {
        text: translations.common.confirm,
        style: 'destructive',
        onPress: async () => {
          await BlockingService.clearBlockedDomains();
          loadData();
        },
      },
    ]);
  }, [loadData]);

  const handleClearKeywords = useCallback(() => {
    Alert.alert(t.keywords.clearAll, t.keywords.clearAllConfirm, [
      { text: translations.common.cancel, style: 'cancel' },
      {
        text: translations.common.confirm,
        style: 'destructive',
        onPress: async () => {
          await BlockingService.clearBlockedKeywords();
          loadData();
        },
      },
    ]);
  }, [loadData]);

  const currentList = activeTab === 'domains'
    ? domains
    : activeTab === 'keywords'
      ? keywords
      : whitelist;
  const currentPlaceholder =
    activeTab === 'domains'
      ? t.domains.placeholder
      : activeTab === 'keywords'
        ? t.keywords.placeholder
        : t.whitelist.placeholder;

  const renderItem = ({ item }: { item: string }) => (
    <View style={[styles.listItem, activeTab === 'whitelist' && styles.listItemWhitelist]}>
      <View style={styles.listItemContent}>
        <MaterialCommunityIcons
          name={activeTab === 'whitelist' ? 'check-circle' : activeTab === 'domains' ? 'web' : 'text-box'}
          size={18}
          color={activeTab === 'whitelist' ? Colors.success : Colors.light.textSecondary}
        />
        <Text style={styles.listItemText}>{item}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemove(item)}
      >
        <MaterialCommunityIcons
          name="close-circle"
          size={22}
          color={Colors.error}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
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
        <View style={styles.headerActions}>
          {activeTab === 'domains' && domains.length > 0 && (
            <TouchableOpacity onPress={handleClearDomains} style={styles.headerButton}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={24}
                color={Colors.error}
              />
            </TouchableOpacity>
          )}
          {activeTab === 'keywords' && keywords.length > 0 && (
            <TouchableOpacity onPress={handleClearKeywords} style={styles.headerButton}>
              <MaterialCommunityIcons
                name="delete-outline"
                size={24}
                color={Colors.error}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleReset}>
            <MaterialCommunityIcons
              name="refresh"
              size={24}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Strict Mode Toggle */}
      <View style={styles.strictModeContainer}>
        <View style={styles.strictModeContent}>
          <MaterialCommunityIcons
            name={strictModeEnabled ? 'shield-lock' : 'shield-off'}
            size={24}
            color={strictModeEnabled ? Colors.success : Colors.light.textSecondary}
          />
          <View style={styles.strictModeText}>
            <Text style={styles.strictModeTitle}>{t.strictMode.title}</Text>
            <Text style={styles.strictModeDesc}>
              {strictModeEnabled ? t.strictMode.enabled : t.strictMode.disabled}
            </Text>
          </View>
        </View>
        <Switch
          value={strictModeEnabled}
          onValueChange={handleToggleStrictMode}
          trackColor={{ false: Colors.light.border, true: Colors.success + '60' }}
          thumbColor={strictModeEnabled ? Colors.success : Colors.light.textSecondary}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'domains' && styles.tabActive]}
          onPress={() => setActiveTab('domains')}
        >
          <MaterialCommunityIcons
            name="web-off"
            size={16}
            color={activeTab === 'domains' ? Colors.primary : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'domains' && styles.tabTextActive,
            ]}
          >
            {t.tabs.domains} ({domains.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'keywords' && styles.tabActive]}
          onPress={() => setActiveTab('keywords')}
        >
          <MaterialCommunityIcons
            name="text-box-search"
            size={16}
            color={activeTab === 'keywords' ? Colors.primary : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'keywords' && styles.tabTextActive,
            ]}
          >
            {t.tabs.keywords} ({keywords.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'whitelist' && styles.tabActiveWhitelist]}
          onPress={() => setActiveTab('whitelist')}
        >
          <MaterialCommunityIcons
            name="check-circle"
            size={16}
            color={activeTab === 'whitelist' ? Colors.success : Colors.light.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === 'whitelist' && styles.tabTextActiveWhitelist,
            ]}
          >
            {t.tabs.whitelist} ({whitelist.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Input */}
      <View style={styles.addContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newItem}
            onChangeText={setNewItem}
            placeholder={currentPlaceholder}
            placeholderTextColor={Colors.light.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
        </View>
        <Button
          title={translations.common.add}
          onPress={handleAdd}
          disabled={!newItem.trim()}
          size="medium"
        />
      </View>

      {/* List */}
      {currentList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons
            name={
              activeTab === 'domains'
                ? 'web-off'
                : activeTab === 'keywords'
                  ? 'text-box-remove'
                  : 'check-circle-outline'
            }
            size={64}
            color={activeTab === 'whitelist' ? Colors.success + '40' : Colors.light.border}
          />
          <Text style={styles.emptyText}>
            {activeTab === 'domains'
              ? t.domains.empty
              : activeTab === 'keywords'
                ? t.keywords.empty
                : t.whitelist.empty}
          </Text>
          {activeTab === 'whitelist' && (
            <Text style={styles.emptySubtext}>{t.whitelist.description}</Text>
          )}
          {activeTab === 'domains' && (
            <View style={styles.loadDefaultContainer}>
              <Text style={styles.loadDefaultDesc}>{t.domains.loadDefaultDesc}</Text>
              <Button
                title={t.domains.loadDefault}
                onPress={handleLoadDefaultDomains}
                variant="outline"
                size="medium"
              />
            </View>
          )}
          {activeTab === 'keywords' && (
            <View style={styles.loadDefaultContainer}>
              <Text style={styles.loadDefaultDesc}>{t.keywords.loadDefaultDesc}</Text>
              <Button
                title={t.keywords.loadDefault}
                onPress={handleLoadDefaultKeywords}
                variant="outline"
                size="medium"
              />
            </View>
          )}
        </View>
      ) : (
        <FlatList
          data={currentList}
          keyExtractor={(item) => item}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.xs,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tabActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  addContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  input: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 4,
    fontSize: 15,
    color: Colors.light.text,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  listItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  listItemText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  removeButton: {
    padding: Spacing.xs,
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
  // Strict Mode styles
  strictModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  strictModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  strictModeText: {
    flex: 1,
  },
  strictModeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  strictModeDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  // Whitelist tab styles
  tabActiveWhitelist: {
    backgroundColor: Colors.success + '10',
    borderColor: Colors.success,
  },
  tabTextActiveWhitelist: {
    color: Colors.success,
  },
  listItemWhitelist: {
    borderColor: Colors.success + '40',
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  loadDefaultContainer: {
    marginTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadDefaultDesc: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
});
