/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e5ff',
          200: '#b8ceff',
          300: '#8aaeff',
          400: '#5a86ff',
          500: '#3b63f7',
          600: '#2a47d4',
          700: '#2439a8',
          800: '#213285',
          900: '#1f2e6a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
