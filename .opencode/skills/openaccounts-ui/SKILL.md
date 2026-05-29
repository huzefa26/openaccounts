---
name: myaccounts-ui
description: >
  UI/UX design system and component guide for myAccounts — a minimalist personal
  double-entry accounting web app. Use this skill whenever building, designing, or
  iterating on any part of the myAccounts interface: the home dashboard, data entry
  form, general ledger, chart of accounts, or analytics page. Also use when designing
  individual components like transaction rows, metric cards, account selectors, or
  filter panels. Trigger this skill even for small UI tasks like "make the ledger
  table look better" or "style the entry form" — it contains all design tokens,
  component patterns, and layout blueprints needed to produce consistent, high-quality
  output that matches the app's visual language.
---

# myAccounts — UI/UX Design Skill

A complete design system for a minimalist, trustworthy personal accounting app built
on the double-entry ledger system. Users sign in with Google and immediately land on
a focused, frictionless interface for tracking every dirham, dollar, or dinar.

**Before writing any UI code, read this file completely.** Then consult the reference
files for the specific area you are building:
- `references/tokens.md` — Colors, typography, spacing, elevation
- `references/components.md` — Reusable component patterns and variants
- `references/pages.md` — Full page layouts and composition rules

---

## Design Philosophy

### The "Quiet Precision" Identity

myAccounts occupies the intersection of three inspirations:

- **iOS Notes** — content-first, zero chrome, immediate entry, the app gets out of the way
- **GOV.UK Design System** — systematic, accessible, zero ambiguity, every color has a job
- **Lattice / Agora** — structured data hierarchy, clear progressive disclosure, enterprise
  trust signals without enterprise visual weight

The result: **a well-organized notebook that happens to run on a computer.** No gradients
chasing trendiness, no shadows competing for attention, no chrome decorating the page.
Every pixel either carries information or creates breathing room.

Financial data is inherently high-stakes. Users must trust what they see. Visual noise
erodes trust. The design earns trust through restraint.

### One Rule Above All Others

> Numbers must always be unambiguous. Right-aligned. Monospaced. Semantically colored.
> A user glancing at the ledger must instantly know: was money coming in or going out?

---

## Design Tokens (Summary)

Full token reference: `references/tokens.md`

### Colors

```css
/* Base */
--bg:             #FAFAF8;   /* Warm off-white — like quality paper */
--surface:        #FFFFFF;   /* Cards, inputs, modals */
--border:         #E8E8E4;   /* Dividers, input outlines */
--border-strong:  #D0CFC9;   /* Table headers, active inputs */

/* Text */
--text-primary:   #1A1A1A;   /* Body, labels, headings */
--text-secondary: #6B6B65;   /* Placeholders, captions, secondary labels */
--text-tertiary:  #9B9B94;   /* Disabled, hints */

/* Semantic — Financial */
--income:         #1A7A4A;   /* Credit / income / positive balance */
--income-bg:      #EDF7F2;   /* Credit row tint, badge background */
--expense:        #C0392B;   /* Debit / expense / negative balance */
--expense-bg:     #FDF2F1;   /* Debit row tint, badge background */
--neutral:        #2C5282;   /* Transfers, adjusting entries */
--neutral-bg:     #EBF2FF;   /* Transfer row tint */

/* Interactive */
--accent:         #1E3A5F;   /* Primary buttons, active nav, focus rings */
--accent-hover:   #162C4A;   /* Button hover */
--accent-light:   #E8EEF5;   /* Button ghost hover, selected row */
--link:           #2563EB;   /* Inline text links */

/* State */
--error:          #C0392B;   /* Validation errors */
--error-bg:       #FDF2F1;
--warning:        #D97706;   /* Warnings, overdue */
--warning-bg:     #FEF9EC;
--success:        #1A7A4A;   /* Confirmations */
--success-bg:     #EDF7F2;
```

**Color discipline rules:**
- `--income` and `--expense` are ONLY for financial sign — never for general UI states
- `--accent` is for one primary action per view — do not use for decorative elements
- Do not invent new colors. Every UI state maps to the palette above
- Background tints (`*-bg`) are for row highlights and badges, never for full-surface fills

### Typography

