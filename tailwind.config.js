/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#16803D',
          primaryDark: '#146c34',
          primaryDeep: '#0f5127',
          secondary: '#DDF7E5',
          secondaryHover: '#c8f2d5',
          bg: '#FAFAF5',
          accent: '#FF9F43',
          accentHover: '#f59030',
          text: '#202820',
          textMuted: '#526052',
          card: '#FFFFFF',
        },
        kirana: {
          50: '#F0FDF4',
          100: '#DDF7E5', // Mint green secondary
          200: '#B8F2C9',
          300: '#86E4A4',
          400: '#43CF74',
          500: '#22C55E',
          600: '#16803D', // Primary fresh dark green
          700: '#156530',
          800: '#16532B',
          900: '#144525',
          950: '#052e16',
        },
        accent: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#FF9F43', // Warm orange
          600: '#EA580C',
          700: '#C2410C',
        },
        amber: {
          50: '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FF9F43',
          500: '#FF9F43', // Mapped to warm orange for brand consistency
          600: '#EA580C',
          700: '#C2410C',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(32, 40, 32, 0.05), 0 4px 6px -2px rgba(32, 40, 32, 0.03)',
        'card': '0 4px 20px -2px rgba(22, 128, 61, 0.08), 0 2px 6px -1px rgba(32, 40, 32, 0.04)',
        'card-hover': '0 12px 30px -4px rgba(22, 128, 61, 0.12), 0 4px 12px -2px rgba(32, 40, 32, 0.06)',
        'elevated': '0 10px 30px -5px rgba(32, 40, 32, 0.08), 0 4px 10px -2px rgba(32, 40, 32, 0.04)',
      }
    },
  },
  plugins: [],
}
