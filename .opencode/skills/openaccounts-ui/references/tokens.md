# OpenAccounts — Design Tokens Reference

Complete token definitions for copy-paste into CSS or Tailwind config.

---

## CSS Custom Properties (`:root`)

```css
:root {
  /* ── BACKGROUNDS ─────────────────────────────── */
  --bg:               #FAFAF8;
  --surface:          #FFFFFF;
  --surface-raised:   #FFFFFF;   /* modals, dropdowns — add border instead of shadow */
  --overlay:          rgba(26, 26, 26, 0.4); /* modal backdrop */

  /* ── BORDERS ─────────────────────────────────── */
  --border:           #E8E8E4;
  --border-strong:    #D0CFC9;
  --border-focus:     #1E3A5F;   /* same as --accent */

  /* ── TEXT ────────────────────────────────────── */
  --text-primary:     #1A1A1A;
  --text-secondary:   #6B6B65;
  --text-tertiary:    #9B9B94;
  --text-disabled:    #BEBEB8;
  --text-on-accent:   #FFFFFF;   /* text on --accent backgrounds */

  /* ── FINANCIAL SEMANTIC ──────────────────────── */
  --income:           #1A7A4A;
  --income-bg:        #EDF7F2;
  --income-border:    #B7DFD0;
  --expense:          #C0392B;
  --expense-bg:       #FDF2F1;
  --expense-border:   #F0C4C0;
  --neutral:          #2C5282;   /* transfers, adjustments */
  --neutral-bg:       #EBF2FF;
  --neutral-border:   #BDD0F0;

  /* ── INTERACTIVE ─────────────────────────────── */
  --accent:           #1E3A5F;
  --accent-hover:     #162C4A;
  --accent-active:    #0F1E31;
  --accent-light:     #E8EEF5;   /* ghost hover, selected states */
  --accent-light-hover: #D8E4F0;
  --link:             #2563EB;
  --link-hover:       #1D4ED8;
  --link-visited:     #5B21B6;

  /* ── STATE COLORS ────────────────────────────── */
  --error:            #C0392B;
  --error-bg:         #FDF2F1;
  --error-border:     #F0C4C0;
  --warning:          #D97706;
  --warning-bg:       #FEF9EC;
  --warning-border:   #F5D68A;
  --success:          #1A7A4A;
  --success-bg:       #EDF7F2;
  --success-border:   #B7DFD0;
  --info:             #2563EB;
  --info-bg:          #EFF6FF;
  --info-border:      #BFDBFE;

  /* ── ACCOUNT TYPE COLORS ─────────────────────── */
  /* Used for account badges in ledger rows */
  --account-asset:     #2C5282;
  --account-asset-bg:  #EBF2FF;
  --account-liability: #9B1C1C;
  --account-liability-bg: #FDF2F1;
  --account-equity:    #5B21B6;
  --account-equity-bg: #F5F3FF;
  --account-income:    #1A7A4A;
  --account-income-bg: #EDF7F2;
  --account-expense:   #7C3900;
  --account-expense-bg: #FEF9EC;

  /* ── TYPOGRAPHY ──────────────────────────────── */
  --font-ui:          'Plus Jakarta Sans', -apple-system, sans-serif;
  --font-numeric:     'Geist Mono', 'Roboto Mono', monospace;

  --text-xs:   11px;
  --text-sm:   13px;
  --text-base: 15px;
  --text-lg:   17px;
  --text-xl:   20px;
  --text-2xl:  26px;
  --text-3xl:  34px;

  --leading-tight:  1.2;
  --leading-snug:   1.4;
  --leading-normal: 1.6;

  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* ── SPACING ─────────────────────────────────── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  --space-20: 80px;

  /* ── RADIUS ──────────────────────────────────── */
  --radius-sm:  4px;   /* inputs, badges */
  --radius-md:  6px;   /* buttons, cards */
  --radius-lg:  8px;   /* modals, large cards */
  --radius-full: 9999px; /* pill badges */

  /* ── ELEVATION (borders only — no shadows) ────── */
  --elevation-0: none;
  --elevation-1: 0 0 0 1px var(--border);           /* cards */
  --elevation-2: 0 0 0 1px var(--border-strong);    /* focused inputs */
  --elevation-pop: 0 4px 16px -4px rgba(0,0,0,0.12),
                   0 0 0 1px var(--border);          /* dropdowns, tooltips only */

  /* ── TRANSITIONS ─────────────────────────────── */
  --transition-fast: 80ms ease;
  --transition-base: 120ms ease;
  /* Use ONLY for: hover color changes, focus rings, input borders */
  /* NEVER for: layout, opacity reveals, page transitions */

  /* ── Z-INDEX ─────────────────────────────────── */
  --z-base:     0;
  --z-sticky:   10;   /* filter bar when scrolling */
  --z-dropdown: 100;
  --z-modal:    200;
  --z-toast:    300;
}
```

