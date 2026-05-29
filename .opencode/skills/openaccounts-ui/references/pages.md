# myAccounts — Page Layouts Reference

Annotated full-page layouts for every screen in the app. Read this before building
or significantly modifying any complete page. Refer to `components.md` for the
specs of individual components used in each layout.

---

## Page Template (All Pages)

```
DESKTOP (≥1024px)
─────────────────────────────────────────────────────────────────
│                    │                                          │
│  Sidebar           │  Page Content                           │
│  240px fixed       │  flex: 1, min-width: 0                  │
│  height: 100vh     │  overflow-y: auto                       │
│  overflow-y: auto  │                                         │
│  border-right:     │  padding: 32px 40px                     │
│  1px --border      │                                         │
│                    │                                         │
─────────────────────────────────────────────────────────────────

MOBILE (<768px)
─────────────────────────────────────────────────────────────────
│  Page Content                                                 │
│  padding: 16px                                                │
│  padding-bottom: 80px  ← space for bottom tab bar            │
─────────────────────────────────────────────────────────────────
│  Bottom Tab Bar — 64px, fixed, safe-area-inset-bottom         │
─────────────────────────────────────────────────────────────────
```

### CSS Shell

```css
.app-shell {
  display:    flex;
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--font-ui);
  color:      var(--text-primary);
}

.app-sidebar {
  width:        240px;
  flex-shrink:  0;
  background:   var(--surface);
  border-right: 1px solid var(--border);
  height:       100vh;
  position:     sticky;
  top:          0;
  overflow-y:   auto;
  display:      flex;
  flex-direction: column;
}

.sidebar-logo {
  padding:     var(--space-6) var(--space-5);
  border-bottom: 1px solid var(--border);
  font-size:   var(--text-base);
  font-weight: var(--weight-bold);
  color:       var(--text-primary);
  letter-spacing: -0.01em;
}

.sidebar-nav {
  flex:    1;
  padding: var(--space-3) var(--space-2);
}

.nav-item {
  display:       flex;
  align-items:   center;
  gap:           var(--space-3);
  padding:       var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  font-size:     var(--text-sm);
  font-weight:   var(--weight-medium);
  color:         var(--text-secondary);
  cursor:        pointer;
  text-decoration: none;
  transition:    all var(--transition-base);
  border-left:   3px solid transparent;
}
.nav-item:hover {
  background: var(--accent-light);
  color:      var(--text-primary);
}
.nav-item.active {
  background:   var(--accent-light);
  color:        var(--accent);
  border-left-color: var(--accent);
  font-weight:  var(--weight-semibold);
}

.sidebar-footer {
  padding:    var(--space-4) var(--space-5);
  border-top: 1px solid var(--border);
}
.sidebar-user {
  display:     flex;
  align-items: center;
  gap:         var(--space-3);
}
.sidebar-avatar {
  width:         32px;
  height:        32px;
  border-radius: 50%;
  background:    var(--accent-light);
  border:        1px solid var(--border);
  object-fit:    cover;
}
.sidebar-username {
  font-size:   var(--text-sm);
  font-weight: var(--weight-medium);
  flex:        1;
  overflow:    hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-content {
  flex:        1;
  min-width:   0;
  padding:     var(--space-8) var(--space-10);
  overflow-y:  auto;
  min-height:  100vh;
}

@media (max-width: 768px) {
  .app-sidebar { display: none; }
  .page-content {
    padding:        var(--space-4);
    padding-bottom: 80px;
  }
}
```

---

## Home Page

### Purpose
The home page is a **command center**, not a dashboard. The user comes here to record
a transaction (the primary action) and quickly check their financial position.

### Layout

