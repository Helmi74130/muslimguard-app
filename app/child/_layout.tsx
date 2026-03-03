/**
 * Child Mode Layout - MuslimGuard
 * Simplified layout for child browsing mode
 * Includes centralized screen time tracking
 */

import { ScreenTimeService } from '@/services/screen-time.service';
import { StorageService } from '@/services/storage.service';
import { Colors } from '@/constants/theme';
import { Stack, router, usePathname } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

// ── Module-level singleton state ──
// Guarantees only one active timer even if React mounts the tracker twice.
let _startTime = Date.now();
let _currentPage = '';
let _tracking = false; // true only when on a /child/ route
let _instanceCount = 0;

function getPageId(path: string): string {
  return path.split('/').pop() || 'browser';
}

function isChildRoute(path: string): boolean {
  return path.startsWith('/child');
}

function saveElapsed(): void {
  if (!_tracking || !_currentPage) return;
  const elapsed = Math.floor((Date.now() - _startTime) / 1000);
  if (elapsed > 0) {
    ScreenTimeService.addTime(_currentPage, elapsed);
  }
  _startTime = Date.now();
}

function pauseTracking(): void {
  saveElapsed();
  _tracking = false;
}

function resumeTracking(pageId: string): void {
  _currentPage = pageId;
  _startTime = Date.now();
  _tracking = true;
}

/**
 * Invisible component that tracks screen time across all child pages.
 * Only tracks when pathname starts with /child/.
 * Pauses automatically when navigating to parent mode / pin-entry.
 */
function ScreenTimeTracker() {
  const pathname = usePathname();
  const appStateRef = useRef(AppState.currentState);
  const limitIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isOwnerRef = useRef(false);

  // Register this instance — only the first active instance owns the timer
  useEffect(() => {
    _instanceCount++;
    isOwnerRef.current = _instanceCount === 1;

    if (isOwnerRef.current && isChildRoute(pathname)) {
      resumeTracking(getPageId(pathname));
    }

    return () => {
      _instanceCount--;
      if (isOwnerRef.current) {
        pauseTracking();
        _currentPage = '';
      }
    };
  }, []);

  // Handle page changes (only owner)
  useEffect(() => {
    if (!isOwnerRef.current) return;

    if (isChildRoute(pathname)) {
      const newPageId = getPageId(pathname);
      if (_tracking && _currentPage !== newPageId) {
        // Switching between child pages — save old page time
        saveElapsed();
      }
      resumeTracking(newPageId);
    } else {
      // Left child mode (pin-entry, parent dashboard, etc.) — pause
      pauseTracking();
    }
  }, [pathname]);

  // Handle AppState changes (only owner)
  useEffect(() => {
    if (!isOwnerRef.current) return;

    const sub = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current === 'active' && nextState.match(/inactive|background/)) {
        if (_tracking) saveElapsed();
      } else if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (_tracking) {
          _startTime = Date.now();
          checkLimit();
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  // Periodic limit check (only owner)
  useEffect(() => {
    if (!isOwnerRef.current) return;

    limitIntervalRef.current = setInterval(checkLimit, 30000);
    return () => {
      if (limitIntervalRef.current) clearInterval(limitIntervalRef.current);
    };
  }, []);

  return null;
}

async function checkLimit(): Promise<void> {
  try {
    // Only check limit when actively tracking a child page
    if (!_tracking || !_currentPage) return;
    // Never redirect from system screens
    if (_currentPage === 'screen-time-limit' || _currentPage === 'blocked') return;

    const settings = await StorageService.getSettings();
    if (!settings.screenTimeLimitEnabled || settings.screenTimeLimitMinutes <= 0) return;

    // Flush current elapsed time before checking
    saveElapsed();

    const totalSeconds = await ScreenTimeService.getTodayTotalSeconds();
    const limitSeconds = settings.screenTimeLimitMinutes * 60;

    if (totalSeconds >= limitSeconds) {
      router.replace('/child/screen-time-limit' as any);
    }
  } catch {
    // Silently fail
  }
}

export default function ChildLayout() {
  return (
    <>
      <ScreenTimeTracker />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.light.background },
          gestureEnabled: false, // Prevent swipe back
          animation: 'fade',
        }}
      >
        <Stack.Screen name="browser" />
        <Stack.Screen name="calculator" />
        <Stack.Screen name="allah-names" />
        <Stack.Screen name="drawing" />
        <Stack.Screen name="arabic-tracing" />
        <Stack.Screen name="calligraphy" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="gallery" />
        <Stack.Screen name="pedometer" />
        <Stack.Screen name="stopwatch" />
        <Stack.Screen name="emotions" />
        <Stack.Screen name="ablutions" />
        <Stack.Screen
          name="blocked"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
        <Stack.Screen
          name="screen-time-limit"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
          }}
        />
      </Stack>
    </>
  );
}
