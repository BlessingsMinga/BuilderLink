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
  canvas: '#F5F7FA',
  /** Cards and inputs. */
  surface: '#FFFFFF',
  /** Quiet fills: unselected segments, skeletons, neutral badges. */
  subtle: '#EBEFF5',
  /** Hairline borders and dividers. */
  line: '#DDE3EC',
  /** Primary text. */
  ink: '#0B1A33',
  /** Secondary text and icons. */
  muted: '#55627A',
  /** Placeholders and tertiary text. */
  faint: '#8E99AD',
  /** Brand colour for links, icons and highlights. */
  brand: '#012150',
  /** Tinted background for icon tiles, avatars and selected states. */
  brandSoft: '#E5EBF5',
  /** Fill of primary buttons and selected chips. */
  primary: '#012150',
  /** Text and icons on `primary`. */
  onPrimary: '#FFFFFF',
  /** The coloured band at the top of main screens. Text on it is always white. */
  hero: '#012150',
  /** Star ratings. */
  star: '#F96E13',
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
  canvas: '#070D1A',
  surface: '#111A2E',
  subtle: '#0D1526',
  line: '#1F2A42',
  ink: '#E9EEF7',
  muted: '#9AA6BD',
  faint: '#6C7891',
  brand: '#FF8A3D',
  brandSoft: '#33200F',
  primary: '#F96E13',
  onPrimary: '#FFFFFF',
  hero: '#012150',
  star: '#FF8A3D',
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