```css
/* Fonts — import via Google Fonts */
/* UI font: Plus Jakarta Sans — humanist, legible, warm */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

/* Number font: Geist Mono — perfectly proportioned for financial columns */
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap');

--font-ui:      'Plus Jakarta Sans', sans-serif;
--font-numeric: 'Geist Mono', monospace;  /* ALL numbers, currency, amounts */

/* Type Scale */
--text-xs:   11px;   /* Badges, timestamps in dense rows */
--text-sm:   13px;   /* Table cells, form hints, captions */
--text-base: 15px;   /* Body text, form labels, nav items */
--text-lg:   17px;   /* Card titles, section headings */
--text-xl:   20px;   /* Page headings */
--text-2xl:  26px;   /* Metric card values */
--text-3xl:  34px;   /* Hero metric (e.g., net worth) */

/* Line heights */
--leading-tight:  1.2;   /* Headings */
--leading-snug:   1.4;   /* UI elements */
--leading-normal: 1.6;   /* Body text */

/* Weights */
--weight-regular: 400;
--weight-medium:  500;  /* Labels, nav items, table headers */
--weight-semibold: 600; /* Card titles, button text, amounts */
--weight-bold:    700;  /* Page titles, hero metrics */
```

**Typography discipline rules:**
- `--font-numeric` on EVERY number, amount, balance, date, account code
- Never use `font-weight: 700` on body text
- `--text-sm` is the minimum readable size — never go smaller except for timestamps
- Letter-spacing: `0.01em` for UI labels, `-0.01em` for large headings

### Spacing

8px grid. All spacing values are multiples of 4.

```css
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
```

**Layout breakpoints:**

```css
--bp-sm:  640px;
--bp-md:  768px;
--bp-lg:  1024px;
--bp-xl:  1280px;
```

---

## Application Structure

### Navigation

The app uses a **left sidebar** on desktop (240px wide) and a **bottom tab bar** on mobile.

**Sidebar items (desktop):**
```
[Logo + "myAccounts"]
────────────────────
● Home          (grid-2x2 icon)
  Ledger        (list icon)
  Accounts      (layers icon)
  Analytics     (bar-chart icon)
────────────────────
[User avatar + name]
[Sign out]
```

**Sidebar behavior:**
- Active item: `--accent-light` background, `--accent` left border (3px), `--accent` text
- Inactive item: `--text-secondary` text, hover fades to `--accent-light` bg
- No animations on nav items — nav is chrome, not content
- Bottom section pins to bottom of sidebar

**Mobile bottom tabs:** Home | Ledger | Accounts | Analytics — icon + label, 48px hit targets.

### Page Shell

```
┌─────────────┬────────────────────────────────────────┐
│             │  Page Header (56px)                     │
│  Sidebar    │  ─────────────────────────────────────  │
│  (240px)    │                                         │
│             │  Page Content                           │
│             │  (padding: 32px 40px)                   │
│             │                                         │
└─────────────┴────────────────────────────────────────┘
```

**Page header:** Title (`--text-xl`, `--weight-bold`) + optional right-side action button.
Stays at top, does NOT stick — pages scroll freely.

---

## Key Components

Full component reference: `references/components.md`

### 1. Transaction Entry Form

The most-used surface in the app. Optimize for speed of repeated entry.

```
┌────────────────────────────────────────────────────┐
│  New Transaction                          [ESC ×]  │
├────────────────────────────────────────────────────┤
│                                                    │
│  Date        [  May 15, 2026  ▾  ]                 │
│                                                    │
│  Description  [Grocery run at Carrefour         ]  │
│                                                    │
│  FROM Account  [  Cash  ▾  ]      ← debit side     │
│  TO Account    [  Groceries  ▾  ] ← credit side    │
│                                                    │
│  Amount        [  AED   425.00  ]                  │
│                                                    │
│  Notes (optional)  [                            ]  │
│                                                    │
├────────────────────────────────────────────────────┤
│                          [Cancel]  [Save Entry ▶] │
└────────────────────────────────────────────────────┘
```

**Form rules:**
- Date defaults to today — user should almost never need to change it
- Description gets autofocus on open
- Account selectors are searchable dropdowns with account type grouping
- Amount: currency symbol is a non-editable prefix, value is right-aligned in input
- Amount field: `--font-numeric`, `--text-lg`, `--weight-semibold`
- Tab order: Description → FROM → TO → Amount → Notes → Save
- "Save Entry" is `--accent` background — the only accent-colored element on screen
- After save: form resets to blank (date stays today), focus returns to Description
- Keyboard shortcut: `Cmd/Ctrl + Enter` to save

