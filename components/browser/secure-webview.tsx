/**
 * SecureWebView Component - MuslimGuard
 * WebView with real-time URL/keyword blocking
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { BlockingService, BlockCheckResult, BlockReason } from '@/services/blocking.service';
import { PrayerService } from '@/services/prayer.service';
import { StorageService } from '@/services/storage.service';
import { Colors } from '@/constants/theme';
import { AppSettings, ScheduleData } from '@/types/storage.types';

interface SecureWebViewProps {
  initialUrl?: string;
  onNavigationChange?: (url: string, title: string) => void;
  onBlocked?: (url: string, reason: string, blockedBy: string) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

// Cached data for synchronous access
interface CachedData {
  settings: AppSettings | null;
  schedule: ScheduleData | null;
  blockedDomains: string[];
  blockedKeywords: string[];
  whitelistDomains: string[]; // For strict mode
  strictModeEnabled: boolean;
  prayerPaused: boolean;
  prayerPausedBy: string | null;
}

export function SecureWebView({
  initialUrl = 'https://www.google.com',
  onNavigationChange,
  onBlocked,
  onLoadStart,
  onLoadEnd,
}: SecureWebViewProps) {
  const webViewRef = useRef<WebView>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUrl, setCurrentUrl] = useState(initialUrl);

  // Cached data for synchronous blocking checks
  const cachedDataRef = useRef<CachedData>({
    settings: null,
    schedule: null,
    blockedDomains: [],
    blockedKeywords: [],
    whitelistDomains: [],
    strictModeEnabled: false,
    prayerPaused: false,
    prayerPausedBy: null,
  });

  // Load and cache data on mount and periodically
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settings, schedule, domains, keywords, whitelist, strictMode, prayerStatus] = await Promise.all([
          StorageService.getSettings(),
          StorageService.getSchedule(),
          BlockingService.getBlockedDomains(),
          BlockingService.getBlockedKeywords(),
          BlockingService.getWhitelistDomains(),
          BlockingService.isStrictModeEnabled(),
          PrayerService.isInPrayerPauseWindow(),
        ]);

        cachedDataRef.current = {
          settings,
          schedule,
          blockedDomains: domains,
          blockedKeywords: keywords,
          whitelistDomains: whitelist,
          strictModeEnabled: strictMode,
          prayerPaused: prayerStatus.isPaused,
          prayerPausedBy: prayerStatus.currentPrayer || null,
        };
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    // Initial load
    loadData();

    // Refresh every 30 seconds for prayer times and schedule
    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);
  }, []);

  // Check if URL should be blocked (synchronous using cached data)
  const shouldBlock = useCallback((url: string): BlockCheckResult => {
    const cached = cachedDataRef.current;

    // First check prayer time pause
    if (cached.prayerPaused) {
      return {
        blocked: true,
        reason: 'prayer',
        blockedBy: cached.prayerPausedBy || 'prayer',
      };
    }

    // Check schedule restrictions
    if (cached.settings?.scheduleEnabled && cached.schedule) {
      const schedule = cached.schedule;
      if (schedule.enabled && !schedule.temporaryOverride) {
        const now = new Date();
        const currentDay = now.getDay();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        // Check if current time is outside allowed hours
        const isAllowed = schedule.rules.some((rule) => {
          if (!rule.daysOfWeek.includes(currentDay)) return false;
          if (!rule.isAllowed) return false;
          return currentTime >= rule.startTime && currentTime <= rule.endTime;
        });

        if (!isAllowed && schedule.rules.length > 0) {
          return {
            blocked: true,
            reason: 'schedule',
            blockedBy: 'time_restriction',
          };
        }
      }
    }

    // Check URL blocklist (synchronous with cached data)
    const urlLower = url.toLowerCase();

    // Extract domain
    let domain: string | null = null;
    try {
      let urlToParse = url;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        urlToParse = 'https://' + url;
      }
      const urlObj = new URL(urlToParse);
      domain = urlObj.hostname.toLowerCase();
    } catch {
      domain = null;
    }

    // Check strict mode (whitelist) - block everything not in whitelist
    if (cached.strictModeEnabled && domain) {
      const baseDomain = domain.replace(/^www\./, '');
      let isWhitelisted = false;

      for (const whitelistedDomain of cached.whitelistDomains) {
        const whitelistedBase = whitelistedDomain.replace(/^www\./, '');

        // Exact match
        if (domain === whitelistedDomain || baseDomain === whitelistedBase) {
          isWhitelisted = true;
          break;
        }

        // Subdomain match (e.g., fr.wikipedia.org matches wikipedia.org)
        if (domain.endsWith('.' + whitelistedDomain) || domain.endsWith('.' + whitelistedBase)) {
          isWhitelisted = true;
          break;
        }
      }

      if (!isWhitelisted) {
        return {
          blocked: true,
          reason: 'whitelist',
          blockedBy: 'Mode strict activé',
        };
      }
    }

    // Check domains blocklist (only if not in strict mode)
    if (!cached.strictModeEnabled && domain) {
      const baseDomain = domain.replace(/^www\./, '');

      for (const blockedDomain of cached.blockedDomains) {
        const blockedBase = blockedDomain.replace(/^www\./, '');

        if (domain === blockedDomain || baseDomain === blockedBase) {
          return { blocked: true, reason: 'domain', blockedBy: blockedDomain };
        }

        if (domain.endsWith('.' + blockedDomain) || domain.endsWith('.' + blockedBase)) {
          return { blocked: true, reason: 'domain', blockedBy: blockedDomain };
        }
      }
    }

    // Check keywords (applies even in strict mode for extra safety)
    for (const keyword of cached.blockedKeywords) {
      if (urlLower.includes(keyword.toLowerCase())) {
        return { blocked: true, reason: 'keyword', blockedBy: keyword };
      }
    }

    return { blocked: false };
  }, []);

  // Handle navigation request
  const handleShouldStartLoad = useCallback(
    (event: WebViewNavigation): boolean => {
      const { url } = event;

      // Allow about:blank and internal URLs
      if (url === 'about:blank' || url.startsWith('data:')) {
        return true;
      }

      const blockResult = shouldBlock(url);

      if (blockResult.blocked) {
        // Log the blocked attempt (async, fire and forget)
        if (blockResult.reason && blockResult.blockedBy) {
          BlockingService.logBlockedAttempt(
            url,
            blockResult.reason,
            blockResult.blockedBy
          ).catch(console.error);

          // Also log to history as blocked entry with reason
          BlockingService.logNavigation(url, url, true, blockResult.reason, blockResult.blockedBy).catch(console.error);
        }

        // Notify parent component
        onBlocked?.(
          url,
          blockResult.reason || 'unknown',
          blockResult.blockedBy || 'unknown'
        );

        return false; // Block the navigation
      }

      return true; // Allow the navigation
    },
    [shouldBlock, onBlocked]
  );

  // Handle navigation state change
  const handleNavigationStateChange = useCallback(
    (navState: WebViewNavigation) => {
      const { url, title } = navState;

      if (url && url !== 'about:blank') {
        setCurrentUrl(url);

        // Log to history (async, fire and forget)
        BlockingService.logNavigation(url, title || url, false).catch(console.error);

        // Notify parent
        onNavigationChange?.(url, title || url);
      }
    },
    [onNavigationChange]
  );

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
    onLoadEnd?.();
  }, [onLoadEnd]);

  // Exposed methods
  const goBack = () => webViewRef.current?.goBack();
  const goForward = () => webViewRef.current?.goForward();
  const reload = () => webViewRef.current?.reload();
  const loadUrl = (url: string) => {
    const normalizedUrl = BlockingService.normalizeUrl(url);
    setCurrentUrl(normalizedUrl);
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: currentUrl }}
        style={styles.webview}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onNavigationStateChange={handleNavigationStateChange}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        // Security settings
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        // Disable features that could bypass controls
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={true}
        // Safe browsing
        setSupportMultipleWindows={false}
        allowsBackForwardNavigationGestures={false}
        // Rendering
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
      />
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      )}
    </View>
  );
}

// Export ref methods type
export interface SecureWebViewRef {
  goBack: () => void;
  goForward: () => void;
  reload: () => void;
  loadUrl: (url: string) => void;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
});

export default SecureWebView;
