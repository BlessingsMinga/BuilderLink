import { useColorScheme } from 'nativewind';

/**
 * Colour tokens for places that can't take a Tailwind class (icon colours,
 * navigation bars, spinners). Keep in sync with the CSS variables in
 * `global.css`, which drive the matching Tailwind classes (`bg-canvas`,
 * `text-ink`, `border-line`, ...).
 *
 * To rebrand, change `brand`, `brandSoft`, `primary` and `hero` here and in
 * `global.css`.
 */
const light = {
  /** Screen background: a faint tint so white cards stand out. */
  canvas: '#F4F7F6',
  /** Cards and inputs. */
  surface: '#FFFFFF',
  /** Quiet fills: unselected segments, skeletons, neutral badges. */
  subtle: '#E9EFED',
  /** Hairline borders and dividers. */
  line: '#DDE5E2',
  /** Primary text. */
  ink: '#12201C',
  /** Secondary text and icons. */
  muted: '#566660',
  /** Placeholders and tertiary text. */
  faint: '#8FA09A',
  /** Brand colour for links, icons and highlights. */
  brand: '#0F766E',
  /** Tinted background for icon tiles, avatars and selected states. */
  brandSoft: '#DFF1EE',
  /** Fill of primary buttons and selected chips. */
  primary: '#0F766E',
  /** Text and icons on `primary`. */
  onPrimary: '#FFFFFF',
  /** The coloured band at the top of main screens. Text on it is always white. */
  hero: '#0F766E',
  /** Star ratings. */
  star: '#F59E0B',
  success: '#15803D',
  successSoft: '#E3F5E8',
  warn: '#B45309',
  warnSoft: '#FDF0D5',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  info: '#2563EB',
  infoSoft: '#E6EEFE',
};

export type ThemeColors = Record<keyof typeof light, string>;

const dark: ThemeColors = {
  canvas: '#0A1210',
  surface: '#121C19',
  subtle: '#1A2623',
  line: '#25332F',
  ink: '#F1F6F4',
  muted: '#9DB0AA',
  faint: '#6A7C76',
  brand: '#2DD4BF',
  brandSoft: '#0F2F2A',
  primary: '#14B8A6',
  onPrimary: '#03201C',
  hero: '#0E4F48',
  star: '#F59E0B',
  success: '#4ADE80',
  successSoft: '#10261A',
  warn: '#FBBF24',
  warnSoft: '#33260A',
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