---

## Tailwind Config Extension

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:       '#FAFAF8',
        surface:  '#FFFFFF',
        border:   '#E8E8E4',
        'border-strong': '#D0CFC9',

        text: {
          primary:   '#1A1A1A',
          secondary: '#6B6B65',
          tertiary:  '#9B9B94',
          disabled:  '#BEBEB8',
        },

        income:  '#1A7A4A',
        expense: '#C0392B',
        accent:  '#1E3A5F',
        link:    '#2563EB',

        'income-bg':  '#EDF7F2',
        'expense-bg': '#FDF2F1',
        'accent-light': '#E8EEF5',
      },

      fontFamily: {
        ui:      ['Plus Jakarta Sans', 'sans-serif'],
        numeric: ['Geist Mono', 'monospace'],
      },

      fontSize: {
        xs:   ['11px', '1.4'],
        sm:   ['13px', '1.4'],
        base: ['15px', '1.6'],
        lg:   ['17px', '1.4'],
        xl:   ['20px', '1.3'],
        '2xl':['26px', '1.2'],
        '3xl':['34px', '1.1'],
      },

      spacing: {
        1: '4px',  2: '8px',  3: '12px', 4: '16px',
        5: '20px', 6: '24px', 8: '32px', 10: '40px',
        12: '48px',16: '64px',20: '80px',
      },

      borderRadius: {
        sm:   '4px',
        md:   '6px',
        lg:   '8px',
        full: '9999px',
      },
    },
  },
};
```

---

## Account Type Color Map

Reference for coloring account badges and icons in the ledger:

| Account Type | Text Color        | Background           | Usage |
|-------------|-------------------|----------------------|-------|
| Asset       | `#2C5282`         | `#EBF2FF`            | Cash, bank accounts, receivables |
| Liability   | `#9B1C1C`         | `#FDF2F1`            | Credit cards, loans payable |
| Equity      | `#5B21B6`         | `#F5F3FF`            | Owner's equity, retained earnings |
| Income      | `#1A7A4A`         | `#EDF7F2`            | Salary, freelance, interest earned |
| Expense     | `#7C3900`         | `#FEF9EC`            | Groceries, utilities, rent |

---

## Chart Color Sequences

For multi-series charts (Recharts or Chart.js):

```javascript
// Primary series colors — use in this order
const CHART_COLORS = [
  '#1A7A4A',  // income/positive (income series always first)
  '#C0392B',  // expense/negative (expense series always second)
  '#2C5282',  // neutral/balance (net series always third)
  '#D97706',  // 4th series (warnings, secondary metrics)
  '#5B21B6',  // 5th series
  '#158187',  // 6th series (teal)
];

// Category donut chart — use muted variants for readability
const CATEGORY_COLORS = [
  '#4B9B7D',  // softer green
  '#D76868',  // softer red
  '#5694CA',  // softer blue
  '#F7996A',  // softer orange
  '#7F65B7',  // softer purple
  '#50A1A5',  // softer teal
  '#CECECE',  // "Other" — always last, always gray
];
```

---

## Icon Reference

Use Lucide icons exclusively. Standard sizes:

| Context             | Size | Lucide Component     |
|---------------------|------|----------------------|
| Nav sidebar item    | 18px | varies per section   |
| Table action button | 16px | `Edit2`, `Trash2`    |
| Input prefix/suffix | 16px | `Calendar`, `Search` |
| Metric card trend   | 14px | `TrendingUp`, `TrendingDown` |
| Badge/tag           | 12px | `Tag`, `Folder`      |
| Empty state         | 48px | context-specific     |

All icons use `currentColor` — inherit text color from parent.

Nav icon map:
```
Home      → LayoutGrid
Ledger    → List
Accounts  → Layers
Analytics → BarChart2
Settings  → Settings
Sign Out  → LogOut
```
