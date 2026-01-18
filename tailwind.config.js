/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}',
    './services/**/*.{ts,tsx,js,jsx}',
    './constants.ts',
    './types.ts'
  ],
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      },
      keyframes: {
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'marquee': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' }
        }
      },
      animation: {
        'slide-in-right': 'slide-in-right 0.5s ease-out forwards',
        'fade-in': 'fade-in 0.4s ease-in-out forwards',
        'marquee': 'marquee 25s linear infinite'
      },
      colors: {
        // Simplified theme colors for smaller bundle
        primary: 'rgb(var(--color-primary-rgb))',
        secondary: 'rgb(var(--color-secondary-rgb))',
        tertiary: 'rgb(var(--color-tertiary-rgb))',
        accent: 'rgb(var(--color-hover-rgb))',
        surface: 'rgb(var(--color-surface-rgb))',
        'theme-font': 'rgb(var(--color-font-rgb))',
        'theme-primary': 'rgb(var(--color-primary-rgb))'
      }
    }
  },
  corePlugins: {
    // Disable utilities not used in the project for smaller bundle
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    filter: false,
    blur: false,
    brightness: false,
    contrast: false,
    dropShadow: false,
    grayscale: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    sepia: false,
    scrollMargin: false,
    scrollPadding: false,
    ringColor: false,
    ringOffsetColor: false,
    ringOffsetWidth: false,
    ringOpacity: false,
    ringWidth: false,
    columns: false,
    breakAfter: false,
    breakBefore: false,
    breakInside: false,
    caretColor: false,
    aspectRatio: false,
    touchAction: false,
    userSelect: false,
    resize: false,
    listStyleImage: false,
    listStylePosition: false,
    listStyleType: false,
    appearance: false,
    cursor: false,
    willChange: false,
    content: false
  },
  plugins: []
};
