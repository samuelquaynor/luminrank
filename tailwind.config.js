/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ffffff',
          light: '#ffffff',
          dark: '#e0e0e0',
        },
        accent: {
          DEFAULT: '#a0a0a0',
          light: '#c0c0c0',
          dark: '#808080',
        },
        bg: {
          primary: '#0a0a0f',
          secondary: '#141419',
          tertiary: '#1e1e24',
          elevated: '#252530',
          hover: '#2d2d38',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.16)',
          focus: 'rgba(255, 255, 255, 0.5)',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'Helvetica Neue', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.4)',
        'md': '0 4px 16px rgba(0, 0, 0, 0.5)',
        'lg': '0 8px 32px rgba(0, 0, 0, 0.6)',
        'xl': '0 16px 48px rgba(0, 0, 0, 0.7)',
        'glow': '0 0 20px rgba(255, 255, 255, 0.2)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
      },
    },
  },
  plugins: [],
}

