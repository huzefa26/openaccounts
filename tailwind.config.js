/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        income: {
          DEFAULT: 'var(--income)',
          bg: 'var(--income-bg)',
        },
        expense: {
          DEFAULT: 'var(--expense)',
          bg: 'var(--expense-bg)',
        },
        neutral: {
          DEFAULT: 'var(--neutral)',
          bg: 'var(--neutral-bg)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          light: 'var(--accent-light)',
        },
        link: 'var(--link)',
        error: {
          DEFAULT: 'var(--error)',
          bg: 'var(--error-bg)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        success: {
          DEFAULT: 'var(--success)',
          bg: 'var(--success-bg)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
          disabled: 'var(--text-disabled)',
          'on-accent': 'var(--text-on-accent)',
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
        pop: '0 4px 16px -4px rgba(0,0,0,0.12), 0 0 0 1px var(--border)',
      },
      transitionDuration: {
        base: '120ms',
      },
    },
  },
  plugins: [],
};
