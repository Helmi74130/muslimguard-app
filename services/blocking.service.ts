/**
 * Blocking Service for MuslimGuard
 * Handles URL and keyword blocking logic for the secure browser
 * Uses category-based blocking: default categories + custom parent items
 */

import {
  BLOCK_CATEGORIES,
  ALL_CATEGORY_IDS,
  getDomainsForCategories,
  getKeywordsForCategories,
} from '@/constants/default-blocklist';
import type { BlockCategoryId } from '@/constants/default-blocklist';
import { StorageService } from './storage.service';

// Block result types
export type BlockReason = 'domain' | 'keyword' | 'prayer' | 'schedule' | 'whitelist';

export interface BlockCheckResult {
  blocked: boolean;
  reason?: BlockReason;
  blockedBy?: string; // The specific domain or keyword that triggered the block
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    // Add protocol if missing
    let urlToParse = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      urlToParse = 'https://' + url;
    }

    const urlObj = new URL(urlToParse);
    return urlObj.hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Get base domain (removes www and subdomains for comparison)
 */
function getBaseDomain(domain: string): string {
  // Remove www prefix
  let base = domain.replace(/^www\./, '');

  // For common TLDs, extract the main domain
  const parts = base.split('.');
  if (parts.length > 2) {
    // Keep last 2 parts for most domains (e.g., example.com)
    // Keep last 3 for country-specific TLDs (e.g., example.co.uk)
    const countryTLDs = ['co.uk', 'com.au', 'co.nz', 'com.br', 'co.jp'];
    const lastThree = parts.slice(-3).join('.');

    if (countryTLDs.some((tld) => lastThree.endsWith(tld))) {
      return parts.slice(-3).join('.');
    }
    return parts.slice(-2).join('.');
  }

  return base;
}

/**
 * Blocking Service
 */
