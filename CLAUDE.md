# CLAUDE.md


Pour tester
Ecran d'accueil : npm start puis ouvrir l'app en mode enfant
Mode kiosque : necessite un build natif :

npm install
npx expo prebuild --platform android
npx expo run:android

npm start for start projet in devolpment

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MuslimGuard** is a React Native parental control application designed by Muslims for Muslim families. It protects children from haram and harmful content on the Internet while preserving complete privacy (all data stored locally).

### Key Features
- Child home screen dashboard with Islamic greeting, Hijri date, prayer widget, and daily reminders
- Secure WebView browser with real-time URL/keyword blocking
- **Strict Mode (Whitelist)**: Parents can enable a whitelist-only mode where only pre-approved sites are accessible
- Parent Mode (PIN protected) and Child Mode (locked home screen)
- Kiosk mode with screen pinning and status bar hiding
- Prayer times with automatic internet pause (using Adhan library)
- Time-based access restrictions (configurable daily schedules)
- Browsing history visible to parents
- Blocked access attempts logging
- Launcher mode to prevent app exit
- 50+ pre-configured blocked sites (adult, gambling, dating, alcohol)

### Target Platform
- **Primary**: Android (API 26+)
- **UI Language**: French

## Tech Stack

- **React Native 0.81** with New Architecture enabled
- **Expo ~54.0** with Expo Router for file-based navigation
- **TypeScript 5.9** in strict mode
- **react-native-webview** for secure browsing
- **react-native-mmkv** for encrypted local storage
- **adhan** for offline prayer time calculations
- **expo-crypto** for PIN hashing (SHA-256)
- **date-fns** for date/time handling
- **kiosk-mode** local Expo module for Android screen pinning

## Common Commands

```bash
npm start              # Start Expo development server
npm run android        # Run on Android emulator/device

# For launcher mode + kiosk mode (native build required)
npx expo prebuild --platform android
npx expo run:android
```

## Architecture

### Navigation Structure (`app/`)

```
app/
├── _layout.tsx              # Root layout with providers + kiosk StatusBar
├── index.tsx                # Entry point (redirect logic)
├── pin-entry.tsx            # Parent authentication modal (deactivates kiosk on success)
│
├── onboarding/              # First-launch setup
│   ├── welcome.tsx          # App introduction
│   ├── pin-setup.tsx        # Create PIN
│   ├── city.tsx             # Select city for prayer times
│   └── complete.tsx         # Setup complete
│
├── child/                   # Child mode (locked)
│   ├── home.tsx             # Child dashboard (prayer, browser button, reminders)
│   ├── browser.tsx          # Secure WebView browser
│   └── blocked.tsx          # Blocked content screen
│
└── parent/                  # Parent dashboard
    ├── (tabs)/              # Bottom tab navigation
    │   ├── dashboard.tsx    # Stats and quick actions
    │   ├── history.tsx      # Browsing history
    │   └── prayer.tsx       # Prayer times
    └── settings/            # Configuration screens
        ├── index.tsx        # Settings menu
        ├── blocklist.tsx    # Manage blocked sites/keywords + whitelist (strict mode)
        ├── schedule.tsx     # Time restrictions
        ├── prayer.tsx       # Prayer settings
        ├── pin.tsx          # Change PIN
        └── kiosk.tsx        # Kiosk mode settings (screen pinning, status bar)
```

### Services (`services/`)

| Service | Purpose |
|---------|---------|
| `storage.service.ts` | MMKV wrapper with encryption for all data |
| `auth.service.ts` | PIN hashing, validation, lockout mechanism |
| `blocking.service.ts` | URL/keyword blocking logic + strict mode (whitelist) |
| `prayer.service.ts` | Prayer time calculations using Adhan |
| `kiosk.service.ts` | Screen pinning and status bar management for kiosk mode |

### Contexts (`contexts/`)

| Context | Purpose |
|---------|---------|
| `app-mode.context.tsx` | Manages child/parent mode switching |
| `auth.context.tsx` | Authentication state and PIN verification |

### UI Components (`components/`)

| Component | Purpose |
|-----------|---------|
| `ui/button.tsx` | Reusable button with variants |
| `ui/input.tsx` | Text input with validation |
| `ui/card.tsx` | Card container |
| `ui/pin-input.tsx` | 4-6 digit PIN entry |
| `browser/secure-webview.tsx` | WebView with blocking |
| `browser/browser-toolbar.tsx` | URL bar and navigation |

### Constants (`constants/`)

