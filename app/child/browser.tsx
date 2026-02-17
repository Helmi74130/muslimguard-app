/**
 * Browser Screen - MuslimGuard Child Mode
 * Kid-friendly secure browsing interface with custom home page
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  StatusBar,
  View,
  Text,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';
import type { WebViewErrorEvent } from 'react-native-webview/lib/WebViewTypes';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { BrowserToolbar } from '@/components/browser/browser-toolbar';
import { BrowserHomePage } from '@/components/browser/browser-home-page';
import { BlockingService, BlockReason } from '@/services/blocking.service';
import { PrayerService } from '@/services/prayer.service';
import { StorageService } from '@/services/storage.service';
import { KioskService } from '@/services/kiosk.service';
import { Colors, KidColors, Spacing, BorderRadius } from '@/constants/theme';
import { translations } from '@/constants/translations';
import { READING_MODE_SCRIPT, READING_MODE_PRELOAD_SCRIPT } from '@/constants/reading-mode-script';
import { generateContentFilterScript } from '@/constants/content-filter-script';
import { AppSettings, ScheduleData, ContentFilterMode } from '@/types/storage.types';

// Cached data for synchronous blocking checks
interface CachedData {
  settings: AppSettings | null;
  schedule: ScheduleData | null;
  blockedDomains: string[];
  blockedKeywords: string[];
  whitelistDomains: string[]; // For strict mode
  strictModeEnabled: boolean;
  readingModeEnabled: boolean;
  contentFilterMode: ContentFilterMode;
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
  const [readingMode, setReadingMode] = useState(false);

  // TTS state
  const ttsTextRef = useRef<string>('');
  const ttsChunksRef = useRef<string[]>([]);
  const ttsChunkIndexRef = useRef(0);
  const ttsSpeakingRef = useRef(false);

  // Cached data for synchronous blocking checks
  const cachedDataRef = useRef<CachedData>({
    settings: null,
    schedule: null,
    blockedDomains: [],
    blockedKeywords: [],
    whitelistDomains: [],
    strictModeEnabled: false,
    readingModeEnabled: false,
    contentFilterMode: 'off',
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
          readingModeEnabled: settings?.readingModeEnabled ?? false,
          contentFilterMode: settings?.contentFilterMode ?? 'off',
          prayerPaused: prayerStatus.isPaused,
          prayerPausedBy: prayerStatus.currentPrayer || null,
        };
        setReadingMode(settings?.readingModeEnabled ?? false);
      } catch (error) {
        console.error('Error loading cached data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000);

    // Activate kiosk mode if enabled
    KioskService.activateKiosk().catch(() => {});

    return () => clearInterval(interval);
  }, []);

  // When readingMode loads (async), inject scripts into already-loaded page
  useEffect(() => {
    if (readingMode && !showHomePage && currentUrl) {
      webViewRef.current?.injectJavaScript(READING_MODE_PRELOAD_SCRIPT);
      webViewRef.current?.injectJavaScript(READING_MODE_SCRIPT);
    }
  }, [readingMode]);

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
    // In blur mode, skip URL keyword blocking - let the page load and
    // the content filter script will blur matching text on the page.
    // In off/block mode, block the URL entirely if a keyword is found.
    if (cached.contentFilterMode !== 'blur') {
      for (const keyword of cached.blockedKeywords) {
        try {
          const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('\\b' + escaped, 'i');
          if (regex.test(urlLower)) {
            return { blocked: true, reason: 'keyword', blockedBy: keyword };
          }
        } catch {
          if (urlLower.includes(keyword.toLowerCase())) {
            return { blocked: true, reason: 'keyword', blockedBy: keyword };
          }
        }
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

      // Block Google Images/Videos when reading mode is active
      if (readingMode && /google\.\w+\/search/.test(url)) {
        const params = new URL(url).searchParams;
        const tbm = params.get('tbm');
        if (tbm === 'isch' || tbm === 'vid') {
          return false;
        }
      }

      const blockResult = shouldBlock(url);

      if (blockResult.blocked && blockResult.reason && blockResult.blockedBy) {
        // Log the blocked attempt (async, fire and forget)
        BlockingService.logBlockedAttempt(url, blockResult.reason, blockResult.blockedBy).catch(console.error);
        // Also log to history as blocked entry with reason
        BlockingService.logNavigation(url, url, true, blockResult.reason, blockResult.blockedBy).catch(console.error);

        // Force WebView to stop loading and go back (Android workaround:
        // returning false from onShouldStartLoadWithRequest doesn't always
        // prevent the WebView from navigating on Android)
        webViewRef.current?.stopLoading();
        if (canGoBack) {
          webViewRef.current?.goBack();
        }

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
      // Safety net: if WebView somehow navigated to a blocked URL
      // (Android doesn't always respect onShouldStartLoadWithRequest returning false),
      // force it back immediately
      const blockResult = shouldBlock(url);
      if (blockResult.blocked) {
        webViewRef.current?.stopLoading();
        if (back) {
          webViewRef.current?.goBack();
        } else {
          setShowHomePage(true);
        }
        return;
      }

      setCurrentUrl(url);
      setCanGoBack(back);
      setCanGoForward(forward);

      // Log to history (async, fire and forget)
      BlockingService.logNavigation(url, title || url, false).catch(console.error);
    }
  }, [shouldBlock]);

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
    Speech.stop();
    ttsSpeakingRef.current = false;
    setShowHomePage(true);
    setCanGoBack(false);
    setCanGoForward(false);
    setIsLoading(false);
  };

  // Navigate from toolbar (detects search query vs URL)

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

  // Split text into chunks for TTS (sentence-aware)
  const splitTTSText = useCallback((text: string, maxLen: number): string[] => {
    const result: string[] = [];
    const sentences = text.split(/(?<=[.!?;:])\s+/);
    let current = '';
    for (const sentence of sentences) {
      if ((current + ' ' + sentence).length > maxLen && current.length > 0) {
        result.push(current.trim());
        current = sentence;
      } else {
        current += (current ? ' ' : '') + sentence;
      }
    }
    if (current.trim()) result.push(current.trim());
    return result.length > 0 ? result : [text];
  }, []);

  // Speak a chunk and chain to next
  const speakChunk = useCallback((index: number, rate: number) => {
    const chunks = ttsChunksRef.current;
    if (index >= chunks.length) {
      ttsSpeakingRef.current = false;
      ttsChunkIndexRef.current = 0;
      webViewRef.current?.injectJavaScript('window.__ttsOnDone && window.__ttsOnDone(); true;');
      return;
    }
    ttsChunkIndexRef.current = index;
    const pct = (index / chunks.length) * 100;
    webViewRef.current?.injectJavaScript(
      'window.__ttsUpdateProgress && window.__ttsUpdateProgress(' + pct + '); true;'
    );

    Speech.speak(chunks[index], {
      language: 'fr-FR',
      rate,
      onDone: () => {
        if (ttsSpeakingRef.current) {
          speakChunk(index + 1, rate);
        }
      },
      onError: () => {
        if (ttsSpeakingRef.current) {
          speakChunk(index + 1, rate);
        }
      },
    });
  }, []);

  // Stop TTS when leaving the page
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Handle messages from WebView (TTS commands)
  const handleWebViewMessage = useCallback((event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (!data.type) return;

      switch (data.type) {
        case 'tts-init':
          ttsTextRef.current = data.text || '';
          ttsChunksRef.current = splitTTSText(data.text || '', 200);
          ttsChunkIndexRef.current = 0;
          ttsSpeakingRef.current = false;
          break;
        case 'tts-play':
          Speech.stop();
          ttsSpeakingRef.current = true;
          speakChunk(ttsChunkIndexRef.current, data.rate || 1);
          break;
        case 'tts-stop':
          Speech.stop();
          ttsSpeakingRef.current = false;
          ttsChunkIndexRef.current = 0;
          break;
        case 'content-blocked': {
          // Content filter detected a blocked keyword in page content
          const blockedKeyword = data.keyword || 'contenu';
          webViewRef.current?.stopLoading();
          BlockingService.logBlockedAttempt(currentUrl, 'keyword', blockedKeyword).catch(console.error);
          BlockingService.logNavigation(currentUrl, currentUrl, true, 'keyword', blockedKeyword).catch(console.error);
          router.push({
            pathname: '/child/blocked',
            params: {
              url: currentUrl,
              reason: 'keyword',
              blockedBy: blockedKeyword,
            },
          });
          break;
        }
      }
    } catch {}
  }, [splitTTSText, speakChunk]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <BrowserToolbar
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        onGoBack={handleGoBack}
        onGoForward={handleGoForward}
        onReload={handleReload}
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
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: currentUrl }}
            style={styles.webview}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            onNavigationStateChange={handleNavigationStateChange}
            onLoadStart={() => {
              setIsLoading(true);
              setError(null);
              // Stop any ongoing TTS on new navigation
              Speech.stop();
              ttsSpeakingRef.current = false;
              // Inject Phase 1 CSS on every navigation start as backup
              if (readingMode) {
                webViewRef.current?.injectJavaScript(READING_MODE_PRELOAD_SCRIPT);
              }
            }}
            onLoadEnd={() => {
              setIsLoading(false);
              // Manually inject reading mode script on every page load
              // More reliable than injectedJavaScript prop on Android
              if (readingMode) {
                webViewRef.current?.injectJavaScript(READING_MODE_SCRIPT);
              }
              // Inject content filter script if enabled
              const filterMode = cachedDataRef.current.contentFilterMode;
              if (filterMode !== 'off' && cachedDataRef.current.blockedKeywords.length > 0) {
                // Reset flag so script can re-run on new pages
                webViewRef.current?.injectJavaScript('window.__muslimGuardContentFilter = false; true;');
                const script = generateContentFilterScript(
                  cachedDataRef.current.blockedKeywords,
                  filterMode
                );
                webViewRef.current?.injectJavaScript(script);
              }
            }}
            onError={handleError}
            onMessage={handleWebViewMessage}
            injectedJavaScriptBeforeContentLoaded={
              readingMode ? READING_MODE_PRELOAD_SCRIPT : undefined
            }
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures={false}
            mediaPlaybackRequiresUserAction={true}
          />
          {readingMode && (
            <View style={styles.readingModeIndicator}>
              <MaterialCommunityIcons name="book-open-variant" size={14} color="#FFFFFF" />
              <Text style={styles.readingModeText}>{translations.readingMode.indicator}</Text>
            </View>
          )}
        </>
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
  readingModeIndicator: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    left: 0,
    right: 0,
    marginHorizontal: 'auto' as any,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    width: 160,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  readingModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
});
