# OpenAccounts — Project Specification
> **Version:** 2.0 | **Status:** Active
> Core build (Phases 1–9) is complete. Feature sessions A–F are pending.
> Read this file in full before every agent session. Update the Build Status section at the end of every session.

---

## 1. App Overview

**Name:** OpenAccounts
**Purpose:** A personal double-entry accounting app that runs entirely in the browser. All data is stored locally in IndexedDB and synced to the user's own Google Drive. There is no backend server of any kind.
**Target user:** Personal use; can be shared within a family or small group at the user's discretion.
**Core principle:** Minimal data entry. The double-entry rule (sum of credits = sum of debits, enforced per currency) is always maintained.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Framework | React 18 (functional components + hooks only) |
| Styling | Tailwind CSS v3 (utility classes only — no inline styles) |
| Build tool | Vite |
| Routing | React Router v6 |
| State management | Zustand |
| Local database | IndexedDB via the `idb` library |
| Auth | Google Identity Services (GIS) — token client flow |
| Cloud sync | Google Drive REST API — `drive.appData` scope |
| Deployment | Vercel (SPA config required — see Session F) |

### What the agent must NEVER do
- No backend, no server-side code, no API routes of any kind
- No Firebase, Auth0, Supabase, or any third-party auth or database service
- No exchange rate APIs or live price feeds
- No account codes on Chart of Accounts entries
- No inline styles — Tailwind classes only
- No class components — functional components only
- No Redux, MobX, or any state library other than Zustand
- Do not touch files outside the current session's declared scope

---

## 3. Folder Structure

```
src/
├── components/
│   ├── ui/                  # Reusable primitives: Button, Input, Modal, Badge, Toast, etc.
│   ├── layout/              # AppShell, Navbar (desktop top), BottomNav (mobile)
│   ├── forms/               # TransactionForm, CategoryForm
│   └── tables/              # LedgerTable, CategoryTable
├── pages/
│   ├── Home.jsx
│   ├── Ledger.jsx
│   ├── Analytics.jsx        # Placeholder only (future feature)
│   ├── Categories.jsx
│   └── Profile.jsx
├── db/
│   ├── index.js             # idb initialisation + upgrade logic (schema v1)
│   ├── categories.js        # CRUD for categories store
│   ├── transactions.js      # CRUD for transactions store
│   ├── transactionLines.js  # CRUD for transaction_lines store
│   ├── currencies.js        # CRUD for currencies store
│   └── settings.js          # CRUD for settings store
├── sync/
│   ├── googleAuth.js        # GIS token client: init, sign-in, sign-out, token checks
│   ├── googleDrive.js       # Drive REST API: read/write openaccounts.json in appData
│   └── syncEngine.js        # Pull → merge (last-write-wins by updated_at) → push
├── store/
│   ├── categoryStore.js     # Zustand: categories
│   ├── transactionStore.js  # Zustand: transactions + lines
│   ├── currencyStore.js     # Zustand: currencies list + default
│   ├── settingsStore.js     # Zustand: app-wide settings
│   ├── authStore.js         # Zustand: GIS auth state
│   ├── syncStore.js         # Zustand: sync status, last synced timestamp
│   └── toastStore.js        # Zustand: toast notification queue (added in Session C)
├── hooks/
│   ├── useBalance.js        # Net running balance for a category (multi-currency)
│   └── useMetrics.js        # Home page metric computations
├── utils/
│   ├── accounting.js        # Per-currency debit=credit validation, balance formulas
│   ├── math.js              # Expression evaluator for amount fields (added in Session B)
│   ├── export.js            # Full JSON dump of all IndexedDB stores
│   ├── import.js            # JSON import + validation (added in Session E)
│   └── uuid.js              # crypto.randomUUID() wrapper
├── constants/
│   ├── baseCoa.js           # 22 base Chart of Accounts entries (see Section 6)
│   ├── baseCurrencies.js    # Common currency list with codes, names, symbols
│   └── accountColors.js     # Account type → Tailwind colour token map (added in Session A)
├── App.jsx                  # Router setup
└── main.jsx                 # Vite entry point
```

---

## 4. Data Model (IndexedDB)

**Database name:** `openaccounts_db`
**Current schema version:** `1`