export const BlockingService = {
  /**
   * Check if a URL should be blocked
   */
  async shouldBlockUrl(url: string): Promise<BlockCheckResult> {
    if (!url) {
      return { blocked: false };
    }

    const urlLower = url.toLowerCase();
    const domain = extractDomain(url);

    // 0. Check if strict mode (whitelist) is enabled
    const isStrictMode = await this.isStrictModeEnabled();
    if (isStrictMode && domain) {
      const isWhitelisted = await this.isUrlWhitelisted(url);
      if (!isWhitelisted) {
        return {
          blocked: true,
          reason: 'whitelist',
          blockedBy: 'Mode strict activé',
        };
      }
      // URL is whitelisted, continue with other checks
    }

    // 1. Check domain blocklist (only if not in strict mode, as whitelist overrides blocklist)
    if (!isStrictMode && domain) {
      const blockedDomains = await this.getBlockedDomains();
      const baseDomain = getBaseDomain(domain);

      for (const blockedDomain of blockedDomains) {
        const blockedBase = getBaseDomain(blockedDomain);

        // Exact match
        if (domain === blockedDomain || baseDomain === blockedBase) {
          return {
            blocked: true,
            reason: 'domain',
            blockedBy: blockedDomain,
          };
        }

        // Subdomain match (e.g., video.pornhub.com matches pornhub.com)
        if (domain.endsWith('.' + blockedDomain) || domain.endsWith('.' + blockedBase)) {
          return {
            blocked: true,
            reason: 'domain',
            blockedBy: blockedDomain,
          };
        }
      }
    }

    // 2. Check keyword blocklist (applies even in strict mode for extra safety)
    // Uses word boundary (\b) at the start to avoid false positives:
    // \bsex matches "sex", "sexual" but NOT "essex"
    // \bbet matches "bet", "betting" but NOT "alphabet"
    const blockedKeywords = await this.getBlockedKeywords();
    for (const keyword of blockedKeywords) {
      try {
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp('\\b' + escaped, 'i');
        if (regex.test(urlLower)) {
          return {
            blocked: true,
            reason: 'keyword',
            blockedBy: keyword,
          };
        }
      } catch {
        // Fallback to includes if regex construction fails
        if (urlLower.includes(keyword.toLowerCase())) {
          return {
            blocked: true,
            reason: 'keyword',
            blockedBy: keyword,
          };
        }
      }
    }

    // Not blocked
    return { blocked: false };
  },

  // ==================== CATEGORY MANAGEMENT ====================

  /**
   * Get enabled category IDs
   */
  async getEnabledCategories(): Promise<BlockCategoryId[]> {
    const disabled = await StorageService.getDisabledCategories();
    return ALL_CATEGORY_IDS.filter(id => !disabled.includes(id));
  },

  /**
   * Get disabled category IDs
   */
  async getDisabledCategories(): Promise<BlockCategoryId[]> {
    const disabled = await StorageService.getDisabledCategories();
    return disabled as BlockCategoryId[];
  },

  /**
   * Check if a specific category is enabled
   */
  async isCategoryEnabled(categoryId: BlockCategoryId): Promise<boolean> {
    const disabled = await StorageService.getDisabledCategories();
    return !disabled.includes(categoryId);
  },

  /**
   * Enable or disable a category
   */
  async setCategoryEnabled(categoryId: BlockCategoryId, enabled: boolean): Promise<void> {
    const disabled = await StorageService.getDisabledCategories();
    if (enabled) {
      const newDisabled = disabled.filter(id => id !== categoryId);
      await StorageService.setDisabledCategories(newDisabled);
    } else {
      if (!disabled.includes(categoryId)) {
        await StorageService.setDisabledCategories([...disabled, categoryId]);
      }
    }
  },

  /**
   * Get category summary for UI (name, counts, enabled status)
   */
  async getCategorySummary(): Promise<Array<{
    id: BlockCategoryId;
    nameFr: string;
    descriptionFr: string;
    icon: string;
    domainCount: number;
    keywordCount: number;
    enabled: boolean;
  }>> {
    const disabled = await StorageService.getDisabledCategories();
    return BLOCK_CATEGORIES.map(cat => ({
      id: cat.id,
      nameFr: cat.nameFr,
      descriptionFr: cat.descriptionFr,
      icon: cat.icon,
      domainCount: cat.domains.length,
      keywordCount: cat.keywords.length,
      enabled: !disabled.includes(cat.id),
    }));
  },

  // ==================== COMBINED LISTS (for browser) ====================

  /**
   * Get all blocked domains (enabled categories + custom)
   * Used by browser for blocking checks
   */
  async getBlockedDomains(): Promise<string[]> {
    const [enabled, custom] = await Promise.all([
      this.getEnabledCategories(),
      StorageService.getCustomDomains(),
    ]);
    const categoryDomains = getDomainsForCategories(enabled);
    return [...new Set([...categoryDomains, ...custom])];
  },

  /**
   * Get all blocked keywords (enabled categories + custom)
   * Used by browser for blocking checks
   */
  async getBlockedKeywords(): Promise<string[]> {
    const [enabled, custom] = await Promise.all([
      this.getEnabledCategories(),
      StorageService.getCustomKeywords(),
    ]);
    const categoryKeywords = getKeywordsForCategories(enabled);
    return [...new Set([...categoryKeywords, ...custom])];
  },

  // ==================== CUSTOM ITEMS (parent-added) ====================

  /**
   * Get custom domains added by parent
   */
  async getCustomDomains(): Promise<string[]> {
    return StorageService.getCustomDomains();
  },

  /**
   * Get custom keywords added by parent
   */
  async getCustomKeywords(): Promise<string[]> {
    return StorageService.getCustomKeywords();
  },

  /**
   * Add a custom domain
   */
  async addCustomDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    const normalized = domain.toLowerCase().trim();

    if (!normalized || normalized.length < 3) {
      return { success: false, error: 'Invalid domain' };
    }

    // Remove protocol if present
    let cleanDomain = normalized
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    const current = await StorageService.getCustomDomains();
    if (current.includes(cleanDomain)) {
      return { success: false, error: 'Domain already blocked' };
    }

    await StorageService.setCustomDomains([cleanDomain, ...current]);
    return { success: true };
  },

  /**
   * Remove a custom domain
   */
  async removeCustomDomain(domain: string): Promise<void> {
    const current = await StorageService.getCustomDomains();
    const normalized = domain.toLowerCase().trim();
    await StorageService.setCustomDomains(current.filter(d => d !== normalized));
  },

  /**
   * Add a custom keyword
   */
  async addCustomKeyword(keyword: string): Promise<{ success: boolean; error?: string }> {
    const normalized = keyword.toLowerCase().trim();

    if (!normalized || normalized.length < 3) {
      return { success: false, error: 'Keyword must be at least 3 characters' };
    }

    const current = await StorageService.getCustomKeywords();
    if (current.includes(normalized)) {
      return { success: false, error: 'Keyword already blocked' };
    }

    await StorageService.setCustomKeywords([normalized, ...current]);
    return { success: true };
  },

  /**
   * Remove a custom keyword
   */
  async removeCustomKeyword(keyword: string): Promise<void> {
    const current = await StorageService.getCustomKeywords();
    const normalized = keyword.toLowerCase().trim();
    await StorageService.setCustomKeywords(current.filter(k => k !== normalized));
  },

  // ==================== LEGACY COMPAT (kept for dashboard/other screens) ====================

  /**
   * Add a domain to blocklist (redirects to custom)
   */
  async addBlockedDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    return this.addCustomDomain(domain);
  },

  /**
   * Remove a domain from blocklist (removes from custom)
   */
  async removeBlockedDomain(domain: string): Promise<void> {
    return this.removeCustomDomain(domain);
  },

  /**
   * Add a keyword to blocklist (redirects to custom)
   */
  async addBlockedKeyword(keyword: string): Promise<{ success: boolean; error?: string }> {
    return this.addCustomKeyword(keyword);
  },

  /**
   * Remove a keyword from blocklist (removes from custom)
   */
  async removeBlockedKeyword(keyword: string): Promise<void> {
    return this.removeCustomKeyword(keyword);
  },

  /**
   * Reset to defaults (re-enable all categories, clear custom items)
   */
  async resetToDefaults(): Promise<void> {
    await Promise.all([
      StorageService.setDisabledCategories([]),
      StorageService.setCustomDomains([]),
      StorageService.setCustomKeywords([]),
    ]);
  },

  // ==================== STRICT MODE (WHITELIST) ====================

  /**
   * Check if strict mode is enabled
   */
  async isStrictModeEnabled(): Promise<boolean> {
    const settings = await StorageService.getSettings();
    return settings.strictModeEnabled || false;
  },

  /**
   * Enable or disable strict mode
   */
  async setStrictMode(enabled: boolean): Promise<void> {
    await StorageService.updateSettings({ strictModeEnabled: enabled });
  },

  /**
   * Check if URL is whitelisted
   */
  async isUrlWhitelisted(url: string): Promise<boolean> {
    const domain = extractDomain(url);
    if (!domain) return false;

    const whitelistDomains = await this.getWhitelistDomains();
    const baseDomain = getBaseDomain(domain);

    for (const whitelistedDomain of whitelistDomains) {
      const whitelistedBase = getBaseDomain(whitelistedDomain);

      // Exact match
      if (domain === whitelistedDomain || baseDomain === whitelistedBase) {
        return true;
      }

      // Subdomain match (e.g., fr.wikipedia.org matches wikipedia.org)
      if (domain.endsWith('.' + whitelistedDomain) || domain.endsWith('.' + whitelistedBase)) {
        return true;
      }
    }

    return false;
  },

  /**
   * Get all whitelisted domains
   */
  async getWhitelistDomains(): Promise<string[]> {
    return StorageService.getWhitelistDomains();
  },

  /**
   * Add a domain to whitelist
   */
  async addWhitelistDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    const normalized = domain.toLowerCase().trim();

    if (!normalized || normalized.length < 3) {
      return { success: false, error: 'Domaine invalide' };
    }

    let cleanDomain = normalized
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    const current = await this.getWhitelistDomains();
    if (current.includes(cleanDomain)) {
      return { success: false, error: 'Ce site est déjà autorisé' };
    }

    await StorageService.addWhitelistDomain(cleanDomain);
    return { success: true };
  },

  /**
   * Remove a domain from whitelist
   */
  async removeWhitelistDomain(domain: string): Promise<void> {
    await StorageService.removeWhitelistDomain(domain);
  },

  /**
   * Get count of whitelisted domains
   */
  async getWhitelistDomainsCount(): Promise<number> {
    const domains = await this.getWhitelistDomains();
    return domains.length;
  },

  /**
   * Get total count of blocked domains (categories + custom)
   */
  async getBlockedDomainsCount(): Promise<number> {
    const domains = await this.getBlockedDomains();
    return domains.length;
  },

  /**
   * Get total count of blocked keywords (categories + custom)
   */
  async getBlockedKeywordsCount(): Promise<number> {
    const keywords = await this.getBlockedKeywords();
    return keywords.length;
  },

  /**
   * Log a blocked attempt
   */
  async logBlockedAttempt(url: string, reason: BlockReason, blockedBy: string): Promise<void> {
    await StorageService.logBlockedAttempt({
      url,
      timestamp: Date.now(),
      reason,
      blockedBy,
    });
  },

  /**
   * Log a navigation (for history)
   */
  async logNavigation(
    url: string,
    title: string,
    wasBlocked: boolean = false,
    blockReason?: BlockReason,
    blockedBy?: string
  ): Promise<void> {
    await StorageService.addHistoryEntry({
      url,
      title: title || url,
      timestamp: Date.now(),
      wasBlocked,
      blockReason,
      blockedBy,
    });
  },

  /**
   * Get blocked attempts count for today
   */
  async getTodayBlockedCount(): Promise<number> {
    const attempts = await StorageService.getBlockedAttempts();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();

    return attempts.filter((a) => a.timestamp >= todayStart).length;
  },

  /**
   * Validate URL format
   */
  isValidUrl(url: string): boolean {
    try {
      let urlToParse = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToParse = 'https://' + url;
      }
      new URL(urlToParse);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Normalize URL (add https if missing)
   */
  normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  },
};

export default BlockingService;