```
DESKTOP
──────────────────────────────────────────────────────────────────
 GREETING SECTION
 ─────────────────
 Good morning, Hussain                          ← --text-xl, --weight-bold
 Friday, 30 May 2026                            ← --text-sm, --text-secondary
 
 [28px gap]
 
 METRIC CARDS (2-column grid, gap: 16px)
 ──────────────────────────────────────
 ┌───────────────────────┐  ┌───────────────────────┐
 │ NET BALANCE           │  │ THIS MONTH INCOME     │
 │ AED 12,450.00         │  │ AED 8,200.00          │
 │ ▲ +3.2% vs last mo   │  │  6 transactions       │
 └───────────────────────┘  └───────────────────────┘
 ┌───────────────────────┐  ┌───────────────────────┐
 │ THIS MONTH EXPENSES   │  │ NET SAVINGS           │
 │ AED 5,750.00          │  │ AED 2,450.00          │
 │  14 transactions      │  │ 29.9% savings rate   │
 └───────────────────────┘  └───────────────────────┘
 
 [32px gap]
 
 QUICK ENTRY SECTION
 ───────────────────
 Quick Entry  ────────────────── (horizontal rule to edge)
 
 [Transaction Entry Form — full width, inline, always visible]
 
 [32px gap]
 
 RECENT TRANSACTIONS
 ───────────────────
 Recent Transactions ─────────────────────── [View all →]
 
 [Last 8 rows, ledger table, read-only, no header filter bar]
 [No pagination — "View all →" goes to full Ledger page]
──────────────────────────────────────────────────────────────────
```

### Section Divider Pattern

Used between Home page sections:

```css
.section-heading {
  display:     flex;
  align-items: center;
  gap:         var(--space-4);
  margin-bottom: var(--space-5);
}
.section-heading h2 {
  font-size:   var(--text-base);
  font-weight: var(--weight-semibold);
  color:       var(--text-primary);
  white-space: nowrap;
  margin:      0;
}
.section-heading::after {
  content:    '';
  flex:       1;
  height:     1px;
  background: var(--border);
}
.section-heading .section-action {
  font-size:   var(--text-sm);
  color:       var(--link);
  text-decoration: none;
  white-space: nowrap;
}
.section-heading .section-action:hover { text-decoration: underline; }
```

### Home Quick Entry Form

The form on the home page is **inline** (not in a card, not in a modal). It sits
directly on the page background. Inputs have `--surface` background, creating
visual separation from `--bg` without a card wrapper.

```
 Date          Description                        
 [May 30 ▾]   [Grocery run at Carrefour        ]  
                                                   
 From                To                Amount     
 [Cash ▾]            [Groceries ▾]     [AED 425 ] 
 
 Notes (optional)                                  
 [                                              ]  
 
                              [Reset]  [Save Entry ▶]
```

**Home form rules:**
- No card wrapper, no border box around the entire form
- Labels use the standard `.form-label` style
- Two-column grid on desktop: Date + Description in row 1, From + To + Amount in row 2
- Notes spans full width
- Reset is `btn-ghost`; Save is `btn-primary`
- After save: ALL fields reset. Date returns to today. Focus goes back to Description.

---

## General Ledger Page

### Purpose
Complete transaction history with filtering, sorting, and inline editing.

### Layout

```
PAGE HEADER
──────────────────────────────────────────────────────────
General Ledger                             [+ New Entry]
──────────────────────────────────────────────────────────

FILTER BAR
──────────────────────────────────────────────────────────
[📅 This month ▾] [Account: All ▾] [Type: All ▾] [🔍 Search...] [⬇ Export]
──────────────────────────────────────────────────────────

SUMMARY STRIP (updates with filters)
──────────────────────────────────────────────────────────
47 entries  |  Total Debit: AED 8,450.00  |  Total Credit: AED 12,200.00  |  Net: +AED 3,750.00
──────────────────────────────────────────────────────────

LEDGER TABLE
──────────────────────────────────────────────────────────
DATE     DESCRIPTION           ACCOUNT    DEBIT     CREDIT    BALANCE
────────────────────────────────────────────────────────────
May 15   Grocery run           Groceries  425.00    —         12,450.00
         [EXPANDED DETAIL ROW when clicked — see components.md]
May 14   Salary deposit        Income     —         8,200.00  12,875.00
May 13   DEWA electricity      Utilities  380.00    —          4,675.00
...
──────────────────────────────────────────────────────────

PAGINATION
──────────────────────────────────────────────────────────
← Previous    1  2  3  …  8    Next →
──────────────────────────────────────────────────────────
```

### Filter Date Presets

Date picker dropdown options (in order):
1. Today
2. This week (Mon–Sun)
3. This month (1st–today)
4. Last month
5. Last 3 months
6. Last 12 months
7. All time
8. Custom range → shows two date inputs inline

### Sort Behavior

- Default sort: Date descending (newest first)
- Click column header to sort ascending; click again to sort descending
- Sort indicator: `↓` (desc) or `↑` (asc) shown after column header text
- `--accent` color on the sorted column header
- Only one sort active at a time

