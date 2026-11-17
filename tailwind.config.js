/** A colour backed by a CSS variable in global.css, so it follows light/dark mode. */
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        subtle: token('subtle'),
        line: token('line'),
        ink: token('ink'),
        muted: token('muted'),
        faint: token('faint'),
        brand: { DEFAULT: token('brand'), soft: token('brand-soft') },
        primary: token('primary'),
        'on-primary': token('on-primary'),
        hero: token('hero'),
        star: token('star'),
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
      },
      // One typeface, one font file per weight: custom fonts on Android ignore
      // `fontWeight`, so `font-bold` etc. select a file instead (see corePlugins).
      fontFamily: {
        body: ['PlusJakartaSans_400Regular'],
        medium: ['PlusJakartaSans_500Medium'],
        semibold: ['PlusJakartaSans_600SemiBold'],
        bold: ['PlusJakartaSans_700Bold'],
        heading: ['PlusJakartaSans_700Bold'],
        'heading-semibold': ['PlusJakartaSans_600SemiBold'],
      },
      // Type scale (size/line height): caption 13/18, secondary 15/22,
      // body 17/26, section 20/26, title 30/36.
      fontSize: {
        xs: ['13px', { lineHeight: '18px' }],
        sm: ['15px', { lineHeight: '22px' }],
        base: ['17px', { lineHeight: '26px' }],
        lg: ['20px', { lineHeight: '26px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
      },
    },
  },
  corePlugins: { fontWeight: false },
  plugins: [],
};
