/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0fe',
          100: '#e3e3fd',
          200: '#cbcbfc',
          300: '#aaaafa',
          400: '#7878f5',
          500: '#4f4ff0',
          600: '#1313ec',
          700: '#0f0fbf',
          800: '#0c0c98',
          900: '#0a0a7d',
        }
      },
      borderRadius: {
        'card': '0.75rem',    // 12px - for cards
        'button': '0.5rem',   // 8px - for buttons
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'card-hover': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      }
    }
  },
  plugins: []
};