### "+ New Entry" Button

- `btn-primary` in the page header
- Opens the transaction form as a **slide-over panel** on desktop (not a modal):
  slides in from the right, 480px wide, full-height, overlay backdrop
- Opens as a **bottom sheet** on mobile
- Pressing Escape or clicking backdrop closes without saving

### Slide-Over Panel (Desktop)

```
DESKTOP SLIDE-OVER (480px, fixed right, full height)
──────────────────────────────────────────────────────────
│  New Transaction                          [× Close]   │
│  ─────────────────────────────────────────────────    │
│                                                       │
│  [Full transaction entry form]                        │
│                                                       │
│  ──────────────────────────────────────────────────   │
│                            [Cancel]  [Save Entry ▶]  │
──────────────────────────────────────────────────────────
```

```css
.slide-over {
  position:   fixed;
  top:        0;
  right:      0;
  bottom:     0;
  width:      480px;
  background: var(--surface);
  border-left: 1px solid var(--border);
  z-index:    var(--z-modal);
  display:    flex;
  flex-direction: column;
  /* Entry animation */
  transform:  translateX(0);
}
.slide-over-header {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  padding:         var(--space-5) var(--space-6);
  border-bottom:   1px solid var(--border);
}
.slide-over-title {
  font-size:   var(--text-lg);
  font-weight: var(--weight-semibold);
}
.slide-over-body {
  flex:       1;
  overflow-y: auto;
  padding:    var(--space-6);
}
.slide-over-footer {
  padding:     var(--space-4) var(--space-6);
  border-top:  1px solid var(--border);
  display:     flex;
  justify-content: flex-end;
  gap:         var(--space-2);
}
.slide-over-backdrop {
  position:   fixed;
  inset:      0;
  background: var(--overlay);
  z-index:    calc(var(--z-modal) - 1);
}
```

---

## Chart of Accounts Page

### Purpose
Manage the account hierarchy. Users rarely visit this page — it's a configuration
surface, not an operational one. Design should be functional over flashy.

### Layout

```
PAGE HEADER
──────────────────────────────────────────────────────────
Chart of Accounts                        [+ New Account]
──────────────────────────────────────────────────────────

ACCOUNT TYPE SECTIONS (each collapsible)
──────────────────────────────────────────────────────────
▼ ASSETS                                       12 accounts
──────────────────────────────────────────────────────────
 CODE   NAME                        TYPE    BALANCE    
 1000   Cash                        Asset   12,450.00  [⋮]
 1010   Bank – Emirates NBD         Asset    8,200.00  [⋮]
 1020   Bank – ADCB                 Asset       0.00   [⋮]
──────────────────────────────────────────────────────────
▶ LIABILITIES                                  3 accounts
──────────────────────────────────────────────────────────
▶ EQUITY                                       2 accounts
──────────────────────────────────────────────────────────
▼ EXPENSES                                    18 accounts
──────────────────────────────────────────────────────────
 3000   Groceries                   Expense  1,840.00  [⋮]
 ...
──────────────────────────────────────────────────────────
▶ INCOME                                       4 accounts
──────────────────────────────────────────────────────────
```

### Section Header

```css
.account-section-header {
  display:       flex;
  align-items:   center;
  gap:           var(--space-3);
  padding:       var(--space-3) var(--space-4);
  background:    var(--bg);
  border:        1px solid var(--border);
  border-radius: var(--radius-md);
  cursor:        pointer;
  user-select:   none;
  margin-bottom: var(--space-1);
  transition:    background-color var(--transition-fast);
}
.account-section-header:hover { background: var(--accent-light); }
.account-section-icon {
  color:       var(--text-tertiary);
  transition:  transform var(--transition-base);
}
.account-section-header.open .account-section-icon {
  transform: rotate(90deg);
}
.account-section-name {
  font-size:      var(--text-sm);
  font-weight:    var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color:          var(--text-secondary);
}
.account-section-count {
  margin-left: auto;
  font-size:   var(--text-xs);
  color:       var(--text-tertiary);
  font-family: var(--font-numeric);
}
```

### Account Row Actions (⋮ menu)

Clicking ⋮ shows a small dropdown:
1. Edit account
2. View transactions →
3. ──────────────
4. Archive account

Archive (not delete) for accounts with transaction history.
Edit opens inline form replacing the row.

