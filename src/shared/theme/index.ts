import { useColorScheme } from 'nativewind';

/**
 * Colour tokens for places that can't take a Tailwind class (icon colours,
 * navigation bars, spinners). Keep in sync with the CSS variables in
 * `global.css`, which drive the matching Tailwind classes (`bg-canvas`,
 * `text-ink`, `border-line`, ...).
 */
const light = {
  /** Screen background. */
  canvas: '#FFFFFF',
  /** Cards and inputs; separated from the canvas by a `line` border. */
  surface: '#FFFFFF',
  /** Quiet fills: chips, avatars, neutral badges. */
  subtle: '#F4F4F5',
  /** Hairline borders and dividers. */
  line: '#E4E4E7',
  /** Primary text, and the fill of primary buttons. */
  ink: '#18181B',
  /** Secondary text and icons. */
  muted: '#71717A',
  /** Placeholders and tertiary text. */
  faint: '#A1A1AA',
  /** Accent: links, ratings, the logo. Used sparingly. */
  brand: '#EA580C',
  brandSoft: '#FFF7ED',
  success: '#16A34A',
  successSoft: '#F0FDF4',
  danger: '#DC2626',
  dangerSoft: '#FEF2F2',
  info: '#2563EB',
  infoSoft: '#EFF6FF',
};

export type ThemeColors = Record<keyof typeof light, string>;

const dark: ThemeColors = {
  canvas: '#0B0B0C',
  surface: '#131315',
  subtle: '#1F1F23',
  line: '#2A2A2F',
  ink: '#FAFAFA',
  muted: '#A1A1AA',
  faint: '#71717A',
  brand: '#FB923C',
  brandSoft: '#2B1A0E',
  success: '#4ADE80',
  successSoft: '#10261A',
  danger: '#F87171',
  dangerSoft: '#2D1414',
  info: '#60A5FA',
  infoSoft: '#111C30',
};

export const palettes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

/** The colour tokens for the phone's current light/dark setting. */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? dark : light;
}
