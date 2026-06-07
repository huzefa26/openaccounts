/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#FAFAF8',
        surface: '#FFFFFF',
        border: {
          DEFAULT: '#E8E8E4',
          strong: '#D0CFC9',
        },
        income: {
          DEFAULT: '#1A7A4A',
          bg: '#EDF7F2',
        },
        expense: {
          DEFAULT: '#C0392B',
          bg: '#FDF2F1',
        },
        neutral: {
          DEFAULT: '#2C5282',
          bg: '#EBF2FF',
        },
        accent: {
          DEFAULT: '#1E3A5F',
          hover: '#162C4A',
          light: '#E8EEF5',
        },
        link: '#2563EB',
        error: {
          DEFAULT: '#C0392B',
          bg: '#FDF2F1',
        },
        warning: {
          DEFAULT: '#D97706',
          bg: '#FEF9EC',
        },
        success: {
          DEFAULT: '#1A7A4A',
          bg: '#EDF7F2',
        },
        text: {
          primary: '#1A1A1A',
          secondary: '#6B6B65',
          tertiary: '#9B9B94',
          disabled: '#BEBEB8',
          'on-accent': '#FFFFFF',
        },
      },
      fontFamily: {
        ui: ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
        numeric: ['Geist Mono', 'Roboto Mono', 'monospace'],
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '20px'],
        base: ['15px', '22px'],
        lg: ['17px', '24px'],
        xl: ['20px', '28px'],
        '2xl': ['26px', '34px'],
        '3xl': ['34px', '40px'],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
        full: '9999px',
      },
      boxShadow: {
        pop: '0 4px 16px -4px rgba(0,0,0,0.12), 0 0 0 1px #E8E8E4',
      },
      transitionDuration: {
        base: '120ms',
      },
      keyframes: {
        'pulse-once': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        'fade-cross': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0', transform: 'scale(0.8)' },
          '51%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'pulse-once': 'pulse-once 0.4s ease-in-out',
        'fade-cross': 'fade-cross 0.3s ease-in-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
