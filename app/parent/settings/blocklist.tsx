/**
 * Blocklist Settings Screen - MuslimGuard
 * Category-based blocking with custom parent items
 * Parents see categories with toggle, never the raw keyword/domain lists
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Keyboard,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/button';
import { BlockingService } from '@/services/blocking.service';
import { StorageService } from '@/services/storage.service';
import { usePremiumFeature } from '@/hooks/use-premium-feature';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import type { BlockCategoryId } from '@/constants/default-blocklist';
import type { ContentFilterMode } from '@/types/storage.types';

const t = translations.blocklist;

type CustomTab = 'domains' | 'keywords';

interface CategorySummary {
  id: BlockCategoryId;
  nameFr: string;
  descriptionFr: string;
  icon: string;
  domainCount: number;
  keywordCount: number;
  enabled: boolean;
}

export default function BlocklistScreen() {
  const { isAvailable: strictModeAvailable, requireFeature } = usePremiumFeature('strict_mode');
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [customDomains, setCustomDomains] = useState<string[]>([]);
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [strictModeEnabled, setStrictModeEnabled] = useState(false);
  const [customTab, setCustomTab] = useState<CustomTab>('domains');
  const [contentFilterMode, setContentFilterMode] = useState<ContentFilterMode>('off');
  const [newItem, setNewItem] = useState('');
  const [newWhitelistItem, setNewWhitelistItem] = useState('');

  // Load all data
  const loadData = useCallback(async () => {
    try {
      const [categorySummary, domains, keywords, whitelistData, strictMode, settings] = await Promise.all([
        BlockingService.getCategorySummary(),
        BlockingService.getCustomDomains(),
        BlockingService.getCustomKeywords(),
        BlockingService.getWhitelistDomains(),
        BlockingService.isStrictModeEnabled(),
        StorageService.getSettings(),
      ]);
      setCategories(categorySummary);
      setCustomDomains(domains);
      setCustomKeywords(keywords);
      setWhitelist(whitelistData);
      setStrictModeEnabled(strictMode);
      setContentFilterMode(settings.contentFilterMode ?? 'off');
    } catch (error) {
      console.error('Error loading blocklist:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Category toggle
  const handleToggleCategory = useCallback(async (categoryId: BlockCategoryId, currentEnabled: boolean) => {
    if (currentEnabled) {
      // Disabling - show warning
      const cat = categories.find(c => c.id === categoryId);
      const categoryName = cat?.nameFr || categoryId;
      Alert.alert(
        categoryName,
        t.categories.disableWarning.replace('{category}', categoryName),
        [
          { text: translations.common.cancel, style: 'cancel' },
          {
            text: translations.common.confirm,
            style: 'destructive',
            onPress: async () => {
              await BlockingService.setCategoryEnabled(categoryId, false);
              loadData();
            },
          },
        ]
      );
    } else {
      // Enabling - no warning needed
      await BlockingService.setCategoryEnabled(categoryId, true);
      loadData();
    }
  }, [categories, loadData]);

  // Add custom item
  const handleAddCustom = useCallback(async () => {
    if (!newItem.trim()) return;
    Keyboard.dismiss();

    if (customTab === 'domains') {
      const result = await BlockingService.addCustomDomain(newItem);
      if (result.success) {
        setNewItem('');
        loadData();
        Alert.alert(translations.common.success, t.custom.addDomainSuccess);
      } else {
        Alert.alert(translations.common.error, result.error);
      }
    } else {
      const result = await BlockingService.addCustomKeyword(newItem);
      if (result.success) {
        setNewItem('');
        loadData();
        Alert.alert(translations.common.success, t.custom.addKeywordSuccess);
      } else {
        Alert.alert(translations.common.error, result.error);
      }
    }
  }, [customTab, newItem, loadData]);

  // Remove custom item
  const handleRemoveCustom = useCallback((item: string) => {
    Alert.alert(
      translations.common.confirm,
      t.custom.deleteConfirm,
      [
        { text: translations.common.cancel, style: 'cancel' },
        {
          text: translations.common.delete,
          style: 'destructive',
          onPress: async () => {
            if (customTab === 'domains') {
              await BlockingService.removeCustomDomain(item);
            } else {
              await BlockingService.removeCustomKeyword(item);
            }
            loadData();
          },
        },
      ]
    );
  }, [customTab, loadData]);

  // Whitelist management
  const handleAddWhitelist = useCallback(async () => {
    if (!newWhitelistItem.trim()) return;
    Keyboard.dismiss();

    const result = await BlockingService.addWhitelistDomain(newWhitelistItem);
    if (result.success) {
      setNewWhitelistItem('');
      loadData();
      Alert.alert(translations.common.success, t.whitelist.addSuccess);
    } else {
      Alert.alert(translations.common.error, result.error);
    }
  }, [newWhitelistItem, loadData]);

  const handleRemoveWhitelist = useCallback((item: string) => {
    Alert.alert(
      translations.common.confirm,
      t.custom.deleteConfirm,
      [
        { text: translations.common.cancel, style: 'cancel' },
        {
          text: translations.common.delete,
          style: 'destructive',
          onPress: async () => {
            await BlockingService.removeWhitelistDomain(item);
            loadData();
          },
        },
      ]
    );
  }, [loadData]);

  // Strict mode toggle
  const handleToggleStrictMode = useCallback(async (enabled: boolean) => {
    if (enabled && !strictModeAvailable) {
      requireFeature();
      return;
    }

    if (enabled && whitelist.length === 0) {
      Alert.alert(t.strictMode.title, t.strictMode.noSitesWarning, [{ text: translations.common.ok }]);
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

  // Content filter mode change
  const handleContentFilterChange = useCallback(async (mode: ContentFilterMode) => {
    await StorageService.updateSettings({ contentFilterMode: mode });
    setContentFilterMode(mode);
  }, []);

  // Reset all
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

  const currentCustomList = customTab === 'domains' ? customDomains : customKeywords;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{t.title}</Text>
        <TouchableOpacity onPress={handleReset}>
          <MaterialCommunityIcons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
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

        {/* Whitelist section (always visible so user can add sites before enabling strict mode) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.whitelist.title}</Text>
          <Text style={styles.sectionSubtitle}>{t.whitelist.description}</Text>

          <View style={styles.addContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newWhitelistItem}
                onChangeText={setNewWhitelistItem}
                placeholder={t.whitelist.placeholder}
                placeholderTextColor={Colors.light.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleAddWhitelist}
                returnKeyType="done"
              />
            </View>
            <Button
              title={translations.common.add}
              onPress={handleAddWhitelist}
              disabled={!newWhitelistItem.trim()}
              size="medium"
            />
          </View>

          {whitelist.length === 0 ? (
            <View style={styles.emptyMini}>
              <Text style={styles.emptyMiniText}>{t.whitelist.empty}</Text>
            </View>
          ) : (
            whitelist.map((item) => (
              <View key={item} style={[styles.listItem, styles.listItemWhitelist]}>
                <View style={styles.listItemContent}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={Colors.success} />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveWhitelist(item)}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Content Filter Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.contentFilter.title}</Text>
          <Text style={styles.sectionSubtitle}>{t.contentFilter.description}</Text>

          {([
            { mode: 'off' as ContentFilterMode, label: t.contentFilter.off, desc: t.contentFilter.offDesc, icon: 'eye-off' as const },
            { mode: 'block' as ContentFilterMode, label: t.contentFilter.block, desc: t.contentFilter.blockDesc, icon: 'shield-alert' as const },
            { mode: 'blur' as ContentFilterMode, label: t.contentFilter.blur, desc: t.contentFilter.blurDesc, icon: 'blur' as const },
          ]).map(({ mode, label, desc, icon }) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.filterModeCard,
                contentFilterMode === mode && styles.filterModeCardActive,
              ]}
              onPress={() => handleContentFilterChange(mode)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.filterModeIcon,
                contentFilterMode === mode ? styles.filterModeIconActive : styles.filterModeIconInactive,
              ]}>
                <MaterialCommunityIcons
                  name={icon}
                  size={20}
                  color={contentFilterMode === mode ? Colors.primary : Colors.light.textSecondary}
                />
              </View>
              <View style={styles.filterModeText}>
                <Text style={[
                  styles.filterModeLabel,
                  contentFilterMode === mode && styles.filterModeLabelActive,
                ]}>
                  {label}
                </Text>
                <Text style={styles.filterModeDesc}>{desc}</Text>
              </View>
              <View style={[
                styles.filterModeRadio,
                contentFilterMode === mode && styles.filterModeRadioActive,
              ]}>
                {contentFilterMode === mode && <View style={styles.filterModeRadioDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.categories.title}</Text>
          <Text style={styles.sectionSubtitle}>{t.categories.subtitle}</Text>

          {categories.map((cat) => {
            const totalCount = cat.domainCount + cat.keywordCount;
            return (
              <View key={cat.id} style={[styles.categoryCard, !cat.enabled && styles.categoryCardDisabled]}>
                <View style={styles.categoryLeft}>
                  <View style={[styles.categoryIcon, cat.enabled ? styles.categoryIconEnabled : styles.categoryIconDisabled]}>
                    <MaterialCommunityIcons
                      name={cat.icon as any}
                      size={22}
                      color={cat.enabled ? Colors.primary : Colors.light.textSecondary}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, !cat.enabled && styles.categoryNameDisabled]}>
                      {cat.nameFr}
                    </Text>
                    <Text style={styles.categoryDesc}>{cat.descriptionFr}</Text>
                    <Text style={styles.categoryCount}>
                      {cat.domainCount > 0 && `${cat.domainCount} ${t.categories.sites}`}
                      {cat.domainCount > 0 && cat.keywordCount > 0 && ' + '}
                      {cat.keywordCount > 0 && `${cat.keywordCount} ${t.categories.keywords}`}
                      {totalCount === 0 && `0 ${t.categories.keywords}`}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={cat.enabled}
                  onValueChange={() => handleToggleCategory(cat.id, cat.enabled)}
                  trackColor={{ false: Colors.light.border, true: Colors.primary + '60' }}
                  thumbColor={cat.enabled ? Colors.primary : Colors.light.textSecondary}
                />
              </View>
            );
          })}
        </View>

        {/* Custom Items Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.custom.title}</Text>
          <Text style={styles.sectionSubtitle}>{t.custom.subtitle}</Text>

          {/* Custom tabs */}
          <View style={styles.customTabContainer}>
            <TouchableOpacity
              style={[styles.customTab, customTab === 'domains' && styles.customTabActive]}
              onPress={() => { setCustomTab('domains'); setNewItem(''); }}
            >
              <MaterialCommunityIcons
                name="web-off"
                size={16}
                color={customTab === 'domains' ? Colors.primary : Colors.light.textSecondary}
              />
              <Text style={[styles.customTabText, customTab === 'domains' && styles.customTabTextActive]}>
                {t.custom.domainsTab} ({customDomains.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.customTab, customTab === 'keywords' && styles.customTabActive]}
              onPress={() => { setCustomTab('keywords'); setNewItem(''); }}
            >
              <MaterialCommunityIcons
                name="text-box-search"
                size={16}
                color={customTab === 'keywords' ? Colors.primary : Colors.light.textSecondary}
              />
              <Text style={[styles.customTabText, customTab === 'keywords' && styles.customTabTextActive]}>
                {t.custom.keywordsTab} ({customKeywords.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Add input */}
          <View style={styles.addContainer}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={newItem}
                onChangeText={setNewItem}
                placeholder={customTab === 'domains' ? t.custom.domainPlaceholder : t.custom.keywordPlaceholder}
                placeholderTextColor={Colors.light.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={handleAddCustom}
                returnKeyType="done"
              />
            </View>
            <Button
              title={translations.common.add}
              onPress={handleAddCustom}
              disabled={!newItem.trim()}
              size="medium"
            />
          </View>

          {/* Custom items list */}
          {currentCustomList.length === 0 ? (
            <View style={styles.emptyCustom}>
              <MaterialCommunityIcons
                name={customTab === 'domains' ? 'web-check' : 'text-box-check'}
                size={48}
                color={Colors.light.border}
              />
              <Text style={styles.emptyCustomText}>
                {customTab === 'domains' ? t.custom.emptyDomains : t.custom.emptyKeywords}
              </Text>
              <Text style={styles.emptyCustomDesc}>{t.custom.emptyDescription}</Text>
            </View>
          ) : (
            currentCustomList.map((item) => (
              <View key={item} style={styles.listItem}>
                <View style={styles.listItemContent}>
                  <MaterialCommunityIcons
                    name={customTab === 'domains' ? 'web' : 'text-box'}
                    size={18}
                    color={Colors.light.textSecondary}
                  />
                  <Text style={styles.listItemText}>{item}</Text>
                </View>
                <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveCustom(item)}>
                  <MaterialCommunityIcons name="close-circle" size={22} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  scrollContent: {
    paddingBottom: Spacing.xl * 2,
  },
  // Strict Mode
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
  // Sections
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  // Content filter mode
  filterModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterModeCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  filterModeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  filterModeIconActive: {
    backgroundColor: Colors.primary + '15',
  },
  filterModeIconInactive: {
    backgroundColor: Colors.light.border + '40',
  },
  filterModeText: {
    flex: 1,
  },
  filterModeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  filterModeLabelActive: {
    color: Colors.primary,
  },
  filterModeDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  filterModeRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  filterModeRadioActive: {
    borderColor: Colors.primary,
  },
  filterModeRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  // Category cards
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.light.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryCardDisabled: {
    opacity: 0.6,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  categoryIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconEnabled: {
    backgroundColor: Colors.primary + '15',
  },
  categoryIconDisabled: {
    backgroundColor: Colors.light.border + '40',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  categoryNameDisabled: {
    color: Colors.light.textSecondary,
  },
  categoryDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 1,
  },
  categoryCount: {
    fontSize: 11,
    color: Colors.primary,
    marginTop: 3,
    fontWeight: '500',
  },
  // Custom tabs
  customTabContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  customTab: {
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
  customTabActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  customTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  customTabTextActive: {
    color: Colors.primary,
  },
  // Add input
  addContainer: {
    flexDirection: 'row',
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
  // List items
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
  listItemWhitelist: {
    borderColor: Colors.success + '40',
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
  // Empty states
  emptyCustom: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyCustomText: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  emptyCustomDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: Spacing.xs,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
  emptyMini: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  emptyMiniText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
});
