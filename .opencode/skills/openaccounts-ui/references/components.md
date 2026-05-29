# OpenAccounts — Component Reference

Detailed specifications for every reusable component. Every component follows the
tokens defined in `tokens.md`. Read this file before building any individual component.

---

## Buttons

### Primary Button
The ONE call-to-action on a view. Use sparingly — one primary per screen.

```css
.btn-primary {
  background:    var(--accent);
  color:         var(--text-on-accent);
  border:        none;
  border-radius: var(--radius-md);
  padding:       10px var(--space-5);
  font-family:   var(--font-ui);
  font-size:     var(--text-sm);
  font-weight:   var(--weight-semibold);
  letter-spacing: 0.01em;
  cursor: pointer;
  transition: background-color var(--transition-base);
}
.btn-primary:hover  { background: var(--accent-hover); }
.btn-primary:active { background: var(--accent-active); }
.btn-primary:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.btn-primary:disabled {
  background: var(--text-disabled);
  cursor: not-allowed;
}
```

### Secondary (Ghost) Button
Used for Cancel, secondary actions.

```css
.btn-ghost {
  background:    transparent;
  color:         var(--text-secondary);
  border:        1px solid var(--border);
  border-radius: var(--radius-md);
  padding:       9px var(--space-5);  /* 1px less — accounts for border */
  font-size:     var(--text-sm);
  font-weight:   var(--weight-medium);
  cursor: pointer;
  transition: background-color var(--transition-base),
              border-color var(--transition-base);
}
.btn-ghost:hover {
  background:   var(--accent-light);
  border-color: var(--border-strong);
  color:        var(--text-primary);
}
```

### Danger Button
Used ONLY for delete confirmations (inline, not modal).

```css
.btn-danger {
  background:    var(--expense);
  color:         white;
  border:        none;
  /* same shape as btn-primary */
}
.btn-danger:hover { background: #A93223; }
```

### Icon Button
For table row actions (edit, delete), filter actions.

```css
.btn-icon {
  background:    transparent;
  border:        none;
  border-radius: var(--radius-sm);
  padding:       var(--space-1) var(--space-2);
  color:         var(--text-tertiary);
  cursor:        pointer;
  display:       inline-flex;
  align-items:   center;
  justify-content: center;
  transition:    color var(--transition-base),
                 background-color var(--transition-base);
}
.btn-icon:hover {
  color:      var(--text-primary);
  background: var(--border);
}
```

---

## Form Inputs

### Text Input

```css
.input {
  width:         100%;
  background:    var(--surface);
  border:        1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  padding:       9px var(--space-3);
  font-family:   var(--font-ui);
  font-size:     var(--text-base);
  font-weight:   var(--weight-regular);
  color:         var(--text-primary);
  transition:    border-color var(--transition-base);
  outline:       none;
}
.input::placeholder { color: var(--text-tertiary); }
.input:hover        { border-color: var(--border-strong); }
.input:focus        { border-color: var(--accent); }
.input:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: -1px;  /* inside the border */
}
.input.error        { border-color: var(--error); }
```

### Amount Input (financial)

The amount input is special — it combines a currency prefix with a monospaced value field.

```
┌──────────────────────────┐
│ AED │     12,450.00      │
└──────────────────────────┘
```

```css
.input-amount-wrapper {
  display:        flex;
  align-items:    center;
  border:         1px solid var(--border-strong);
  border-radius:  var(--radius-sm);
  background:     var(--surface);
  overflow:       hidden;
}
.input-amount-prefix {
  padding:      9px var(--space-3);
  background:   var(--bg);
  border-right: 1px solid var(--border);
  color:        var(--text-secondary);
  font-family:  var(--font-numeric);
  font-size:    var(--text-sm);
  font-weight:  var(--weight-medium);
  white-space:  nowrap;
  user-select:  none;
}
.input-amount-field {
  flex:          1;
  border:        none;
  background:    transparent;
  padding:       9px var(--space-3);
  font-family:   var(--font-numeric);
  font-size:     var(--text-lg);
  font-weight:   var(--weight-semibold);
  text-align:    right;
  color:         var(--text-primary);
  outline:       none;
}
.input-amount-wrapper:focus-within {
  border-color: var(--accent);
  outline: 2px solid var(--accent);
  outline-offset: -1px;
}
```

