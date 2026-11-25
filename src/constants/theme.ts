import { Platform } from 'react-native';

export const Colors = {
  light: {
    // Reference short-news card styling
    text: '#111827',                  // Near-black headline (like reference)
    textSecondary: '#4B5563',         // Softer gray body text
    textMuted: '#9CA3AF',             // Clock and counter meta text
    background: '#FFFFFF',            // Clean white card background
    cardBackground: '#FFFFFF',        // White surface
    surface: '#F9FAFB',
    border: '#E5E7EB',                // Thin separator borders
    brandRed: '#BA1A1A',              // NTODAY official brand red
    brandRedBright: '#E50914',
    whatsappGreen: '#25D366',         // Round WhatsApp button
    shareBlue: '#2563EB',             // Blue share arrow icon
    iconColor: '#4B5563',             // Action bar default icon color
    iconActive: '#111827',
    badgeDark: 'rgba(0, 0, 0, 0.75)',  // Semi-transparent dark photo badge
    modalBg: '#FFFFFF',
    modalBorder: '#E5E7EB',
  },
  dark: {
    text: '#F9FAFB',                  // Near-white headline
    textSecondary: '#D1D5DB',         // Light gray body text
    textMuted: '#9CA3AF',             // Muted meta text
    background: '#121214',            // Dark card background
    cardBackground: '#121214',
    surface: '#18181B',
    border: '#27272A',
    brandRed: '#BA1A1A',
    brandRedBright: '#E50914',
    whatsappGreen: '#25D366',
    shareBlue: '#3B82F6',
    iconColor: '#9CA3AF',
    iconActive: '#FFFFFF',
    badgeDark: 'rgba(0, 0, 0, 0.85)',
    modalBg: '#18181B',
    modalBorder: '#27272A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans Telugu", sans-serif',
    serif: 'Georgia, serif',
    rounded: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 480;
