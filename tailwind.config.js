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
        success: { DEFAULT: token('success'), soft: token('success-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
      },
      // One family per weight: custom fonts on Android ignore `fontWeight`, so
      // `font-bold` etc. select a font file instead (see corePlugins below).
      fontFamily: {
        body: ['Inter_400Regular'],
        medium: ['Inter_500Medium'],
        semibold: ['Inter_600SemiBold'],
        bold: ['Inter_700Bold'],
        heading: ['PlusJakartaSans_700Bold'],
        'heading-semibold': ['PlusJakartaSans_600SemiBold'],
      },
      // Type scale: title 28/34, section 18/24, body 16/24, secondary 14/20, caption 12/16.
      fontSize: {
        lg: ['18px', { lineHeight: '24px' }],
        '3xl': ['28px', { lineHeight: '34px' }],
      },
    },
  },
  corePlugins: { fontWeight: false },
  plugins: [],
};