### Form Label

```css
.form-label {
  display:       block;
  font-family:   var(--font-ui);
  font-size:     var(--text-sm);
  font-weight:   var(--weight-medium);
  color:         var(--text-secondary);
  margin-bottom: var(--space-1);
  letter-spacing: 0.01em;
}
.form-label .required-mark { color: var(--expense); margin-left: 2px; }
```

### Helper / Error Text

```css
.form-hint {
  font-size: var(--text-xs);
  color:     var(--text-tertiary);
  margin-top: var(--space-1);
}
.form-error {
  font-size: var(--text-xs);
  color:     var(--error);
  margin-top: var(--space-1);
}
```

### Select / Dropdown Trigger

```css
.select-trigger {
  /* same base as .input */
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  cursor:          pointer;
  user-select:     none;
}
.select-trigger .chevron {
  color:       var(--text-tertiary);
  transition:  transform var(--transition-base);
  flex-shrink: 0;
}
.select-trigger[aria-expanded="true"] .chevron {
  transform: rotate(180deg);
}
```

### Dropdown Panel

```css
.dropdown-panel {
  position:      absolute;
  top:           calc(100% + var(--space-1));
  left:          0;
  min-width:     100%;
  background:    var(--surface);
  border:        1px solid var(--border-strong);
  border-radius: var(--radius-md);
  box-shadow:    var(--elevation-pop);
  z-index:       var(--z-dropdown);
  max-height:    280px;
  overflow-y:    auto;
  padding:       var(--space-1) 0;
}
.dropdown-search {
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  background: var(--surface);
}
.dropdown-group-label {
  padding:        var(--space-2) var(--space-3) var(--space-1);
  font-size:      var(--text-xs);
  font-weight:    var(--weight-medium);
  color:          var(--text-tertiary);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.dropdown-item {
  padding:         var(--space-2) var(--space-3);
  font-size:       var(--text-sm);
  color:           var(--text-primary);
  cursor:          pointer;
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  gap:             var(--space-2);
  transition:      background-color var(--transition-fast);
}
.dropdown-item:hover    { background: var(--accent-light); }
.dropdown-item.selected {
  color:      var(--accent);
  font-weight: var(--weight-medium);
}
.dropdown-item .account-code {
  color:       var(--text-tertiary);
  font-family: var(--font-numeric);
  font-size:   var(--text-xs);
  margin-left: auto;
}
```

---

## Metric Card

