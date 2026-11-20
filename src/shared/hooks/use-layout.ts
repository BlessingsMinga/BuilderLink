import { useWindowDimensions } from 'react-native';

/** Content never grows wider than this; on tablets and web it's centred. */
export const CONTENT_MAX_WIDTH = 680;

/**
 * Breakpoints for adapting layouts to the screen:
 * - `isCompact`: small phones (e.g. 320–359pt wide), tighten spacing and type.
 * - `isWide`: tablets, foldables and web, use more columns.
 */
export function useLayout() {
  const { width, height } = useWindowDimensions();
  const contentWidth = Math.min(width, CONTENT_MAX_WIDTH);
  return {
    width,
    height,
    contentWidth,
    isCompact: width < 360,
    isWide: width >= 600,
    isShort: height < 700,
    /** Columns for photo grids: 2 on phones, 3 on wide screens. */
    gridColumns: width >= 600 ? 3 : 2,
  };
}
