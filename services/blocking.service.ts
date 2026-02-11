/**
 * Blocking Service for MuslimGuard
 * Handles URL and keyword blocking logic for the secure browser
 */

import {
  DEFAULT_BLOCKED_DOMAINS,
  DEFAULT_BLOCKED_KEYWORDS,
} from '@/constants/default-blocklist';
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
    const blockedKeywords = await this.getBlockedKeywords();
    for (const keyword of blockedKeywords) {
      if (urlLower.includes(keyword.toLowerCase())) {
        return {
          blocked: true,
          reason: 'keyword',
          blockedBy: keyword,
        };
      }
    }

    // Not blocked
    return { blocked: false };
  },

  /**
   * Get all blocked domains (user list only - starts empty)
   */
  async getBlockedDomains(): Promise<string[]> {
    return StorageService.getBlockedDomains();
  },

  /**
   * Get all blocked keywords (user list only - starts empty)
   */
  async getBlockedKeywords(): Promise<string[]> {
    return StorageService.getBlockedKeywords();
  },

  /**
   * Load default blocked domains
   */
  async loadDefaultDomains(): Promise<void> {
    const current = await StorageService.getBlockedDomains();
    // Merge with existing to avoid duplicates
    const merged = [...new Set([...DEFAULT_BLOCKED_DOMAINS, ...current])];
    await StorageService.setBlockedDomains(merged);
  },

  /**
   * Load default blocked keywords
   */
  async loadDefaultKeywords(): Promise<void> {
    const current = await StorageService.getBlockedKeywords();
    // Merge with existing to avoid duplicates
    const merged = [...new Set([...DEFAULT_BLOCKED_KEYWORDS, ...current])];
    await StorageService.setBlockedKeywords(merged);
  },

  /**
   * Add a domain to blocklist
   */
  async addBlockedDomain(domain: string): Promise<{ success: boolean; error?: string }> {
    const normalized = domain.toLowerCase().trim();

    // Validate domain format
    if (!normalized || normalized.length < 3) {
      return { success: false, error: 'Invalid domain' };
    }

    // Remove protocol if present
    let cleanDomain = normalized
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]; // Remove path

    // Check if already blocked
    const current = await this.getBlockedDomains();
    if (current.includes(cleanDomain)) {
      return { success: false, error: 'Domain already blocked' };
    }

    // Persist the full list (defaults + new or existing + new)
    // Add to beginning for better UX
    const newList = [cleanDomain, ...current];
    await StorageService.setBlockedDomains(newList);

    return { success: true };
  },

  /**
   * Remove a domain from blocklist
   */
  async removeBlockedDomain(domain: string): Promise<void> {
    const current = await this.getBlockedDomains();
    const normalized = domain.toLowerCase().trim();
    const newList = current.filter((d) => d !== normalized);
    await StorageService.setBlockedDomains(newList);
  },

  /**
   * Add a keyword to blocklist
   */
  async addBlockedKeyword(keyword: string): Promise<{ success: boolean; error?: string }> {
    const normalized = keyword.toLowerCase().trim();

    // Validate keyword
    if (!normalized || normalized.length < 3) {
      return { success: false, error: 'Keyword must be at least 3 characters' };
    }

    // Check if already blocked
    const current = await this.getBlockedKeywords();
    if (current.includes(normalized)) {
      return { success: false, error: 'Keyword already blocked' };
    }

    // Persist the full list (defaults + new or existing + new)
    // Add to beginning for better UX
    const newList = [normalized, ...current];
    await StorageService.setBlockedKeywords(newList);

    return { success: true };
  },

  /**
   * Remove a keyword from blocklist
   */
  async removeBlockedKeyword(keyword: string): Promise<void> {
    const current = await this.getBlockedKeywords();
    const normalized = keyword.toLowerCase().trim();
    const newList = current.filter((k) => k !== normalized);
    await StorageService.setBlockedKeywords(newList);
  },

  /**
   * Reset blocklist to defaults
   */
  async resetToDefaults(): Promise<void> {
    await StorageService.setBlockedDomains(DEFAULT_BLOCKED_DOMAINS);
    await StorageService.setBlockedKeywords(DEFAULT_BLOCKED_KEYWORDS);
  },

  /**
   * Clear all blocked domains (empty list)
   */
  async clearBlockedDomains(): Promise<void> {
    await StorageService.setBlockedDomains([]);
  },

  /**
   * Clear all blocked keywords (empty list)
   */
  async clearBlockedKeywords(): Promise<void> {
    await StorageService.setBlockedKeywords([]);
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

    // Validate domain format
    if (!normalized || normalized.length < 3) {
      return { success: false, error: 'Domaine invalide' };
    }

    // Remove protocol if present
    let cleanDomain = normalized
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]; // Remove path

    // Check if already whitelisted
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
   * Get count of blocked domains
   */
  async getBlockedDomainsCount(): Promise<number> {
    const domains = await this.getBlockedDomains();
    return domains.length;
  },

  /**
   * Get count of blocked keywords
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