```jsx
// React — Metric Card
function MetricCard({ label, value, currency = 'AED', subLabel, trend }) {
  const isPositive = trend?.direction === 'up';
  const isNegative = trend?.direction === 'down';
  
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${isPositive ? 'income' : isNegative ? 'expense' : ''}`}>
        {currency} {formatAmount(value)}
      </span>
      {trend && (
        <span className={`metric-trend ${isPositive ? 'up' : 'down'}`}>
          {isPositive ? '▲' : '▼'} {trend.value}% vs last month
        </span>
      )}
      {subLabel && <span className="metric-sublabel">{subLabel}</span>}
    </div>
  );
}
```

```css
.metric-card {
  background:    var(--surface);
  border:        1px solid var(--border);
  border-radius: var(--radius-lg);
  padding:       var(--space-6);
  display:       flex;
  flex-direction: column;
  gap:           var(--space-1);
}
.metric-label {
  font-size:      var(--text-xs);
  font-weight:    var(--weight-medium);
  color:          var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.metric-value {
  font-family: var(--font-numeric);
  font-size:   var(--text-2xl);
  font-weight: var(--weight-bold);
  color:       var(--text-primary);
  line-height: var(--leading-tight);
}
.metric-value.income  { color: var(--income); }
.metric-value.expense { color: var(--expense); }
.metric-trend.up      { color: var(--income); font-size: var(--text-xs); }
.metric-trend.down    { color: var(--expense); font-size: var(--text-xs); }
.metric-sublabel      { color: var(--text-tertiary); font-size: var(--text-xs); }
```

---

## Ledger Table

```css
.ledger-table {
  width:           100%;
  border-collapse: collapse;
  table-layout:    fixed;
}

/* Column widths */
.col-date        { width: 100px; }
.col-description { width: auto; }    /* flexible */
.col-account     { width: 160px; }
.col-debit       { width: 120px; }
.col-credit      { width: 120px; }
.col-balance     { width: 130px; }
.col-actions     { width: 64px; }

.ledger-table thead th {
  padding:        var(--space-2) var(--space-3);
  background:     var(--bg);
  border-bottom:  1px solid var(--border-strong);
  font-size:      var(--text-xs);
  font-weight:    var(--weight-medium);
  color:          var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space:    nowrap;
  text-align:     left;
}

/* Right-align all amount headers */
.ledger-table thead th.amount { text-align: right; }

.ledger-table tbody tr {
  border-bottom: 1px solid var(--border);
  transition:    background-color var(--transition-fast);
}

.ledger-table tbody tr:last-child { border-bottom: none; }

.ledger-table tbody tr:hover {
  background: var(--accent-light);
}

.ledger-table tbody tr.selected {
  background:    var(--accent-light);
  box-shadow:    inset 3px 0 0 var(--accent);
}

.ledger-table td {
  padding:      var(--space-3);
  font-size:    var(--text-sm);
  color:        var(--text-primary);
  vertical-align: middle;
}

/* Date cell */
td.cell-date {
  font-family:  var(--font-numeric);
  font-size:    var(--text-xs);
  color:        var(--text-secondary);
  white-space:  nowrap;
}

/* Description cell */
td.cell-description {
  font-size:     var(--text-base);
  overflow:      hidden;
  text-overflow: ellipsis;
  white-space:   nowrap;
  max-width:     0;  /* enables text-overflow in table cells */
}

/* Amount cells — ALWAYS right-aligned, ALWAYS monospaced */
td.cell-debit,
td.cell-credit,
td.cell-balance {
  font-family: var(--font-numeric);
  font-weight: var(--weight-medium);
  text-align:  right;
  white-space: nowrap;
}

td.cell-debit   { color: var(--expense); }
td.cell-credit  { color: var(--income); }
td.cell-balance { color: var(--text-primary); }
td.cell-balance.negative { color: var(--expense); }

/* Empty cell placeholder */
td.cell-debit:empty::after,
td.cell-credit:empty::after {
  content: '—';
  color:   var(--text-tertiary);
}

/* Actions cell */
td.cell-actions {
  text-align: right;
  opacity:    0;
  transition: opacity var(--transition-fast);
}
tr:hover td.cell-actions { opacity: 1; }
```

---

## Account Badge (Type Pill)

Used in ledger rows to show account type.

```css
.account-badge {
  display:       inline-flex;
  align-items:   center;
  gap:           3px;
  padding:       2px 7px;
  border-radius: var(--radius-full);
  font-size:     var(--text-xs);
  font-weight:   var(--weight-medium);
  white-space:   nowrap;
  max-width:     140px;
  overflow:      hidden;
  text-overflow: ellipsis;
}

/* Apply account type colors (see tokens.md) */
.account-badge.asset     { color: var(--account-asset);     background: var(--account-asset-bg); }
.account-badge.liability { color: var(--account-liability); background: var(--account-liability-bg); }
.account-badge.equity    { color: var(--account-equity);    background: var(--account-equity-bg); }
.account-badge.income    { color: var(--account-income);    background: var(--account-income-bg); }
.account-badge.expense   { color: var(--account-expense);   background: var(--account-expense-bg); }
```

---

## Filter Bar

```css
.filter-bar {
  display:    flex;
  align-items: center;
  gap:        var(--space-2);
  flex-wrap:  wrap;
  padding:    var(--space-4) 0;
  border-bottom: 1px solid var(--border);
}

.filter-pill {
  display:       inline-flex;
  align-items:   center;
  gap:           var(--space-1);
  padding:       6px var(--space-3);
  background:    var(--surface);
  border:        1px solid var(--border-strong);
  border-radius: var(--radius-full);
  font-size:     var(--text-sm);
  font-weight:   var(--weight-medium);
  color:         var(--text-secondary);
  cursor:        pointer;
  white-space:   nowrap;
  transition:    all var(--transition-base);
}
.filter-pill:hover {
  border-color: var(--accent);
  color:        var(--accent);
  background:   var(--accent-light);
}
.filter-pill.active {
  background:   var(--accent-light);
  border-color: var(--accent);
  color:        var(--accent);
}

/* Search input in filter bar */
.filter-search {
  /* same base as .input but smaller and pill-shaped */
  width:         200px;
  border-radius: var(--radius-full);
  padding:       6px var(--space-3) 6px var(--space-8);  /* left pad for icon */
  font-size:     var(--text-sm);
  transition:    width var(--transition-base);
}
.filter-search:focus { width: 320px; }

/* Export button — right-aligned */
.filter-bar .export-btn { margin-left: auto; }
```

---

## Summary Strip (Ledger)

The totals bar that appears between filter bar and table.

```css
.ledger-summary {
  display:    flex;
  gap:        var(--space-6);
  padding:    var(--space-3) 0;
  border-bottom: 1px solid var(--border);
  font-size:  var(--text-sm);
  color:      var(--text-secondary);
}
.ledger-summary .summary-item strong {
  font-family: var(--font-numeric);
  font-weight: var(--weight-semibold);
  color:       var(--text-primary);
}
.ledger-summary .summary-item strong.positive { color: var(--income); }
.ledger-summary .summary-item strong.negative { color: var(--expense); }
```

---

## Inline Row Expansion

When a ledger row is clicked, it expands inline (no modal).

```
┌────────────────────────────────────────────────────────────────────────┐
│ May 15  │ Grocery run at Carrefour  │ Groceries  │ 425.00  │  │ 12,450 │
├────────────────────────────────────────────────────────────────────────┤
│  [Expanded detail panel]                                               │
│                                                                        │
│  Date:        May 15, 2026              Reference: TXN-0042            │
│  Description: Grocery run at Carrefour                                 │
│  From:        Cash (Asset)                                             │
│  To:          Groceries (Expense)                                      │
│  Amount:      AED 425.00                                               │
│  Notes:       Weekly grocery shop                                      │
│                                                                        │
│                              [Edit entry]   [Delete entry]             │
└────────────────────────────────────────────────────────────────────────┘
```

```css
.row-detail {
  background:  var(--bg);
  border-top:  1px dashed var(--border);
  padding:     var(--space-4) var(--space-3);
}
.row-detail-grid {
  display:               grid;
  grid-template-columns: 120px 1fr 120px 1fr;
  gap:                   var(--space-2) var(--space-4);
  margin-bottom:         var(--space-4);
}
.row-detail-label {
  font-size:   var(--text-xs);
  font-weight: var(--weight-medium);
  color:       var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.row-detail-value {
  font-size: var(--text-sm);
  color:     var(--text-primary);
}
.row-detail-actions {
  display:         flex;
  justify-content: flex-end;
  gap:             var(--space-2);
}
```

---

## Inline Delete Confirmation

Replaces the detail actions row — no modal needed.

```
┌─────────────────────────────────────────────────────────┐
│  This will permanently delete "Grocery run at           │
│  Carrefour" (AED 425.00). This cannot be undone.        │
│                                                         │
│                             [Cancel]  [Delete entry ✕] │
└─────────────────────────────────────────────────────────┘
```

Warning text: `--text-sm`, `--text-secondary`
Cancel: `btn-ghost`
Delete: `btn-danger`

---

## Toast Notifications

Minimal — only for system feedback, NOT for every save action.

```css
.toast-container {
  position:  fixed;
  bottom:    var(--space-6);
  right:     var(--space-6);
  z-index:   var(--z-toast);
  display:   flex;
  flex-direction: column;
  gap:       var(--space-2);
}

.toast {
  display:       flex;
  align-items:   center;
  gap:           var(--space-3);
  padding:       var(--space-3) var(--space-4);
  background:    var(--surface);
  border:        1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow:    var(--elevation-pop);
  font-size:     var(--text-sm);
  min-width:     280px;
  max-width:     400px;
}

.toast.success { border-left: 3px solid var(--success); }
.toast.error   { border-left: 3px solid var(--error); }
.toast.warning { border-left: 3px solid var(--warning); }
```

**Toast rules:**
- SUCCESS toasts: use ONLY for export complete, import complete, account archived
- ERROR toasts: for network errors, server failures (NOT form validation)
- Never auto-dismiss error toasts — user must dismiss them
- Success toasts auto-dismiss after 3 seconds
- Maximum 3 toasts visible at once

---

## Empty States

```css
.empty-state {
  display:        flex;
  flex-direction: column;
  align-items:    center;
  justify-content: center;
  padding:        var(--space-20) var(--space-8);
  text-align:     center;
  gap:            var(--space-4);
}
.empty-state .icon {
  color: var(--border-strong);
  /* Use 48px Lucide icon */
}
.empty-state h3 {
  font-size:   var(--text-lg);
  font-weight: var(--weight-semibold);
  color:       var(--text-primary);
  margin:      0;
}
.empty-state p {
  font-size:  var(--text-base);
  color:      var(--text-secondary);
  max-width:  320px;
  margin:     0;
  line-height: var(--leading-normal);
}
```

---

## Skeleton Loading

For table/list loading states — no spinners, no opacity pulses.

```css
.skeleton {
  background:    var(--border);
  border-radius: var(--radius-sm);
  /* Static — no animation. Clean, not distracting. */
}

/* Skeleton row in ledger */
.skeleton-row td::after {
  content:       '';
  display:       block;
  height:        14px;
  background:    var(--border);
  border-radius: var(--radius-sm);
  width:         80%;
}

/* Metric card skeleton */
.skeleton-metric {
  height:  120px;
  border:  1px solid var(--border);
  border-radius: var(--radius-lg);
}
```

---

## Pagination

```css
.pagination {
  display:     flex;
  align-items: center;
  justify-content: center;
  gap:         var(--space-1);
  padding:     var(--space-4) 0;
  border-top:  1px solid var(--border);
}

.page-btn {
  min-width:     32px;
  height:        32px;
  display:       inline-flex;
  align-items:   center;
  justify-content: center;
  border:        1px solid transparent;
  border-radius: var(--radius-sm);
  font-family:   var(--font-numeric);
  font-size:     var(--text-sm);
  color:         var(--text-secondary);
  cursor:        pointer;
  transition:    all var(--transition-fast);
}
.page-btn:hover  { border-color: var(--border); color: var(--text-primary); }
.page-btn.active {
  background:   var(--accent-light);
  border-color: var(--accent);
  color:        var(--accent);
  font-weight:  var(--weight-semibold);
}
.page-btn.disabled {
  color:  var(--text-disabled);
  cursor: not-allowed;
}
.page-ellipsis {
  color: var(--text-tertiary);
  font-size: var(--text-sm);
  padding: 0 var(--space-1);
}
```

---

## Chart Wrapper

Standard wrapper for any Recharts / Chart.js chart.

```css
.chart-card {
  background:    var(--surface);
  border:        1px solid var(--border);
  border-radius: var(--radius-lg);
  padding:       var(--space-6);
}
.chart-card-header {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  margin-bottom:   var(--space-4);
}
.chart-card-title {
  font-size:   var(--text-base);
  font-weight: var(--weight-semibold);
  color:       var(--text-primary);
}
.chart-area {
  /* No background, no border — chart floats on card surface */
}

/* Recharts tooltip override */
.recharts-tooltip-wrapper .recharts-default-tooltip {
  background:    var(--surface) !important;
  border:        1px solid var(--border-strong) !important;
  border-radius: var(--radius-sm) !important;
  box-shadow:    var(--elevation-pop) !important;
  font-family:   var(--font-ui) !important;
  font-size:     var(--text-sm) !important;
}
.recharts-tooltip-item-value {
  font-family: var(--font-numeric) !important;
  font-weight: var(--weight-semibold) !important;
}
```
