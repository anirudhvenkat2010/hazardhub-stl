import React, { createContext, useContext, useMemo } from 'react';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  border: string;
  warn: string;
  danger: string;
  ok: string;
}

export const darkColors: Palette = {
  bg: '#15202B',
  surface: '#1E2C3A',
  surfaceAlt: '#263749',
  text: '#F1F6FB',
  textMuted: '#9BB0C4',
  accent: '#F2A33C',
  border: '#31465A',
  warn: '#F2C94C',
  danger: '#EB5757',
  ok: '#27AE60',
};

export const lightColors: Palette = {
  bg: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceAlt: '#E9EFF4',
  text: '#17222C',
  textMuted: '#55697B',
  accent: '#D98324',
  border: '#D4DEE7',
  warn: '#C99A00',
  danger: '#D1283A',
  ok: '#1FA85C',
};

export const colors: Palette = darkColors;
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 } as const;
export const radius = { sm: 8, md: 12, lg: 18 } as const;

/**
 * Inter font families (loaded in the root layout). Robinhood-style: a clean
 * geometric sans with confident weight contrast. Falls back to the system font
 * until the webfonts finish loading.
 */
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  // SemiBold (600) can render blank on Android via @expo-google-fonts; alias to Bold.
  semibold: 'Inter_700Bold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

/** Type scale — display for hero numbers/titles, body for content, caption for meta.
 *  NOTE: we intentionally use only Inter Regular / Medium / Bold / ExtraBold here.
 *  On Android, the SemiBold (600) weight from @expo-google-fonts can silently render
 *  blank for some labels, so `label` and `heading` use Bold (700), which is reliable.
 *  We do NOT also set fontWeight — pairing a custom fontFamily with fontWeight is what
 *  triggers the blank-text bug on Android. */
export const type = {
  display: { fontFamily: fonts.extrabold, fontSize: 30, lineHeight: 38, letterSpacing: -0.5, includeFontPadding: false },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 30, letterSpacing: -0.3, includeFontPadding: false },
  heading: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, includeFontPadding: false },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 23, letterSpacing: -0.1, includeFontPadding: false },
  bodyMedium: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23, letterSpacing: -0.1, includeFontPadding: false },
  label: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, includeFontPadding: false },
  caption: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18, includeFontPadding: false },
  overline: { fontFamily: fonts.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.6, textTransform: 'uppercase' as const, includeFontPadding: false },
} as const;

export type ThemeMode = 'dark' | 'light' | 'system';

interface ThemeContextValue {
  colors: Palette;
  mode: ThemeMode;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  resolvedMode,
}: {
  children: React.ReactNode;
  resolvedMode: 'dark' | 'light';
}) {
  const value = useMemo<ThemeContextValue>(
    () => ({ colors: resolvedMode === 'light' ? lightColors : darkColors, mode: resolvedMode }),
    [resolvedMode],
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext) ?? { colors: darkColors, mode: 'dark' };
}