**Validation display:**
- Errors appear as `--error` colored helper text below the field, NOT alert banners
- Input border turns `--error` color when invalid
- Never disable the Save button — show errors on attempt instead

### 2. Metric Cards (Home)

Four cards in a 2×2 grid on desktop, horizontal scroll on mobile.

```
┌─────────────────────┐  ┌─────────────────────┐
│ Net Balance         │  │ This Month Income   │
│                     │  │                     │
│ AED 12,450.00       │  │ AED 8,200.00        │
│ ↑ +3.2% vs last mo │  │  6 transactions     │
└─────────────────────┘  └─────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐
│ This Month Expenses │  │ Net Savings         │
│                     │  │                     │
│ AED 5,750.00        │  │ AED 2,450.00        │
│  14 transactions    │  │ 29.9% savings rate  │
└─────────────────────┘  └─────────────────────┘
```

**Card anatomy:**
- Background: `--surface`, border: `1px solid --border`, border-radius: `8px`
- NO box-shadows — separation via border only
- Label: `--text-sm`, `--text-secondary`, `--weight-medium`, `letter-spacing: 0.04em`, UPPERCASE
- Value: `--font-numeric`, `--text-2xl`, `--weight-bold`, `--text-primary`
- Sub-label: `--text-sm`, `--text-secondary`
- Trend indicator: `--income` for positive ▲, `--expense` for negative ▼
- Padding: `--space-6` all sides
- Net Balance card: value uses `--income` if positive, `--expense` if negative

### 3. Transaction Row (Ledger)

The atomic unit of the ledger table.

```
Date        Description           Account      Debit       Credit      Balance
──────────────────────────────────────────────────────────────────────────────
May 15      Grocery run           Groceries    425.00                  12,450.00
May 14      Salary deposit        Income                   8,200.00    12,875.00
May 13      DEWA electricity      Utilities    380.00                   4,675.00
```

**Row rules:**
- All amount columns: `--font-numeric`, `text-align: right`, `--weight-medium`
- Debit column values: `--expense` color
- Credit column values: `--income` color
- Balance column: `--text-primary`, turns `--expense` if negative
- Empty debit/credit cells: show `—` in `--text-tertiary`, not blank
- Row hover: `--accent-light` background (entire row, no transition)
- Selected row: `--accent-light` bg + `3px --accent` left border
- Date: `--font-numeric`, `--text-sm`, `--text-secondary`
- Description: `--text-base`, `--text-primary`, truncate with ellipsis at 240px
- Account badge: pill shape, `--text-xs`, account-type color (see tokens), max 20 chars

**Table header:**
- `--text-xs`, `--text-secondary`, `--weight-medium`, `letter-spacing: 0.06em`, UPPERCASE
- `--border` bottom line, `--bg` background (not white)
- Amount headers: right-aligned to match column content
- Clickable for sort: shows ↑↓ indicator inline

### 4. Account Selector Dropdown

Used in transaction entry form and ledger filters.

```
┌─────────────────────────────────┐
│  🔍 Search accounts...          │
├─────────────────────────────────┤
│  ASSETS                         │
│    › Cash                       │
│    › Bank Account – Emirates NBD│
│    › Bank Account – ADCB        │
│  EXPENSES                       │
│    › Groceries                  │
│    › Utilities                  │
│    › Transport                  │
│  INCOME                         │
│    › Salary                     │
└─────────────────────────────────┘
```

**Rules:**
- Grouped by account type with `--text-xs` UPPERCASE sticky group labels
- Search filters live — no submit button
- Currently selected account: checkmark + `--accent` text
- Max height: 280px, scrollable
- Keyboard navigable (arrow keys, Enter to select, Esc to close)
- Account code shown in `--text-tertiary` after name: `Cash  1010`

### 5. Filter Bar (Ledger)

```
[📅 This month ▾]  [Account: All ▾]  [Type: All ▾]  [🔍 Search...]  [⬇ Export]
```

**Rules:**
- All filters are inline pills, not a sidebar panel
- Active filter: `--accent-light` bg, `--accent` text + border
- Date range preset options: Today, This week, This month, Last month, Custom range
- Filters stack vertically on mobile
- Search input: 200px wide, expands on focus to 320px (CSS transition)
- Export button: ghost style, right-aligned, only visible when results > 0

---

## Page Blueprints

Full page specs: `references/pages.md`

