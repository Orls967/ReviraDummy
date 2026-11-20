import { MD3DarkTheme, MD3LightTheme, type MD3Theme } from 'react-native-paper';
import type { Tone } from './domain/tone';

/** Palet resmi brand board Revira Fitness Center. */
export const brand = {
  gold: '#D9BF63',
  teal: '#4C969B',
  black: '#000000',
} as const;

/**
 * Emas dan teal asli kurang kontras sebagai teks di atas putih, jadi tema terang memakai hitam
 * sebagai warna utama (tombol hitam dengan teks emas) dan teal yang digelapkan untuk teks sekunder.
 * Warna elevation diganti netral karena bawaan MD3 bernuansa ungu dan keluar dari palet brand.
 */
export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  roundness: 3,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#111111',
    onPrimary: brand.gold,
    primaryContainer: '#F6EFD5',
    onPrimaryContainer: '#3A3112',
    secondary: '#2F6E73',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DCEDEE',
    onSecondaryContainer: '#163B3E',
    tertiary: '#8A7426',
    background: '#F5F5F2',
    surface: '#FFFFFF',
    surfaceVariant: '#EFEEE9',
    onSurfaceVariant: '#5F5E57',
    outline: '#C9C6BB',
    outlineVariant: '#E4E2DA',
    elevation: {
      level0: 'transparent',
      level1: '#FBFBF8',
      level2: '#F7F6F2',
      level3: '#F3F2ED',
      level4: '#F1F0EA',
      level5: '#EEEDE6',
    },
  },
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  roundness: 3,
  colors: {
    ...MD3DarkTheme.colors,
    primary: brand.gold,
    onPrimary: '#111111',
    primaryContainer: '#3A3112',
    onPrimaryContainer: '#F3E7BC',
    secondary: '#8CC7CB',
    onSecondary: '#0E2B2D',
    secondaryContainer: '#1D3F42',
    onSecondaryContainer: '#CDEAEC',
    tertiary: brand.gold,
    background: '#0A0A0A',
    surface: '#141414',
    surfaceVariant: '#1F1F1F',
    onSurfaceVariant: '#B5B3AA',
    outline: '#4A4A46',
    outlineVariant: '#2B2B28',
    elevation: {
      level0: 'transparent',
      level1: '#191919',
      level2: '#1D1D1C',
      level3: '#212120',
      level4: '#232322',
      level5: '#262625',
    },
  },
};

interface ToneColors {
  background: string;
  foreground: string;
}

const LIGHT_TONES: Readonly<Record<Tone, ToneColors>> = {
  success: { background: '#DCFCE7', foreground: '#166534' },
  warning: { background: '#FEF3C7', foreground: '#92400E' },
  danger: { background: '#FEE2E2', foreground: '#991B1B' },
  info: { background: '#DCEDEE', foreground: '#1F5256' },
  neutral: { background: '#EFEEE9', foreground: '#4A4944' },
};

const DARK_TONES: Readonly<Record<Tone, ToneColors>> = {
  success: { background: '#14532D', foreground: '#BBF7D0' },
  warning: { background: '#5C430F', foreground: '#FDE68A' },
  danger: { background: '#7F1D1D', foreground: '#FECACA' },
  info: { background: '#143235', foreground: '#A8DADD' },
  neutral: { background: '#262624', foreground: '#D6D4CC' },
};

export function toneColors(tone: Tone, dark: boolean): ToneColors {
  return (dark ? DARK_TONES : LIGHT_TONES)[tone];
}
