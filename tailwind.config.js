import colors from 'tailwindcss/colors';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // MTG color identity colors
        mtg: {
          white: '#F8E7B9', // White mana
          blue: '#0E68AB',  // Blue mana
          black: '#150B00',  // Black mana
          red: '#D3202A',   // Red mana
          green: '#00733E', // Green mana
          gold: '#D9A93E',  // Multicolor
          colorless: '#BFAFB2', // Colorless
          artifact: '#B3CFDD', // Artifacts
          land: '#A3C095',  // Lands
        },
        logoScheme: {
          brown: '#334155',
          gold: '#0ea5e9',
          darkGray: '#37474F',
          green: '#4CAF50',
          red: '#F44336',
          blue: '#2196F3',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 8px rgba(0, 0, 0, 0.15), 0 8px 12px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'mtg-pattern': "url('/src/assets/bg-pattern.png')",
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      fontFamily: {
        'beleren': ['Beleren Bold', 'sans-serif'],
        'magic': ['Beleren', 'Planewalker', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
} 