### New Account Form (Inline Panel)

On desktop: slide-over panel (same pattern as new transaction)
On mobile: full-screen slide-up

Form fields:
- Account Code (numeric, required, must be unique)
- Account Name (text, required)
- Account Type (select: Asset / Liability / Equity / Income / Expense)
- Normal Balance (auto-derived from type, shown read-only)
- Description (optional)
- Opening Balance (optional, amount input)

---

## Analytics Page

### Purpose
Provide financial insight through well-chosen charts. Not a comprehensive BI tool —
just the 4–5 charts that actually matter for personal finance.

### Layout

```
PAGE HEADER
──────────────────────────────────────────────────────────
Analytics                            [📅 Last 12 months ▾]
──────────────────────────────────────────────────────────

ROW 1 (2-column, gap: 24px)
──────────────────────────────────────────────────────────
┌─────────────────────────────┐  ┌──────────────────────┐
│                             │  │                      │
│  Monthly Cash Flow          │  │  Spending by         │
│  [Grouped Bar Chart]        │  │  Category            │
│  Income (green) /           │  │  [Donut Chart]       │
│  Expense (red) per month    │  │  Top 6 + "Other"     │
│                             │  │  Clickable legend    │
│                             │  │                      │
└─────────────────────────────┘  └──────────────────────┘

ROW 2 (full width)
──────────────────────────────────────────────────────────
┌────────────────────────────────────────────────────────┐
│                                                        │
│  Net Worth Over Time                                   │
│  [Area Line Chart — single series, --neutral color]    │
│  X: months, Y: balance, filled area below line        │
│                                                        │
└────────────────────────────────────────────────────────┘

ROW 3 (2-column, gap: 24px)
──────────────────────────────────────────────────────────
┌─────────────────────────────┐  ┌──────────────────────┐
│                             │  │                      │
│  Top Expenses               │  │  Monthly Summary     │
│  [Horizontal bar list]      │  │  [Table]             │
│  Category | Amount | Bar    │  │  Month / Income /    │
│  Ranked 1–8                 │  │  Expenses / Net      │
│                             │  │                      │
└─────────────────────────────┘  └──────────────────────┘
```

### Chart Configuration Notes

**Monthly Cash Flow (Recharts BarChart):**
```jsx
<BarChart data={monthlyData} barGap={4}>
  <XAxis dataKey="month" tick={{ fontSize: 12, fontFamily: 'Geist Mono' }} />
  <YAxis tick={{ fontSize: 12, fontFamily: 'Geist Mono' }} />
  <Tooltip content={<CustomTooltip />} />
  <Bar dataKey="income"   fill="var(--income)"  radius={[3,3,0,0]} />
  <Bar dataKey="expenses" fill="var(--expense)" radius={[3,3,0,0]} />
</BarChart>
```

**Net Worth (Recharts AreaChart):**
```jsx
<AreaChart data={netWorthData}>
  <defs>
    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%"  stopColor="var(--neutral)" stopOpacity={0.15} />
      <stop offset="95%" stopColor="var(--neutral)" stopOpacity={0.02} />
    </linearGradient>
  </defs>
  <Area
    type="monotone"
    dataKey="balance"
    stroke="var(--neutral)"
    strokeWidth={2}
    fill="url(#netWorthGradient)"
    dot={false}
  />
</AreaChart>
```

**Top Expenses (custom ranked list, not a chart library):**

```css
.top-expenses-list { display: flex; flex-direction: column; gap: var(--space-3); }
.expense-rank-item {
  display:     grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap:         var(--space-3);
}
.expense-rank-name {
  font-size:   var(--text-sm);
  font-weight: var(--weight-medium);
  color:       var(--text-primary);
}
.expense-rank-bar {
  height:        4px;
  background:    var(--expense-bg);
  border-radius: 2px;
  overflow:      hidden;
}
.expense-rank-bar-fill {
  height:        100%;
  background:    var(--expense);
  border-radius: 2px;
}
.expense-rank-amount {
  font-family: var(--font-numeric);
  font-size:   var(--text-sm);
  font-weight: var(--weight-semibold);
  color:       var(--text-primary);
}
```

**Monthly Summary Table:**

```
MONTH      INCOME       EXPENSES      NET
──────────────────────────────────────────
May 2026   8,200.00     5,750.00     +2,450.00
Apr 2026   8,200.00     6,140.00     +2,060.00
Mar 2026   8,200.00     4,890.00     +3,310.00
...
```

