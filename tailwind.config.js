/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/features/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#22D3EE',
          secondary: '#F0ABFC',
          warm: '#C47D8E',
          amber: '#E07840',
          dark: '#060816',
          panel: '#121930',
        },
        surface: {
          warm: '#F5EEE7',
          'warm-soft': '#FFF4EC',
          'warm-card': '#FFFAF6',
          night: '#060816',
          'night-soft': '#0D1327',
          'night-card': '#121930',
          'night-elevated': '#182241',
        },
        line: {
          warm: '#E8D5CB',
          'warm-strong': '#D9B8A7',
          night: '#24304D',
          'night-strong': '#3A4A73',
        },
        ink: {
          strong: '#2D3348',
          muted: '#7B6F73',
          soft: '#A1928C',
          inverse: '#F3F8FF',
        },
        accent: {
          rose: '#C47D8E',
          orange: '#E07840',
          cyan: '#67E8F9',
          'cyan-strong': '#22D3EE',
          fuchsia: '#F0ABFC',
        },
        state: {
          success: '#34D399',
          warning: '#F59E0B',
          danger: '#FB7185',
        },
      },
    },
  },
  plugins: [],
};