### Home Page

```
┌──────────────────────────────────────────────────────┐
│  Good morning, Hussain                               │
│  Friday, 30 May 2026                                 │
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Metric] [Metric]  ← 2-column on desktop           │
│  [Metric] [Metric]                                   │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Quick Entry  ─────────────────── [+ New Entry]     │
│  [Transaction Entry Form — inline, not modal]        │
│                                                      │
├──────────────────────────────────────────────────────┤
│  Recent Transactions ──────────── [View all →]      │
│  [Last 8 transaction rows, read-only]                │
└──────────────────────────────────────────────────────┘
```

**Home-specific rules:**
- Greeting adapts: "Good morning / afternoon / evening"
- Quick Entry form is always visible (not behind a button) — this is the app's reason for being
- Recent Transactions: 8 rows max, no filters, no pagination
- "View all →" links to Ledger with no active filters

### General Ledger Page

```
┌──────────────────────────────────────────────────────┐
│  General Ledger                    [+ New Entry]     │
├──────────────────────────────────────────────────────┤
│  [Filter Bar]                                        │
├──────────────────────────────────────────────────────┤
│  Summary: 47 entries  |  Total debit: 8,450  |       │
│           Total credit: 12,200  |  Net: +3,750       │
├──────────────────────────────────────────────────────┤
│  [Full ledger table — sortable, paginated 25/page]   │
└──────────────────────────────────────────────────────┘
```

**Ledger-specific rules:**
- Summary bar appears between filters and table — updates live with filter changes
- Pagination: "Previous | 1 2 3 … 8 | Next" at bottom, always visible
- Clicking a row expands inline detail (not a modal) showing all fields + edit/delete
- Edit opens inline edit form replacing the expanded row
- Delete: shows inline confirmation ("Delete this entry? [Cancel] [Delete]"), no modal
- Empty state: centered illustration + "No transactions yet. Add your first entry above."

### Chart of Accounts Page

```
┌──────────────────────────────────────────────────────┐
│  Chart of Accounts              [+ New Account]      │
├──────────────────────────────────────────────────────┤
│  [ASSETS ▾]  (12 accounts)    [LIABILITIES ▾]  (3)  │
│  [EQUITY ▾]  (2 accounts)     [INCOME ▾]       (4)  │
│  [EXPENSES ▾] (18 accounts)                          │
├──────────────────────────────────────────────────────┤
│  Code    Name                   Type       Balance   │
│  ──────────────────────────────────────────────────  │
│  1000    Cash                   Asset      12,450    │
│  1010    Bank – Emirates NBD    Asset       8,200    │
│  …                                                   │
└──────────────────────────────────────────────────────┘
```

**Accounts-specific rules:**
- Accounts grouped under expandable type sections (collapsed by default, except Assets)
- Code: `--font-numeric`, `--text-sm`, `--text-secondary`
- Balance: `--font-numeric`, `--income` if normal-balance positive, `--expense` if debit-heavy expense account
- New Account form: slides in from right on mobile, inline panel on desktop
- Archive (not delete) accounts that have existing transactions

### Analytics Page

```
┌──────────────────────────────────────────────────────┐
│  Analytics                    [📅 Last 12 months ▾] │
├─────────────────────┬────────────────────────────────┤
│                     │                                │
│  Monthly Cash Flow  │  Spending by Category          │
│  (Bar chart)        │  (Donut chart)                 │
│  Income vs Expenses │  Top 6 categories + legend     │
│                     │                                │
├─────────────────────┴────────────────────────────────┤
│  Net Worth Over Time                                 │
│  (Line chart — full width)                           │
├────────────────────────────────────────────────────  │
│  Top Expense Categories    │  Monthly Summary Table  │
│  (Ranked list with bars)   │  (Income/Exp/Net cols)  │
└────────────────────────────────────────────────────  ┘
```

