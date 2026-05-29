# Design Tokens

Values to use when implementing the design principles in SKILL.md.
These are lookup references — the principles file explains when and why to use each.

---

## Color

```css
:root {
  /* Backgrounds */
  --bg:            #FAFAF8;   /* page background — warm off-white */
  --surface:       #FFFFFF;   /* cards, inputs, dropdowns */
  --overlay:       rgba(26,26,26,0.4);

  /* Borders */
  --border:        #E8E8E4;
  --border-strong: #D0CFC9;

  /* Text */
  --text-primary:   #1A1A1A;
  --text-secondary: #6B6B65;
  --text-tertiary:  #9B9B94;
  --text-disabled:  #BEBEB8;
  --text-on-accent: #FFFFFF;

  /* Financial semantic — reserved for debit/credit sign only */
  --income:     #1A7A4A;   /* credit / money in */
  --income-bg:  #EDF7F2;
  --expense:    #C0392B;   /* debit / money out */
  --expense-bg: #FDF2F1;
  --neutral:    #2C5282;   /* transfers, net/balance lines */
  --neutral-bg: #EBF2FF;

  /* Interactive */
  --accent:       #1E3A5F;
  --accent-hover: #162C4A;
  --accent-light: #E8EEF5;   /* ghost hover, selected row */
  --link:         #2563EB;

  /* State — general UI only, never for financial data */
  --error:      #C0392B;   /* form validation */
  --error-bg:   #FDF2F1;
  --warning:    #D97706;
  --warning-bg: #FEF9EC;
  --success:    #1A7A4A;   /* non-financial confirmations */
  --success-bg: #EDF7F2;
}
```

Note: `--error` and `--success` share hex values with `--expense` and `--income`.
This is intentional — the semantic distinction is in usage context, not in color
value. Form error states live within form context; financial sign lives in data
context. They never appear in proximity to each other.

---

## Typography

```css
/* Import */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');

:root {
  --font-ui:      'Plus Jakarta Sans', -apple-system, sans-serif;
  --font-numeric: 'Geist Mono', 'Roboto Mono', monospace;

  /* Scale */
  --text-xs:   11px;   /* timestamps, badges */
  --text-sm:   13px;   /* table cells, captions, labels */
  --text-base: 15px;   /* body, form fields */
  --text-lg:   17px;   /* card headings */
  --text-xl:   20px;   /* page titles */
  --text-2xl:  26px;   /* metric card values */
  --text-3xl:  34px;   /* hero / net worth figure */

  /* Weights */
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;
}
```

---

## Spacing

8px grid. All values are multiples of 4.

```css
:root {
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
}
```

---

## Shape & Elevation

```css
:root {
  --radius-sm:   4px;     /* inputs, badges */
  --radius-md:   6px;     /* buttons, cards */
  --radius-lg:   8px;     /* modals, larger cards */
  --radius-full: 9999px;  /* pill badges */

  /* Shadows: use only for dropdowns and tooltips */
  --shadow-pop: 0 4px 16px -4px rgba(0,0,0,0.12), 0 0 0 1px var(--border);

  --transition-base: 120ms ease;  /* color and border changes only */
}
```

---

## Chart Color Order

When building multi-series charts, use this sequence consistently:

```js
const CHART_COLORS = [
  '#1A7A4A',  // 1st — income series (always)
  '#C0392B',  // 2nd — expense series (always)
  '#2C5282',  // 3rd — net/balance series (always)
  '#D97706',  // 4th
  '#5B21B6',  // 5th
  '#158187',  // 6th
];

// For category breakdowns (donut charts) — softer variants for readability:
const CATEGORY_COLORS = [
  '#4B9B7D', '#D76868', '#5694CA',
  '#F7996A', '#7F65B7', '#50A1A5',
  '#CECECE',  // "Other" — always last, always gray
];
```

---

## Account Type Color Map

For account type badges in the ledger:

| Type        | Text      | Background |
|-------------|-----------|------------|
| Asset       | `#2C5282` | `#EBF2FF`  |
| Liability   | `#9B1C1C` | `#FDF2F1`  |
| Equity      | `#5B21B6` | `#F5F3FF`  |
| Income      | `#1A7A4A` | `#EDF7F2`  |
| Expense     | `#7C3900` | `#FEF9EC`  |