All records use ISO 8601 strings for `created_at` and `updated_at`. All IDs are UUIDs via `crypto.randomUUID()`.

---

### 4.1 `categories` store

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `name` | string | Required |
| `type` | string | Enum: `asset` `liability` `income` `expense` `equity` |
| `parent_id` | string \| null | UUID of parent category. null = root |
| `description` | string | Optional |
| `opening_balance` | number | Default: 0 |
| `is_system` | boolean | True only for Opening Balance Equity. Cannot be edited or deleted |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

**Index:** `type`

---

### 4.2 `transactions` store

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `date` | string | Format: `YYYY-MM-DD` |
| `description` | string | Required |
| `notes` | string | Optional |
| `is_opening_balance` | boolean | True for system-generated opening balance transactions |
| `opening_balance_category_id` | string \| null | Set when `is_opening_balance` is true |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

---

### 4.3 `transaction_lines` store

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `transaction_id` | string (UUID) | Foreign key → transactions |
| `category_id` | string (UUID) | Foreign key → categories |
| `entry_type` | string | Enum: `debit` \| `credit` |
| `currency` | string | ISO 4217 code, e.g. `AED`, `USD` |
| `amount` | number | Always positive |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

**Index:** `transaction_id`

---

### 4.4 `currencies` store

| Field | Type | Notes |
|---|---|---|
| `code` | string | Primary key. ISO 4217, e.g. `AED` |
| `name` | string | E.g. `UAE Dirham` |
| `symbol` | string | E.g. `د.إ` |
| `is_default` | boolean | Exactly one must be true at all times |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

---

### 4.5 `settings` store

| Field | Type | Notes |
|---|---|---|
| `key` | string | Primary key |
| `value` | string | JSON-serialised |
| `updated_at` | string | ISO timestamp |

**Reserved keys:**

| Key | Value type | Description |
|---|---|---|
| `app_version` | string | DB schema version |
| `onboarding_complete` | boolean | First-run seeding done |
| `last_synced_at` | string | ISO timestamp of last successful Drive sync |
| `theme` | string | `light` \| `dark`. Mirrors `localStorage.oa_theme` |

---

## 5. Business Logic Rules

### 5.1 Double-entry invariant (per currency)

Every transaction must satisfy: for each currency present in its lines, the sum of credit amounts equals the sum of debit amounts.

```
For each currency C in transaction.lines:
  SUM(amount | entry_type = "credit" AND currency = C)
  === SUM(amount | entry_type = "debit" AND currency = C)
```

The Save button is disabled until this condition is met for all currencies. A real-time per-currency balance indicator below the From/To sections shows the running difference. When a currency reaches zero difference, its indicator animates to a green confirmed state (Session A).

**Future (not in scope):** Currency conversion with Forex Gain/Loss category as the absorbing counter-entry.

---

### 5.2 Opening balances

When a user sets or modifies an opening balance on a category:

1. Check for an existing transaction where `is_opening_balance = true` AND `opening_balance_category_id = category.id`.
2. If found: delete its lines and recreate with the new amount.
3. If not found: create a new transaction.
4. If the new opening balance is zero: delete the transaction entirely.

**Transaction generated uses the home/default currency at the time of creation.**

| Account type | Debit | Credit |
|---|---|---|
| Asset | The category | Opening Balance Equity |
| Liability | Opening Balance Equity | The category |
| Equity | Opening Balance Equity | The category |
| Income | Opening Balance Equity | The category |
| Expense | The category | Opening Balance Equity |

**Opening Balance Equity** is `is_system: true`, type `equity`. Auto-created on first run. Cannot be edited, deleted, or selected in the transaction form.

---

### 5.3 Net running balance formula

Used in `useBalance.js` and displayed on the Categories page.

```
Normal balance side:
  asset, expense  → debit  (increases with debits)
  liability, equity, income → credit

For each currency C:
  if normal_side = "debit":
    balance[C] = opening_balance (home currency) + Σ debits[C] − Σ credits[C]
  if normal_side = "credit":
    balance[C] = opening_balance (home currency) + Σ credits[C] − Σ debits[C]
```

`opening_balance` applies to the home currency bucket only. Multi-currency accounts return a balance map keyed by currency code.

---

### 5.4 Category deletion rules

