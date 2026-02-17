# CLAUDE.md

## Project

MuslimGuard – React Native parental control app for Muslim families.
Android-first (API 26+). UI in French.
All data stored locally (no cloud, no analytics).

## Stack

- React Native 0.81 (New Arch)
- Expo ~54 + Expo Router
- TypeScript strict
- react-native-mmkv (encrypted storage)
- react-native-webview
- adhan (prayer times)
- expo-crypto (PIN SHA-256 hashing)
- Local native module: kiosk-mode (Android screen pinning)

## Dev Commands

npm start
npm run android

# Required for kiosk / launcher
npx expo prebuild --platform android
npx expo run:android

## Architecture (High Level)

app/
- onboarding/
- child/
- parent/
- pin-entry.tsx

services/
- storage.service
- auth.service
- blocking.service
- prayer.service
- kiosk.service

## Core Rules


### PIN Security
- SHA-256 + salt
- 5 attempts → 5 min lockout
- Never store plain PIN

### Blocking Flow

Order:
1. Prayer pause
2. Schedule restriction
3. Strict mode → whitelist only
4. Blocked domains
5. Blocked keywords
6. Log attempt

### Strict Mode
If enabled → only whitelist domains allowed.
Keywords still apply.

### Kiosk
- Works only with native build
- activateKiosk() in child mode
- deactivateKiosk() before parent mode
- Graceful fallback in Expo Go

## Important

- Back button disabled in child mode
- History auto-cleans after 30 days
- After changing whitelist/strict mode → reload browser