| File | Purpose |
|------|---------|
| `theme.ts` | Colors (#003463 primary), spacing, borders |
| `translations.ts` | All French UI strings (including childHome and kiosk sections) |
| `default-blocklist.ts` | Pre-configured blocked domains/keywords |
| `cities.ts` | 60+ cities with coordinates for prayer times |
| `islamic-reminders.ts` | 30 hadiths/Quran verses for daily child home screen rotation |

### Utils (`utils/`)

| File | Purpose |
|------|---------|
| `hijri-date.ts` | Gregorian to Hijri date conversion (Kuwaiti algorithm) |

### Native Modules (`modules/`)

| Module | Purpose |
|--------|---------|
| `kiosk-mode/` | Expo native module (Kotlin) for Android screen pinning via `startLockTask()`/`stopLockTask()` |

### Types (`types/`)

| File | Purpose |
|------|---------|
| `storage.types.ts` | All storage schema types and defaults |

## Key Patterns

### Storage Keys (MMKV)
```typescript
'settings'              // AppSettings object (includes kioskModeEnabled, kioskHideStatusBar, strictModeEnabled)
'blocklist.domains'     // string[]
'blocklist.keywords'    // string[]
'whitelist.domains'     // string[] (for strict mode)
'schedule'              // ScheduleData object
'history.entries'       // HistoryEntry[]
'history.blockedAttempts' // BlockedAttempt[]
'auth.lockout'          // PinLockoutState
```

### Blocking Logic
1. Check if in prayer pause window
2. Check time schedule restrictions
3. **If strict mode enabled**: Check URL against whitelist (block if not whitelisted)
4. **If strict mode disabled**: Check URL against blocked domains
5. Check URL for blocked keywords (applies in both modes for extra safety)
6. Log blocked attempts

### Strict Mode (Whitelist)
When enabled, only sites in the whitelist are accessible. All other sites are blocked.

**Flow:**
1. Parent adds sites to whitelist in Settings > Gestion des blocages > Autorisés
2. Parent enables "Mode strict" toggle
3. Child can only navigate to whitelisted domains
4. Keywords blocking still applies for extra safety

**Block Reasons:**
- `'domain'` - Site in blocklist (normal mode)
- `'keyword'` - URL contains blocked keyword
- `'prayer'` - Prayer time pause active
- `'schedule'` - Outside allowed hours
- `'whitelist'` - Site not in whitelist (strict mode)

### PIN Security
- PIN is hashed with SHA-256 + salt
- 5 failed attempts = 5 minute lockout
- Never store plain text PIN

### Kiosk Mode Flow
1. Parent enables kiosk in settings (`/parent/settings/kiosk`)
2. On entering child mode, `KioskService.activateKiosk()` is called (screen pinning + hide status bar)
3. Child sees home screen with no access to status bar or app switching
4. Parent enters PIN → `KioskService.deactivateKiosk()` is called before navigating to parent dashboard
5. Without Device Owner, Android shows a confirmation dialog for screen pinning (acceptable for basic mode)

### Child Home Screen
- Greeting: "Bismillah Ar-Rahman Ar-Rahim"
- Dates: Gregorian (French) + Hijri (approximate via Kuwaiti algorithm)
- Prayer widget: Next prayer name, time, minutes remaining (refreshes every 60s)
- Browser button: Navigates to `/child/browser`
- Apps placeholder: "Bientot disponible" (future Phase 2)
- Daily reminder: Rotates based on day of year from 30 Islamic reminders

## Design Guidelines

### Colors
```typescript
primary: '#003463'      // Islamic blue
success: '#4CAF50'
error: '#F44336'
warning: '#FF9800'
```

### Styling Rules
- Use `StyleSheet.create()` for all styles
- Use `Spacing` constants from theme
- Use `BorderRadius` constants from theme
- French labels for all UI text

## Launcher Mode

The app includes a custom Expo config plugin (`plugins/with-launcher-mode.js`) that adds HOME intent filter to AndroidManifest.xml, allowing the app to be set as the default home screen.

To enable:
1. Run `npx expo prebuild --platform android`
2. Build and install the app
3. User must manually set MuslimGuard as default launcher in Android settings

## Kiosk Mode

The app includes a local Expo native module (`modules/kiosk-mode/`) that provides screen pinning via Android's `startLockTask()` API.

Features:
- **Screen pinning**: Prevents the child from switching apps (uses `ActivityManager.lockTaskModeState`)
- **Status bar hiding**: Uses `expo-status-bar` with `hidden` prop when kiosk is active in child mode
- **Graceful fallback**: If the native module is not available (Expo Go), kiosk features are silently skipped

To test kiosk mode (requires native build):
1. Run `npx expo prebuild --platform android && npx expo run:android`
2. Go to Parent Settings > Mode kiosque > Enable
3. Switch to child mode to see screen pinning activate

## Future Enhancements (Phase 2)

- **App whitelisting**: Parents choose which apps the child can access. Requires a native module to list/launch installed apps. The child home screen already has a placeholder section for this.
- **Advanced kiosk (Device Owner)**: `dpm set-device-owner` for zero-escape kiosk without confirmation dialog. Complex ADB setup required.

## Important Notes

1. **Privacy First**: All data stays on device. No analytics, no cloud sync.
2. **Back Button**: Disabled in child mode to prevent app exit.
3. **Prayer Times**: Use Adhan library with configurable calculation methods.
4. **History Cleanup**: Auto-cleanup entries older than 30 days.
5. **PIN Recovery**: Requires app reinstall (by design for security).
6. **Kiosk Native Build**: Screen pinning only works with native builds (`npx expo run:android`), not Expo Go.
7. **Hijri Date**: Approximate (+/- 1-2 days) using Kuwaiti tabular algorithm, no external dependency.
8. **Browser Cache**: The browser uses a local cache for blocking checks (refreshed every 30s). After changing strict mode or whitelist, close and reopen the browser to apply changes immediately.