- `is_system: true` → cannot be deleted. No UI affordance shown.
- Has transaction lines referencing it → block deletion. Error: *"This category has recorded transactions. Remove or reassign them first."*
- Has child categories → block deletion. Error: *"This category has sub-categories. Delete or reassign them first."*

---

### 5.5 Transaction form semantics

**From section = credits. To section = debits.**

Example — paying for groceries from a bank account:
- From (credit): Bank Account 100 AED — money leaves the asset.
- To (debit): Groceries 100 AED — expense is incurred.

---

### 5.6 Ledger — client-side data pipeline

All transactions and their lines are loaded from IndexedDB into memory on the Ledger page mount (and on any mutation). The pipeline runs in this order:

```
Load all transactions + lines from IndexedDB
  → Sort by date DESC, then created_at DESC
  → Apply active filters (see §7.3)
  → Paginate: slice to page × PAGE_SIZE
```

`PAGE_SIZE = 20` (constant, no selector).

---

### 5.7 Transaction deletion

Hard delete only. Deletes the transaction record and all its `transaction_lines` records. Preceded by a confirmation dialog: *"Delete this transaction? This cannot be undone."*

---

## 6. Base Chart of Accounts

Seeded on first run. Insert parents before children. `description` and `opening_balance` default to empty string and 0 respectively.

```js
[
  { name: 'Cash',                   type: 'asset' },
  { name: 'Bank Account',           type: 'asset' },
  { name: 'Wallets',                type: 'asset' },
  { name: 'Accounts Receivable',    type: 'asset' },
  { name: 'Fixed Assets',           type: 'asset' },
  { name: 'Investments',            type: 'asset' },
  { name: 'Credit Card',            type: 'liability' },
  { name: 'Loans',                  type: 'liability' },
  { name: 'Accounts Payable',       type: 'liability' },
  { name: 'Income',                 type: 'income' },
  { name: 'Interest Income',        type: 'income' },
  { name: 'General Expenses',       type: 'expense' },
  { name: 'Food & Dining',          type: 'expense' },
  { name: 'Groceries',              type: 'expense',   parent: 'Food & Dining' },
  { name: 'Dining Out',             type: 'expense',   parent: 'Food & Dining' },
  { name: 'Transportation',         type: 'expense' },
  { name: 'Utilities',              type: 'expense' },
  { name: 'Rent',                   type: 'expense',   parent: 'Utilities' },
  { name: 'Entertainment',          type: 'expense' },
  { name: 'Apparel & Cosmetics',    type: 'expense' },
  { name: 'Healthcare',             type: 'expense' },
  { name: 'Opening Balance Equity', type: 'equity',    is_system: true },
]
```

---

## 7. Screen Specifications

### 7.1 Navigation

| Breakpoint | Pattern |
|---|---|
| `< md` (mobile) | Fixed bottom navigation bar — 5 icon + label tabs |
| `>= md` (desktop) | Top horizontal navbar — 5 links |

**Nav items (in order):** Home · Ledger · Analytics · Categories · Profile

The navbar also contains the **Light/Dark mode toggle** (sun/moon icon). Default theme: Light. Active route is highlighted. No nested routing.

---

### 7.2 Home page (`/`)

**Layout order (top to bottom):**

1. Transaction Entry Form
2. Metrics strip
3. Last 5 transactions (minified)

---

**Transaction Entry Form**

| Field | Rules |
|---|---|
| Date | Date picker. Default: today (`YYYY-MM-DD`) |
| Description | Text input. Required |
| From (credits) | Dynamic rows. Min 1 row. Each row: Category dropdown · Currency dropdown (default: home currency) · Amount input. Add row button. Delete row button (disabled when only 1 row remains) |
| To (debits) | Same structure as From |
| Notes | Textarea. Optional |
| Save | Disabled until per-currency invariant is met (§5.1) |

Below From and To sections: real-time per-currency balance indicator. Shows difference per currency (e.g. `AED: −50.00` or `AED: 0.00 ✓`). Animates to confirmed green state when difference hits zero (Session A).

