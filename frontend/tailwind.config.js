/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#0a0d14',
          card: 'rgba(17, 24, 39, 0.75)',
          border: 'rgba(56, 189, 248, 0.15)',
          cyan: '#06b6d4',
          blue: '#3b82f6',
          neon: '#00f2fe',
          glow: '#4facfe'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
