/**
 * Browser Screen - MuslimGuard Child Mode
 * Kid-friendly secure browsing interface with custom home page
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Text,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import type { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BrowserToolbar } from '@/components/browser/browser-toolbar';
import { BrowserHomePage } from '@/components/browser/browser-home-page';
import { BlockingService, BlockReason } from '@/services/blocking.service';
import { PrayerService } from '@/services/prayer.service';
import { StorageService } from '@/services/storage.service';
import { Colors, KidColors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { AppSettings, ScheduleData } from '@/types/storage.types';

// Cached data for synchronous blocking checks
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

const t = translations.kidBrowser;

export default function BrowserScreen() {
  const webViewRef = useRef<WebView>(null);
  const [showHomePage, setShowHomePage] = useState(true);
  const [currentUrl, setCurrentUrl] = useState('');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ isNoInternet: boolean } | null>(null);

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

  // Load and cache data
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

    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Check if URL should be blocked (synchronous using cached data)
  const shouldBlock = useCallback((url: string): { blocked: boolean; reason?: BlockReason; blockedBy?: string } => {
    const cached = cachedDataRef.current;

    // Check prayer time pause
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

        const hasAllowRule = schedule.rules.some(rule => rule.isAllowed);
        if (hasAllowRule) {
          const isAllowed = schedule.rules.some((rule) => {
            if (!rule.daysOfWeek.includes(currentDay)) return false;
            if (!rule.isAllowed) return false;
            return currentTime >= rule.startTime && currentTime <= rule.endTime;
          });

          if (!isAllowed) {
            return {
              blocked: true,
              reason: 'schedule',
              blockedBy: 'time_restriction',
            };
          }
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
    (request: any): boolean => {
      const { url } = request;

      // Allow about:blank and data URLs
      if (url === 'about:blank' || url.startsWith('data:')) {
        return true;
      }

      const blockResult = shouldBlock(url);

      if (blockResult.blocked && blockResult.reason && blockResult.blockedBy) {
        // Log the blocked attempt (async, fire and forget)
        BlockingService.logBlockedAttempt(url, blockResult.reason, blockResult.blockedBy).catch(console.error);
        // Also log to history as blocked entry with reason
        BlockingService.logNavigation(url, url, true, blockResult.reason, blockResult.blockedBy).catch(console.error);

        // Navigate to blocked screen
        router.push({
          pathname: '/child/blocked',
          params: {
            url,
            reason: blockResult.reason,
            blockedBy: blockResult.blockedBy,
          },
        });

        return false;
      }

      return true;
    },
    [shouldBlock]
  );

  // Handle navigation state change
  const handleNavigationStateChange = useCallback((navState: any) => {
    const { url, title, canGoBack: back, canGoForward: forward } = navState;

    if (url && url !== 'about:blank') {
      setCurrentUrl(url);
      setCanGoBack(back);
      setCanGoForward(forward);

      // Log to history (async, fire and forget)
      BlockingService.logNavigation(url, title || url, false).catch(console.error);
    }
  }, []);

  // Navigation handlers
  const handleGoBack = () => webViewRef.current?.goBack();
  const handleGoForward = () => webViewRef.current?.goForward();
  const handleReload = () => {
    if (isLoading) {
      webViewRef.current?.stopLoading();
    } else {
      webViewRef.current?.reload();
    }
  };

  // Return to home page
  const handleHomePress = () => {
    setShowHomePage(true);
    setCanGoBack(false);
    setCanGoForward(false);
    setIsLoading(false);
  };

  // Navigate from toolbar (detects search query vs URL)
  const handleNavigate = (input: string) => {
    const isSearchQuery = !input.includes('.') && !input.startsWith('http');
    const finalUrl = isSearchQuery
      ? `https://www.google.com/search?q=${encodeURIComponent(input)}&safe=active`
      : BlockingService.normalizeUrl(input);

    const blockResult = shouldBlock(finalUrl);
    if (blockResult.blocked && blockResult.reason && blockResult.blockedBy) {
      BlockingService.logBlockedAttempt(finalUrl, blockResult.reason, blockResult.blockedBy).catch(console.error);
      // Also log to history as blocked entry with reason
      BlockingService.logNavigation(finalUrl, finalUrl, true, blockResult.reason, blockResult.blockedBy).catch(console.error);
      router.push({
        pathname: '/child/blocked',
        params: {
          url: finalUrl,
          reason: blockResult.reason,
          blockedBy: blockResult.blockedBy,
        },
      });
      return;
    }

    setCurrentUrl(finalUrl);
    setShowHomePage(false);
  };

  // Navigate from home page (search or quick link)
  const handleHomeNavigate = (url: string) => {
    const blockResult = shouldBlock(url);
    if (blockResult.blocked && blockResult.reason && blockResult.blockedBy) {
      BlockingService.logBlockedAttempt(url, blockResult.reason, blockResult.blockedBy).catch(console.error);
      // Also log to history as blocked entry with reason
      BlockingService.logNavigation(url, url, true, blockResult.reason, blockResult.blockedBy).catch(console.error);
      router.push({
        pathname: '/child/blocked',
        params: {
          url,
          reason: blockResult.reason,
          blockedBy: blockResult.blockedBy,
        },
      });
      return;
    }

    setCurrentUrl(url);
    setShowHomePage(false);
  };

  const handleParentAccess = () => {
    router.push('/pin-entry');
  };

  // Handle WebView errors
  const handleError = useCallback((event: WebViewErrorEvent) => {
    const { nativeEvent } = event;
    const errorCode = nativeEvent.code;
    const description = nativeEvent.description || '';

    // Check if it's a network error (no internet)
    const isNoInternet =
      errorCode === -2 || // Android: ERR_INTERNET_DISCONNECTED
      errorCode === -6 || // Android: ERR_CONNECTION_REFUSED
      errorCode === -7 || // Android: ERR_CONNECTION_TIMED_OUT
      description.includes('ERR_INTERNET_DISCONNECTED') ||
      description.includes('ERR_NAME_NOT_RESOLVED') ||
      description.includes('NSURLErrorNotConnectedToInternet');

    setError({ isNoInternet });
    setIsLoading(false);
  }, []);

  // Retry loading the current URL
  const handleRetry = useCallback(() => {
    setError(null);
    webViewRef.current?.reload();
  }, []);

  // Go back to home page from error screen
  const handleErrorGoHome = useCallback(() => {
    setError(null);
    setShowHomePage(true);
    setCanGoBack(false);
    setCanGoForward(false);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <BrowserToolbar
        currentUrl={showHomePage ? '' : currentUrl}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
        onNavigate={handleNavigate}
        onParentAccess={handleParentAccess}
        onHomePress={handleHomePress}
        isOnHomePage={showHomePage}
      />

      {showHomePage ? (
        <BrowserHomePage
          onSearch={handleHomeNavigate}
          onQuickLink={handleHomeNavigate}
        />
      ) : error ? (
        // Error page
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <MaterialCommunityIcons
              name={error.isNoInternet ? 'wifi-off' : 'alert-circle-outline'}
              size={80}
              color={KidColors.safeGreen}
            />
          </View>
          <Text style={styles.errorTitle}>
            {t.error.title}
          </Text>
          <Text style={styles.errorHeading}>
            {error.isNoInternet ? t.error.noInternet : t.error.loadFailed}
          </Text>
          <Text style={styles.errorDescription}>
            {error.isNoInternet ? t.error.noInternetDesc : t.error.loadFailedDesc}
          </Text>
          <View style={styles.errorButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.errorButton,
                styles.errorButtonPrimary,
                pressed && styles.errorButtonPressed,
              ]}
              onPress={handleRetry}
            >
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.errorButtonTextPrimary}>{t.error.retry}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.errorButton,
                styles.errorButtonSecondary,
                pressed && styles.errorButtonPressed,
              ]}
              onPress={handleErrorGoHome}
            >
              <MaterialCommunityIcons name="home" size={20} color={Colors.primary} />
              <Text style={styles.errorButtonTextSecondary}>{t.error.goHome}</Text>
            </Pressable>
          </View>
        </View>
      ) : currentUrl ? (
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          style={styles.webview}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          onNavigationStateChange={handleNavigationStateChange}
          onLoadStart={() => {
            setIsLoading(true);
            setError(null);
          }}
          onLoadEnd={() => setIsLoading(false)}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          setSupportMultipleWindows={false}
          allowsBackForwardNavigationGestures={false}
          mediaPlaybackRequiresUserAction={true}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KidColors.homeBg,
  },
  webview: {
    flex: 1,
  },
  // Error page styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    backgroundColor: KidColors.homeBg,
  },
  errorIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: KidColors.safeGreen + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  errorHeading: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  errorButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  errorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minWidth: 140,
  },
  errorButtonPrimary: {
    backgroundColor: Colors.primary,
  },
  errorButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  errorButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  errorButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  errorButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
});
