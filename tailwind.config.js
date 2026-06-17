// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {

        // ── Surfaces ──────────────────────────────────────
        bg:      '#FAFAF8',   // page background
        surface: '#FFFFFF',   // cards, panels, inputs
        overlay: 'rgba(26,26,26,0.4)', // modal backdrop

        // ── Borders ───────────────────────────────────────
        border: {
          DEFAULT: '#E8E8E4',
          strong:  '#D0CFC9',
        },

        // ── Text ──────────────────────────────────────────
        text: {
          primary:    '#1A1A1A',
          secondary:  '#6B6B65',
          tertiary:   '#9B9B94',
          disabled:   '#BEBEB8',
          'on-accent':'#FFFFFF',
        },

        // ── Brand / Interactive ───────────────────────────
        // Swap these 3 values to change the app theme
        // Aditional options are mentioned at the end of this file
        accent: { DEFAULT: '#1E3A5F', hover: '#162C4A', light: '#E8EEF5' },

        // ── Semantic feedback ─────────────────────────────
        success: { DEFAULT: '#1A7A4A', bg: '#EDF7F2' },
        error:   { DEFAULT: '#C0392B', bg: '#FDF2F1' },
        warning: { DEFAULT: '#D97706', bg: '#FEF9EC' },
        info:    { DEFAULT: '#0369A1', bg: '#F0F9FF' },

        // ── Financial domain ──────────────────────────────
        // Same values as success/error — kept separate by intent
        income:  { DEFAULT: '#1A7A4A', bg: '#EDF7F2' },
        expense: { DEFAULT: '#C0392B', bg: '#FDF2F1' },
      },

      // ── Typography ────────────────────────────────────
      fontFamily: {
        ui:      ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
        numeric: ['Geist Mono', 'Roboto Mono', 'monospace'],
      },

      fontSize: {
        xs:   ['11px', '16px'],
        sm:   ['13px', '20px'],
        base: ['15px', '22px'],
        lg:   ['17px', '24px'],
        xl:   ['20px', '28px'],
        '2xl':['26px', '34px'],
        '3xl':['34px', '40px'],
      },

      // ── Spacing (4px base grid) ───────────────────────
      spacing: {
        1:  '4px',
        2:  '8px',
        3:  '12px',
        4:  '16px',
        5:  '20px',
        6:  '24px',
        8:  '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },

      // ── Radius ────────────────────────────────────────
      borderRadius: {
        sm:   '4px',    // tags, small badges
        md:   '6px',    // buttons, inputs
        lg:   '8px',    // cards, modals, dropdowns
        full: '9999px', // pills, avatars
      },

      // ── Elevation ─────────────────────────────────────
      boxShadow: {
        pop: '0 4px 16px -4px rgba(0,0,0,0.12), 0 0 0 1px #E8E8E4',
      },

      // ── Motion ────────────────────────────────────────
      transitionDuration: {
        base: '120ms',
      },

      keyframes: {
        'pulse-once': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'fade-cross': {
          '0%':   { opacity: '1', transform: 'scale(1)' },
          '50%':  { opacity: '0', transform: 'scale(0.8)' },
          '51%':  { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        'fade-out': {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
      },

      animation: {
        'pulse-once': 'pulse-once 0.4s ease-in-out',
        'fade-cross': 'fade-cross 0.3s ease-in-out',
        'slide-up':   'slide-up 0.3s ease-out',
        'fade-out':   'fade-out 0.3s ease-out',
      },
    },
  },
  plugins: [],
};

/**
 * Option A - Deep Navy (current) - Safe, professional. Standard for financial software.
 * css: `--accent: #1E3A5F; --accent-hover: #162C4A; --accent-light: #E8EEF5;`
 * js: `accent: { DEFAULT: '#1E3A5F', hover: '#162C4A', light: '#E8EEF5' },`
 * 
 * Option B - Slate - Slightly warmer and more desaturated than the current navy.
 * Feels more contemporary and less corporate. Low contrast with the current colours, easy to swap.
 * css: `--accent: #243B55; --accent-hover: '#1A2D42; --accent-light: #E7ECF2;`
 * js: `accent: { DEFAULT: '#243B55', hover: '#1A2D42', light: '#E7ECF2' },`
 * 
 * Option C - Graphite - Very minimal — the accent stops being "coloured" and becomes structural.
 * The income green and expense red become the dominant hues in the UI, thereby carrying the most meaning.
 * css: `--accent: #2D3748; --accent-hover: '#222C3C; --accent-light: #EAECF0;`
 * js: `accent: { DEFAULT: '#2D3748', hover: '#222C3C', light: '#EAECF0' },`
 */