- NET column: `--income` color if positive, `--expense` if negative
- All values: `--font-numeric`, right-aligned
- Row hover: `--accent-light` background

### Date Range Selector (Global)

A single date range selector in the page header controls ALL charts simultaneously.

```css
.date-range-selector {
  display:       inline-flex;
  align-items:   center;
  gap:           var(--space-2);
  padding:       6px var(--space-3);
  background:    var(--surface);
  border:        1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size:     var(--text-sm);
  font-weight:   var(--weight-medium);
  color:         var(--text-secondary);
  cursor:        pointer;
}
.date-range-selector:hover {
  border-color: var(--accent);
  color:        var(--accent);
}
```

Preset options (same as Ledger date filter presets).

---

## Login / Auth Page

Simple, unadorned. Google Sign-In is the only option.

```
CENTERED CARD (max-width: 400px, margin: auto)
──────────────────────────────────────────────────────────
┌────────────────────────────────────────┐
│                                        │
│             myAccounts                 │  ← --text-2xl, --weight-bold, centered
│     Track every transaction.           │  ← --text-base, --text-secondary, centered
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  [Google logo]  Continue with Google   │  ← full-width Google sign-in btn
│                                        │
│  ────────────────────────────────────  │
│                                        │
│  By signing in, you agree to our       │  ← --text-xs, --text-tertiary, centered
│  Terms of Service and Privacy Policy.  │
│                                        │
└────────────────────────────────────────┘
```

```css
.auth-page {
  min-height: 100vh;
  background: var(--bg);
  display:    flex;
  align-items: center;
  justify-content: center;
  padding:    var(--space-4);
}
.auth-card {
  background:    var(--surface);
  border:        1px solid var(--border);
  border-radius: var(--radius-lg);
  padding:       var(--space-10) var(--space-8);
  width:         100%;
  max-width:     400px;
  text-align:    center;
}
.google-signin-btn {
  width:         100%;
  display:       flex;
  align-items:   center;
  justify-content: center;
  gap:           var(--space-3);
  padding:       10px var(--space-5);
  background:    var(--surface);
  border:        1px solid var(--border-strong);
  border-radius: var(--radius-md);
  font-size:     var(--text-base);
  font-weight:   var(--weight-medium);
  color:         var(--text-primary);
  cursor:        pointer;
  transition:    all var(--transition-base);
}
.google-signin-btn:hover {
  background:   var(--bg);
  border-color: var(--accent);
}
```

---

## Responsive Behavior Summary

| Element                  | Desktop (≥1024px) | Tablet (768–1023px) | Mobile (<768px)     |
|--------------------------|-------------------|---------------------|---------------------|
| Navigation               | Fixed left sidebar | Collapsible sidebar | Bottom tab bar      |
| Metric cards             | 2×2 grid          | 2×2 grid            | Horizontal scroll   |
| Entry form               | 2-col grid        | 2-col grid          | Single column       |
| Ledger table             | All columns       | Hide Notes, Ref     | Date+Desc+Amount    |
| New entry                | Slide-over panel  | Slide-over panel    | Bottom sheet        |
| Analytics charts         | 2-col + full-width | 1-col              | 1-col               |
| Account sections         | Full table        | Full table          | Card list           |
| Filter bar               | Inline row        | Wrap allowed        | Vertical stack      |

---

## First-Run / Onboarding State

When a new user signs in for the first time (zero accounts, zero transactions):

**Home page state:**
- Metric cards show "—" values with a soft placeholder style
- Quick entry form is present but account dropdowns show "Add accounts first →"
- Recent Transactions: empty state with "No transactions yet"
- A subtle banner at the top: "Start by setting up your Chart of Accounts →"

**Chart of Accounts first run:**
- Page shows default starter accounts pre-populated (Cash, Bank Account, Expenses:Groceries,
  Income:Salary, etc.) that user can edit or delete
- Banner: "These are starter accounts. Customize them to match your situation."

**Starter accounts (pre-loaded, editable):**
```
Assets:    1000 Cash, 1010 Bank Account
Liabilities: 2000 Credit Card
Equity:    3000 Opening Balance
Income:    4000 Salary
Expenses:  5000 Groceries, 5010 Utilities, 5020 Transport, 5030 Dining
```