On save: write transaction + lines to IndexedDB → update Zustand stores → show success toast (Session C) → reset form (today's date, cleared fields, 1 row each side).

**Keyboard shortcuts on the form (Session B):**
- `Tab` — moves predictably through fields in order
- `Enter` on the last amount field of any row — adds a new row in the same section
- `Cmd+S` / `Ctrl+S` — submits a valid form

---

**Metrics strip** — 3 cards, shown below the form:
- *Total Expenses This Month:* Sum of all debit amounts on `expense`-type lines for the current calendar month. Per-currency.
- *Total Receivables:* Net running balance of `Accounts Receivable` and all its descendants. Per-currency.
- *Total Payables:* Net running balance of `Accounts Payable` and all its descendants. Per-currency.

---

**Last 5 transactions** — ordered by `date` DESC, then `created_at` DESC. Each row: Date · Description · Per-currency total amounts (debit side).

---

### 7.3 Ledger page (`/ledger`)

**Filter bar** (collapsible on mobile):

| Filter | Type |
|---|---|
| Date range | From / To date pickers |
| Quick date chips (Session D) | `Today` · `This Week` · `This Month` · `Last Month` · `This Year` — sets date range filter instantly |
| Category | Multi-select dropdown |
| Account Type | Multi-select: Asset / Liability / Income / Expense / Equity |
| Currency | Multi-select from user's active currencies |
| Amount range | Min / Max number inputs |
| Description | Free-text substring search (case-insensitive) |

---

**Table columns:**

| Column | Notes |
|---|---|
| Date | `YYYY-MM-DD` |
| Description | |
| Notes | Truncated; expand on hover/tap |
| From | Sub-columns: Category · Currency · Amount (credit lines) |
| To | Sub-columns: Category · Currency · Amount (debit lines) |
| Balance (Session D) | Running net balance. Visible only when exactly 1 category is active in the filter. Oldest→newest ordering. Uses §5.3 formula |
| Actions | Edit icon · Delete icon |

Multi-line transactions display stacked sub-rows in From/To cells.

**Pagination:** Page size fixed at `PAGE_SIZE = 20`. No selector. Previous / Next controls. Current page and total pages displayed.

---

**Edit transaction:** Opens `TransactionForm` in a modal or slide-over, pre-filled with existing data. On save: update transaction record, delete old lines, insert new lines, update `updated_at`. Show success toast (Session C).

**Delete transaction:** Confirmation dialog (§5.7). On confirm: hard delete → show toast (Session C).

**Undo toast (Session C):** Immediately after Save, a toast appears for 5 seconds: *"Transaction saved — Undo."* Clicking Undo deletes the transaction and restores the form with the pre-save data. After 5 seconds the toast dismisses silently. Implemented using a transient `lastSavedTransaction` key in `transactionStore`.

---

### 7.4 Categories page (`/categories`)

**Header:** "Categories" title + "New Category" button (top right).

**List layout:** Grouped by `type` in order: Asset → Liability → Income → Expense → Equity. Within each group: root categories listed, children indented beneath their parent.

**Each row:**

| Column | Notes |
|---|---|
| Name | Bold for roots; indented + muted for children |
| Opening Balance | Displayed if non-zero |
| Net Balance | Per-currency running balance (§5.3). Shown as a currency-keyed list. Dash for leaf expense/income categories where lifetime totals are not meaningful |
| Edit | Icon button → Category Form |
| Delete | Icon button → deletion rules (§5.4) |

**Category Form (modal):**

| Field | Rules |
|---|---|
| Name | Required |
| Account Type | Required. Dropdown: Asset / Liability / Income / Expense / Equity |
| Parent Category | Dropdown filtered to same type only. Optional. Includes "None (root)" option |
| Description | Optional textarea |
| Opening Balance | Number input. Default 0 |

On save with `opening_balance > 0`: run opening balance logic (§5.2).
On edit where `opening_balance` changed: re-run opening balance logic (§5.2).

**Inline category creation from the transaction form (Session B):**
When the user types a name in the form's category dropdown that has no match, a *"Create '[name]'"* option appears at the bottom of the dropdown list. Selecting it opens a minimal modal requiring **Name** (pre-filled) and **Account Type** (required — no default). On save, the category is created and immediately selected in the form. A caption reads: *"Manage all categories on the Categories page."*

---

### 7.5 Profile page (`/profile`)

**Sections:**

**Account**
- Google profile photo + display name + email (from GIS user info)
- Logout button — clears auth tokens from localStorage, resets `authStore`, redirects to sign-in state

**Home Currency**
- Displays current default currency
- "Change" opens a dropdown to select from the user's active currencies

**Currencies**
- List of active currencies (code · name · symbol)
- "Add Currency" — searchable dropdown from `baseCurrencies.js`
- Delete icon per row — disabled with tooltip for the default currency

**Data & Sync**
- "Sync with Google Drive" button — triggers sync engine (§9)
- Last synced timestamp (from `syncStore.lastSynced`)
- Sync status indicator: idle / syncing / error
- "Export Data" button — triggers JSON export (§10.1)
- "Import Data" button (Session E) — file input for `.json` import (§10.2)

---

### 7.6 Analytics page (`/analytics`)

Placeholder only. Displays: *"Analytics coming soon."* No logic.

---

## 8. Design System

### 8.1 Typography

```css
--font-ui:      'Plus Jakarta Sans', -apple-system, sans-serif;
--font-numeric: 'Geist Mono', 'Roboto Mono', monospace;
```

`font-ui` is the default body and UI font.

`font-numeric` must be registered as a Tailwind utility in `tailwind.config.js`:

```js
theme: {
  extend: {
    fontFamily: {
      numeric: ['Geist Mono', 'Roboto Mono', 'monospace'],
    },
  },
},
```

Apply `font-numeric` (i.e. `className="font-numeric"`) to **all** amount values, balance figures, currency totals, and date strings throughout the app. This is applied in Session A.

---

### 8.2 Theme — Light / Dark

- Tailwind dark mode strategy: `class` (not `media`).
- The `dark` class is toggled on the `<html>` element.
- User preference persisted in `localStorage` under key `oa_theme` (`light` | `dark`) and mirrored in `settings` store under key `theme`.
- Default: `light`.
- Toggle: sun/moon icon button in the Navbar (both desktop and mobile nav).

---

### 8.3 Account type colour system

Defined in `src/constants/accountColors.js`. Applied in Session A to: category badges, category dropdown options, ledger row tints, and category list group headers.

| Account type | Tailwind light classes | Tailwind dark classes |
|---|---|---|
| Asset | `bg-teal-500/10 text-teal-700` | `dark:text-teal-400` |
| Liability | `bg-rose-500/10 text-rose-700` | `dark:text-rose-400` |
| Income | `bg-emerald-500/10 text-emerald-700` | `dark:text-emerald-400` |
| Expense | `bg-amber-500/10 text-amber-700` | `dark:text-amber-400` |
| Equity | `bg-violet-500/10 text-violet-700` | `dark:text-violet-400` |

Use low-opacity backgrounds (`/10`) for row tints and badge fills. Full colour for text labels.

---

## 9. Google Auth (GIS)

### 9.1 Library

Google Identity Services loaded via script tag: `https://accounts.google.com/gsi/client`

Flow: **Token client** (`google.accounts.oauth2.initTokenClient`)

**OAuth scopes:**
```
openid
email
profile
https://www.googleapis.com/auth/drive.appdata
```

### 9.2 Token storage

| localStorage key | Content |
|---|---|
| `oa_access_token` | GIS access token string |
| `oa_token_expiry` | ISO timestamp of token expiry |

No refresh token — GIS token client does not issue refresh tokens.

### 9.3 Token checks

Two checks run in `googleAuth.js`:

**Strict check** — Run on app load and before any protected action (Drive sync). Verifies the user is still signed in with Google. If the token is expired and silent re-auth fails, the user is shown a sign-in prompt.

**Early refresh check** — Run proactively when `oa_token_expiry` is within 5 minutes of the current time. Calls `tokenClient.requestAccessToken({ prompt: '' })` to silently obtain a fresh token. Ensures no active task (e.g. a sync in progress) breaks mid-execution due to expiry.

### 9.4 Sign-in gate

The full app is usable without signing in (all local IndexedDB features work). Google Sign-In is required only for Drive sync. The sync section on the Profile page shows *"Sign in to enable sync"* if `authStore.isSignedIn` is false.

---

## 10. Google Drive Sync

### 10.1 Drive file

- **Scope:** `drive.appData` (hidden from user's Drive UI, private to this app)
- **File name:** `openaccounts.json`
- **Structure:**

```json
{
  "version": 1,
  "exported_at": "<ISO timestamp>",
  "categories": [...],
  "transactions": [...],
  "transaction_lines": [...],
  "currencies": [...],
  "settings": [...]
}
```

### 10.2 Sync engine

**Trigger:** Manual only — user presses "Sync" on the Profile page.

**Algorithm:**

```
1. PULL   — Download openaccounts.json from Drive appData (skip if file doesn't exist)
2. MERGE  — For each record across all stores:
              Both local and remote exist → keep the one with the later updated_at
              Local only → keep
              Remote only → add locally
3. PUSH   — Upload merged result as the new openaccounts.json
4. APPLY  — Write merged data to IndexedDB
5. UPDATE — settings.last_synced_at = now; syncStore.lastSynced = now
```

**Deletion handling:** Hard-deleted records are absent locally. If a record exists remotely with an older `updated_at` than `last_synced_at`, the deletion wins — the record is not restored. Track `last_synced_at` in the `settings` store.

---

## 11. Export & Import

### 11.1 Export

- Trigger: "Export Data" on Profile page
- Output: `.json` file downloaded to the user's device
- Contents: same structure as the Drive sync file (§10.1), `exported_at` = now
- File name: `openaccounts_export_YYYYMMDD.json`

### 11.2 Import (Session E)

- Trigger: "Import Data" on Profile page — file input accepting `.json`
- `utils/import.js` validates the file structure (checks for required top-level keys and `version` field) before proceeding
- On valid file: runs the same merge algorithm as the sync engine (§10.2), treating the imported file as the "remote" source
- On invalid file: shows an error toast; does not touch IndexedDB
- On success: shows a success toast with record counts

---

## 12. First-run Seeding

On first launch (`settings.onboarding_complete` is absent or false):

1. Create IndexedDB schema version 1.
2. Insert the 22 base categories from §6 (parents before children; resolve parent references by name).
3. Insert default currency: `{ code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', is_default: true }`.
4. Set `settings.onboarding_complete = true`.
5. Set `settings.theme = 'light'`.

---

## 13. Build Status

### Core phases (all complete)

| Phase | Scope | Status |
|---|---|---|
| 1 | Vite + React + Tailwind scaffold, AppShell, responsive nav, 5 placeholder pages | ✅ Complete |
| 2 | IndexedDB layer, all 5 stores, CRUD, first-run seeding, Zustand stores | ✅ Complete |
| 3 | Categories page, CoA list, New/Edit modal, delete validation, opening balance logic | ✅ Complete |
| 4 | Transaction Entry Form, From/To rows, per-currency validation, save to IndexedDB | ✅ Complete |
| 5 | Ledger page, table, filter bar, pagination (PAGE_SIZE=20), edit modal, hard delete | ✅ Complete |
| 6 | Home page metrics + last 5 transactions, useMetrics hook, useBalance hook | ✅ Complete |
| 7 | Profile page, currency management, export data | ✅ Complete |
| 8 | Google Sign-In via GIS token client, token storage, two-check refresh logic, auth state | ✅ Complete |
| 9 | Google Drive sync engine (pull → merge → push), sync UI on Profile | ✅ Complete |

---

## 14. Pending Feature Sessions

### Session A — Visual foundation
**Scope:** `src/constants/accountColors.js`, `tailwind.config.js`, `index.css`, category badge components, Ledger row, category dropdown, Categories page group headers, TransactionForm balance indicator.

**Work:**
- Define `accountColors.js` with the colour token map from §8.3
- Register `font-numeric` in `tailwind.config.js` (§8.1); apply `font-numeric` class to all amount, balance, and date elements app-wide
- Apply account type colour classes to category badges, dropdown options, ledger row tints, and category group headers
- Add zero-balance success state to the per-currency balance indicator: when difference = 0, animate to green (pulse or checkmark transition)

**Do not touch:** Any store, DB, or routing logic.

**Acceptance criteria:**
- All numeric values render in `Geist Mono` / `Roboto Mono`
- Colour badges are consistent across Categories page, Ledger, and transaction form dropdowns
- Balance indicator animates green when per-currency difference hits zero
- Light and dark mode both look correct for all colour additions

---

### Session B — Transaction form enhancements
**Scope:** `src/utils/math.js` (new), `src/components/forms/TransactionForm.jsx`, `src/store/categoryStore.js`, `src/components/forms/CategoryForm.jsx`.

**Work:**

*Amount expression evaluation:*
- Create `utils/math.js` with a safe arithmetic expression parser (supports `+`, `−`, `*`, `/`, parentheses; no `eval`)
- Wire to amount inputs in `TransactionForm` via `onBlur`: if the value is a valid expression, replace with the evaluated result; otherwise leave unchanged

*Keyboard shortcuts:*
- `Tab` — natural field order through date → description → From rows → To rows → notes → save
- `Enter` on the last amount field of any row — appends a new row in the same section
- `Cmd+S` / `Ctrl+S` — submits a valid form (same as clicking Save)

*Inline category creation:*
- When the user types in a category dropdown and no match exists, show a *"Create '[typed name]'"* option at the bottom of the list
- Selecting it opens a minimal modal: Name (pre-filled, editable) + Account Type (required dropdown, no default)
- A caption in the modal: *"Manage all categories on the Categories page."*
- On save: create category via `categoryStore`, close modal, auto-select the new category in the form row
- Opening Balance Equity must never appear in the form's category dropdown (filter `is_system: true`)

**Do not touch:** Ledger, Categories page, Profile page, any DB or sync logic.

**Acceptance criteria:**
- `100/4` evaluates to `25` on blur; `50+30` evaluates to `80`; non-expression values are unchanged
- `Cmd+S` saves a valid form; does nothing on an invalid form
- `Enter` on last amount row adds a new row
- Typing an unknown category name shows the create option; created category is immediately selectable
- `is_system` categories do not appear in any category dropdown

---

### Session C — Toast notification system
**Scope:** `src/components/ui/Toast.jsx` (new), `src/components/ui/ToastContainer.jsx` (new), `src/store/toastStore.js` (new), plus wiring calls added to existing stores and components.

**Work:**

*Infrastructure:*
- `toastStore.js`: Zustand store with a queue of `{ id, message, type, duration }`. Actions: `addToast`, `removeToast`. Types: `success`, `error`, `info`.
- `Toast.jsx`: Single toast component with icon, message, auto-dismiss timer.
- `ToastContainer.jsx`: Renders the active queue, positioned bottom-right (desktop) / bottom-center (mobile). Mount in `App.jsx`.

*Undo toast (transaction save only):*
- After saving a transaction, the success toast reads: *"Transaction saved — Undo."* with an Undo link.
- Add `lastSavedTransaction: null` to `transactionStore`. Store the full transaction + lines payload on save.
- Clicking Undo: hard-delete the saved transaction, restore the form with pre-save data, dismiss the toast.
- After 5 seconds: toast auto-dismisses, clear `lastSavedTransaction`.

*Wire to all state and auth events:*

| Event | Toast type | Message |
|---|---|---|
| Transaction saved | success | "Transaction saved — Undo." (with undo action) |
| Transaction updated | success | "Transaction updated." |
| Transaction deleted | success | "Transaction deleted." |
| Category created | success | "Category created." |
| Category updated | success | "Category saved." |
| Category delete blocked | error | "Cannot delete: [reason]." |
| Currency added | success | "Currency added." |
| Currency removed | success | "Currency removed." |
| Sign-in success | success | "Signed in as [email]." |
| Sign-out | info | "Signed out." |
| Sync started | info | "Syncing…" |
| Sync complete | success | "Sync complete." |
| Sync failed | error | "Sync failed. Try again." |
| Export triggered | success | "Export downloaded." |
| Import success (Session E) | success | "Import complete. [N] records merged." |
| Import failed (Session E) | error | "Import failed: invalid file." |

**Do not touch:** Any DB schema, routing, or sync logic.

**Acceptance criteria:**
- Every listed event produces the correct toast
- Multiple toasts stack without overlapping
- Undo correctly reverses the last saved transaction and restores form state
- Toasts auto-dismiss after their duration

---

### Session D — Ledger enhancements
**Scope:** `src/pages/Ledger.jsx`, `src/components/tables/LedgerTable.jsx`, `src/utils/accounting.js`.

**Work:**

*Quick date filter chips:*
- Add a chip row above the existing filter bar: `Today` · `This Week` · `This Month` · `Last Month` · `This Year`
- Each chip sets the date range filter state (from/to) instantly; active chip is highlighted
- Selecting a chip overrides any manually set date range; manually editing the date pickers deselects the active chip

*Running balance column:*
- Add a `Balance` column to the Ledger table
- Column is only visible when **exactly one category** is selected in the category filter
- Rows are sorted oldest→newest for balance computation; displayed order (newest first) is maintained — the balance value corresponds to the running total up to and including that row
- Uses the normal balance side from §5.3 to determine sign
- Displayed in `font-numeric`; currency prefix shown
- Column header shows the category name

**Do not touch:** Filter logic beyond date range, pagination logic, any store or DB layer.

**Acceptance criteria:**
- Each chip correctly sets the date range and immediately filters results
- Manually editing dates deselects the chip
- Balance column appears only with exactly one category filter active
- Running balance values are mathematically correct (manually verified against known transactions)
- Column is absent for zero or multiple category filters

---

### Session E — Import from JSON
**Scope:** `src/utils/import.js` (new), `src/pages/Profile.jsx`.

**Work:**
- Add "Import Data" button to the Data & Sync section of the Profile page, next to Export
- File input accepts `.json` only
- `utils/import.js`:
  - Validates the file has required top-level keys: `version`, `categories`, `transactions`, `transaction_lines`, `currencies`, `settings`
  - On invalid structure: throws a descriptive error (caught and shown as error toast via Session C infrastructure)
  - On valid file: runs the sync engine merge algorithm (§10.2) with the file contents as the "remote" source
  - Returns a record count summary `{ merged: N, added: N, skipped: N }` for the success toast
- On success: show success toast, reload all Zustand stores from IndexedDB
- On failure: show error toast, make no changes to IndexedDB

**Do not touch:** Sync engine internals, auth, Drive logic.

**Acceptance criteria:**
- A valid export file imports and merges correctly (last-write-wins per record)
- A malformed file shows an error toast and leaves IndexedDB unchanged
- Success toast reports accurate record counts
- All Zustand stores reflect the imported data immediately after import

---

### Session F — Publish to Vercel
**Scope:** Project root (`vercel.json`, `.env.example`, `vite.config.js` if needed).

**Work:**

*Environment variable:*
- GIS Client ID must be in a Vite env variable: `VITE_GOOGLE_CLIENT_ID`
- Replace any hardcoded client ID in `googleAuth.js` with `import.meta.env.VITE_GOOGLE_CLIENT_ID`
- Create `.env.example`:
  ```
  VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id-here
  ```

*SPA routing config:*
- Create `vercel.json` in project root:
  ```json
  {
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
  }
  ```

*Build verification:*
- Run `vite build` locally and confirm `dist/` output is clean with no errors
- Confirm `index.html` in `dist/` loads the app correctly when served statically

*Vercel deployment steps (documented, not automated):*
1. Push repo to GitHub
2. Connect repo to Vercel (import project)
3. Set `VITE_GOOGLE_CLIENT_ID` in Vercel project environment variables
4. Build command: `npm run build` | Output directory: `dist`
5. In Google Cloud Console → OAuth 2.0 Client → Authorized JavaScript Origins: add the Vercel deployment URL (e.g. `https://openaccounts.vercel.app`)
6. Deploy

**Acceptance criteria:**
- `vite build` runs with no errors
- App loads correctly on the Vercel preview URL
- Google Sign-In works on the deployed URL (authorised origin confirmed in GCP console)
- No hardcoded client IDs remain in source code

---

## 15. Open Items (Deferred — Do Not Implement)

- Currency conversion + Forex Gain/Loss tracking (form will show exchange rate; difference absorbed by a Forex Gain/Loss category)
- Statement ingestion (PDF/CSV bank statement parsing)
- Email ingestion (Gmail API)
- Analytics page (charts, spending trends, cashflow)
- Investment current-value tracking
- Multi-user / shared access

---

*Last updated: v2.0 — Reflects completed Phases 1–9. Feature Sessions A–F are pending. Data model unchanged from v1.0.*
