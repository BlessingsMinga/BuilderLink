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
  canvas: '#0B1210',
  surface: '#16211C',
  subtle: '#121B18',
  line: '#22322B',
  ink: '#EAF2EE',
  muted: '#9AABA3',
  faint: '#6E827A',
  brand: '#3DDC97',
  brandSoft: '#163327',
  primary: '#3DDC97',
  onPrimary: '#06140D',
  hero: '#16211C',
  star: '#F2B544',
  success: '#3DDC97',
  successSoft: '#143022',
  warn: '#F2B544',
  warnSoft: '#2E2612',
  danger: '#F08A7E',
  dangerSoft: '#2E1815',
  info: '#7DB7F5',
  infoSoft: '#132233',
};

export const palettes: { light: ThemeColors; dark: ThemeColors } = { light, dark };

/** The colour tokens for the phone's current light/dark setting. */
export function useThemeColors(): ThemeColors {
  const { colorScheme } = useColorScheme();
  return colorScheme === 'dark' ? dark : light;
}
