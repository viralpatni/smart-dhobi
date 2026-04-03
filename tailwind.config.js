/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0D9488',
        'primary-dark': '#0F766E',
        secondary: '#F59E0B',
        success: '#10B981',
        danger: '#EF4444',
        surface: '#F8FAFC',
        muted: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
