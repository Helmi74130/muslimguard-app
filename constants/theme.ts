/**
 * MuslimGuard Theme Configuration
 * Primary color: #003463 (Islamic blue)
 * All colors are defined for light and dark mode.
 */

import { Platform } from 'react-native';

// Primary brand color
const primaryColor = '#003463';
const primaryColorLight = '#1a4d7a';
const primaryColorDark = '#002244';

// Semantic colors
const successColor = '#4CAF50';
const errorColor = '#F44336';
const warningColor = '#FF9800';

export const Colors = {
  // Brand colors (shared)
  primary: primaryColor,
  primaryLight: primaryColorLight,
  primaryDark: primaryColorDark,
  success: successColor,
  error: errorColor,
  warning: warningColor,

  light: {
    text: '#212121',
    textSecondary: '#757575',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    surfaceVariant: '#EEEEEE',
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
    border: '#E0E0E0',
    card: '#FFFFFF',
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    tint: '#FFFFFF',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#FFFFFF',
    border: '#333333',
    card: '#1E1E1E',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
};

// Spacing scale for consistent layouts
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius scale
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Kid-friendly browser color palette
export const KidColors = {
  homeBg: '#F0F7FF',
  toolbarBg: '#DBEAFE',
  searchBg: '#F0F4FF',
  searchBorder: '#D0DCEE',
  searchFocusBorder: '#7EB6FF',
  searchPlaceholder: '#94A3B8',
  navBg: '#EEF2FF',
  navDisabled: '#CBD5E1',
  homeButtonBg: '#DBEAFE',
  safeGreen: '#34D399',
  starYellow: '#FBBF24',
  tiles: ['#DBEAFE', '#D1FAE5', '#FDE68A', '#FBCFE8', '#E0E7FF', '#FED7AA'] as const,
  tileIcons: ['#2563EB', '#059669', '#D97706', '#DB2777', '#4F46E5', '#EA580C'] as const,
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