**Analytics-specific rules:**
- Charts use Recharts library (if React) or Chart.js (if plain HTML)
- Chart colors: Income series always `--income`, Expense series always `--expense`,
  Net/Balance series always `--neutral` (#2C5282)
- No chart borders or background fills — charts float on `--bg`
- Chart tooltips: `--surface` background, `1px --border` border, `--font-numeric` for values
- Empty state for each chart when no data for selected period
- Date range selector updates ALL charts simultaneously

---

## Interaction Design

### Micro-interactions (use sparingly)

```css
/* Standard transition — only on interactive elements */
transition: background-color 120ms ease, border-color 120ms ease, color 120ms ease;

/* No transitions on: layout changes, table rows appearing, page navigation */
/* No bounce, spring, or elastic easings — this is a finance app, not a toy */
```

**What gets transitions:** button hover/focus, input focus ring, dropdown open/close,
  row expand/collapse, form field validation state change.

**What does NOT get transitions:** page loads, table renders, number updates, navigation.

### Forms

- **Autofocus:** always on the first meaningful field (not the date, which defaults correctly)
- **Inline validation:** validate on blur, not on keystroke
- **Error recovery:** when user corrects an error, clear the error message immediately on input
- **Loading state:** save button shows spinner + "Saving…", disabled during submit
- **Success feedback:** brief green checkmark in the button for 1.5s, then reset to normal

### Empty States

Every empty state needs:
1. A simple SVG illustration (line-style, `--text-tertiary` color, max 120×80px)
2. A heading: what's missing, stated factually
3. A single action button to address it

Example: Ledger with no transactions →
- Illustration: simple ledger book outline
- Heading: "No transactions yet"
- Button: "+ Record your first entry"

### Loading States

- Use skeleton screens (not spinners) for table/list content loading
- Skeleton: `--border` colored blocks, correct heights, no animation
- Spinners only for action feedback (save, delete, export buttons)

---

## Accessibility Requirements

Based on WCAG 2.2 AA compliance:

- **Contrast:** All text on `--bg` or `--surface` must meet 4.5:1 ratio minimum
  - `--text-primary` (#1A1A1A) on `--bg` (#FAFAF8): 16.1:1 ✓
  - `--text-secondary` (#6B6B65) on `--surface` (#FFFFFF): 5.7:1 ✓
  - `--income` (#1A7A4A) on `--income-bg` (#EDF7F2): 4.8:1 ✓
  - `--expense` (#C0392B) on `--expense-bg` (#FDF2F1): 5.1:1 ✓
- **Focus rings:** Every interactive element must show a visible focus ring:
  ```css
  :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
  ```
- **Touch targets:** Minimum 44×44px on mobile for all interactive elements
- **Screen readers:** All icon buttons need `aria-label`. Table headers need `scope="col"`.
  Amount columns need `aria-label` with full value ("four hundred twenty-five dirhams").
- **Color alone:** Never use color as the ONLY differentiator — debit/credit rows should
  also have a text label or icon, not just color

---

## Anti-Patterns (Never Do These)

1. **No shadows for separation.** Use borders. Shadows add visual noise.
2. **No gradients.** On any UI element. Period.
3. **No data tables without right-aligned numbers.** Ever.
4. **No modals for confirming simple actions.** Use inline confirmation.
5. **No toast notifications that auto-dismiss for errors.** Errors are persistent until resolved.
6. **No success toasts for every save.** The updated data in the table IS the confirmation.
7. **No infinite scroll in the ledger.** Pagination allows the user to know where they are.
8. **No color outside the defined palette.** Not even "just for this chart."
9. **No italic text anywhere.** It feels informal and reduces legibility at small sizes.
10. **No placeholder text as labels.** Every input has a visible label above it.
11. **No disabled buttons with no explanation.** If an action is unavailable, say why inline.
12. **No numbers formatted without commas.** `12450.00` → always `12,450.00`.

---

## Implementation Stack Notes

When building in **React (preferred):**
- Use Tailwind CSS for layout and spacing (map tokens to Tailwind config)
- Use Recharts for all charts
- Use Lucide React for all icons (consistent 16px/20px sizing)
- `tabular-nums` CSS feature for monospaced numbers without switching fonts:
  ```css
  font-variant-numeric: tabular-nums;  /* fallback if Geist Mono unavailable */
  ```

When building in **plain HTML/CSS/JS:**
- Use CSS custom properties (variables) — defined in `:root`
- Use CSS Grid for card layouts, Flexbox for rows
- Import fonts via Google Fonts `<link>` in `<head>`
- Chart.js for charts

**Number formatting utility (use everywhere):**
```javascript
const formatAmount = (value, currency = 'AED') =>
  new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
// formatAmount(12450) → "AED 12,450.00"
```

---

Read `references/components.md` for detailed specs on every component.
Read `references/pages.md` for annotated full-page layouts.
Read `references/tokens.md` for the complete design token reference.
