import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        indigo: { DEFAULT: '#1E2A5A', 50: '#EEF0F8', 100: '#DCE0F0', 200: '#B7BFE0', 600: '#2A3A7E', 700: '#1E2A5A', 800: '#161F44', 900: '#0F1630' },
        crimson: { DEFAULT: '#A3162F', 50: '#FCEEF0', 100: '#F6D3D8', 600: '#A3162F', 700: '#84112A' },
        marigold: { DEFAULT: '#F0A202', 50: '#FFF6E0', 100: '#FDE6AE', 500: '#F0A202', 600: '#CC8800' },
        surface: '#F6F6FA',
        line: '#E3E4EC',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
