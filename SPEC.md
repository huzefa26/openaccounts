# OpenAccounts — Project Specification
> **Version:** 1.1 | **Status:** Active
> This file is the single source of truth for all agent sessions. Read it in full before every session. Update it at the end of every session to reflect decisions made and work completed.

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
| Deployment | Vercel (SPA config) |

### What the agent must NEVER do
- No backend, no server-side code, no API routes
- No Firebase, Auth0, Supabase, or any third-party auth/database service
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
│   ├── ui/                  # Reusable primitives: Button, Input, Modal, Badge, etc.
│   ├── layout/              # AppShell, Navbar (desktop), BottomNav (mobile)
│   ├── forms/               # TransactionForm, CategoryForm
│   └── tables/              # LedgerTable, CategoryTable
├── pages/
│   ├── Home.jsx
│   ├── Ledger.jsx
│   ├── Analytics.jsx        # Placeholder only (future feature)
│   ├── Categories.jsx
│   └── Profile.jsx
├── db/
│   ├── index.js             # idb initialisation + upgrade logic
│   ├── categories.js        # IndexedDB CRUD for categories store
│   ├── transactions.js      # IndexedDB CRUD for transactions store
│   ├── transactionLines.js  # IndexedDB CRUD for transaction_lines store
│   ├── currencies.js        # IndexedDB CRUD for currencies store
│   └── settings.js          # IndexedDB CRUD for settings store
├── sync/
│   ├── googleAuth.js        # GIS token client: init, sign-in, sign-out, token checks
│   ├── googleDrive.js       # Drive REST API: read/write openaccounts.json in appData
│   └── syncEngine.js        # Pull → merge (last-write-wins by updated_at) → push
├── store/
│   ├── categoryStore.js     # Zustand: categories
│   ├── transactionStore.js  # Zustand: transactions + lines CRUD
│   ├── currencyStore.js     # Zustand: currencies list + default
│   ├── settingsStore.js     # Zustand: app-wide settings
│   ├── authStore.js         # Zustand: GIS auth state
│   └── syncStore.js         # Zustand: sync state (in-progress, last-synced, error), timestamp
├── hooks/
│   ├── useBalance.js        # Net running balance for a category (multi-currency aware)
│   └── useMetrics.js        # Home page metrics computations
├── utils/
│   ├── accounting.js        # Per-currency debit=credit validation, balance formulas
│   ├── export.js            # Full JSON dump of all IndexedDB stores
│   └── uuid.js              # crypto.randomUUID() wrapper
├── constants/
│   ├── baseCoa.js           # The 22 base Chart of Accounts entries (see Section 6)
│   └── baseCurrencies.js    # Common currency list with codes, names, symbols
├── App.jsx                  # Router setup
└── main.jsx                 # Vite entry point
```

---

## 4. Data Model (IndexedDB)

Database name: `openaccounts_db`
Current schema version: `2`

All records use ISO 8601 strings for timestamps (`created_at`, `updated_at`). All IDs are UUIDs generated via `crypto.randomUUID()`.

---

### 4.1 `categories` store

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key. Format: `base_${slug}` for base CoA entries (e.g. `base_cash`, `base_food_dining`, `base_opening_balance_equity`). `crypto.randomUUID()` for all user-created categories |
| `name` | string | Required. **Must be unique across all categories (case-insensitive).** Enforced at the DB layer before any `add()` or `put()` — reject with an error if a record with the same name already exists |
| `type` | string | Enum: `asset` `liability` `income` `expense` `equity` |
| `parent_id` | string \| null | UUID or slug of parent category. null = root |
| `description` | string | Optional |
| `opening_balance` | number | Default: 0. Currency-agnostic — see rules in §5.2 |
| `is_system` | boolean | True only for "Opening Balance Equity". Hidden from the user. Cannot be edited or deleted |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

**Index:** `type` (for grouped views)

---

### 4.2 `transactions` store

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `date` | string | Format: `YYYY-MM-DD` |
| `description` | string | Required |
| `notes` | string | Optional |
| `is_opening_balance` | boolean | True for system-generated opening balance transactions |
| `opening_balance_category_id` | string \| null | Set when `is_opening_balance` is true. Links to the category whose OB this represents |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

---

### 4.3 `transaction_lines` store

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `transaction_id` | string (UUID) | Foreign key → transactions |
| `category_id` | string (UUID) | Foreign key → categories |
| `entry_type` | string | Enum: `"debit"` \| `"credit"` |
| `currency` | string | Currency code, e.g. `"AED"`, `"USD"` |
| `amount` | number | Always positive |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

**Index:** `transaction_id` (for fetching all lines of a transaction)

---

### 4.4 `currencies` store

| Field | Type | Notes |
|---|---|---|
| `code` | string | Primary key. ISO 4217 code, e.g. `"AED"` |
| `name` | string | E.g. `"UAE Dirham"` |
| `symbol` | string | E.g. `"د.إ"` |
| `is_default` | boolean | Exactly one currency must have this as true at all times |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

---

### 4.5 `settings` store

| Field | Type | Notes |
|---|---|---|
| `key` | string | Primary key |
| `value` | string | JSON-serialised value |
| `updated_at` | string | ISO timestamp |

**Reserved keys:**

| Key | Value type | Description |
|---|---|---|
| `app_version` | string | Current DB schema version |
| `last_synced_at` | string | ISO timestamp of last successful Drive sync |
| `theme` | string | `light` \| `dark`. Mirrors `localStorage.oa_theme` |
| `duplicate_cleanup_complete` | boolean | True once the one-time duplicate categories cleanup migration has run. See §11 |

---

## 5. Business Logic Rules

### 5.1 Double-entry invariant (per-currency)
Every transaction must satisfy: for each currency present in the transaction's lines, the sum of credit amounts must equal the sum of debit amounts.

```
For each currency C in transaction.lines:
  SUM(amount where entry_type = "credit" AND currency = C)
  === SUM(amount where entry_type = "debit" AND currency = C)
```

The Save button is disabled until this condition is met for all currencies. A visible per-currency balance indicator shows the running difference as the user fills the form.

**Future (not in scope now):** When currency conversion is added, a "Forex Gain/Loss" category will absorb the rounding/conversion difference. The form will show the exchange rate used.

---

### 5.2 Opening balances

When a user sets (or modifies) an opening balance on a category:

1. Check if a transaction exists with `is_opening_balance = true` AND `opening_balance_category_id = category.id`.
2. If it exists: delete its lines and re-create them with the new amount.
3. If it does not exist: create a new transaction.
4. If the new opening balance is 0: delete the transaction entirely.

**Transaction generated:**

The opening balance transaction uses the **home/default currency** at the time it is created.

| Account type | Debit | Credit |
|---|---|---|
| Asset | The category itself | Opening Balance Equity |
| Liability | Opening Balance Equity | The category itself |
| Equity | Opening Balance Equity | The category itself |
| Income | Opening Balance Equity | The category itself |
| Expense | The category itself | Opening Balance Equity |

**"Opening Balance Equity"** is a system category (`is_system: true`, type: `equity`). It is created automatically on first run. It cannot be edited, deleted, or used manually in the transaction form.

---

### 5.3 Net running balance formula

Used on the Categories page and in `useBalance.js`. Results are grouped by currency because no conversion rates exist.

```
Normal balance side per type:
  asset    → debit  (increases with debits)
  expense  → debit
  liability → credit (increases with credits)
  equity   → credit
  income   → credit

For each currency C:
  if normal_side = "debit":
    balance[C] = opening_balance (home currency only) + SUM(debits in C) - SUM(credits in C)
  if normal_side = "credit":
    balance[C] = opening_balance (home currency only) + SUM(credits in C) - SUM(debits in C)
```

Note: `opening_balance` is recorded in the home currency. For multi-currency accounts, the opening balance applies only to the home currency bucket.

---

### 5.4 Category deletion rules

- A category with `is_system: true` cannot be deleted.
- A category that has transaction lines referencing it cannot be deleted. Show an error: "This category has recorded transactions. Remove them first or reassign them."
- A category that has child categories cannot be deleted. Show an error: "This category has sub-categories. Delete or reassign them first."

---

### 5.5 Transaction form — "From" and "To" semantics

In the UI, "From" maps to **credits** and "To" maps to **debits**.

Example: Paying for groceries from a bank account.
- From (credit): Bank Account — 100 AED (money leaves the bank → credit the asset)
- To (debit): Groceries — 100 AED (expense incurred → debit the expense)

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

Seeded on first run. Insert parents before children.
Parent references are resolved by name during seeding.
`description` default to empty string.
`opening_balance` default to 0.
`parent` defaults to null.
`is_system` defaults to false.

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
| `< md` (mobile) | Fixed bottom navigation bar with 5 icon + label tabs |
| `>= md` (desktop) | Top horizontal navbar with 5 links |

**Nav items (in order):** Home · Ledger · Analytics · Categories · Profile

Active route is highlighted. No nested routing.

---

### 7.2 Home page (`/`)

**Layout (top to bottom):**

**Transaction Entry Form:**

| Field | Type | Rules |
|---|---|---|
| Date | Date picker | Default: today (`YYYY-MM-DD`) |
| Description | Text input | Required |
| From (credits) | Dynamic rows | Min 1 row. Each row: Category dropdown, Currency dropdown (default: home currency), Amount input. Add row button. Delete row button (disabled when only 1 row remains) |
| To (debits) | Dynamic rows | Same structure as From |
| Notes | Textarea | Optional |
| Save | Button | Disabled until per-currency invariant is met |

Below From and To sections: a real-time per-currency balance indicator showing difference (e.g. "AED: 0.00 ✓" or "AED: −50.00").

On Save: write transaction + all lines to IndexedDB. Update Zustand stores. Reset form (today's date, cleared fields, 1 row each side).

**Metrics strip** — 3 cards:
- *Total Expenses This Month:* Sum of all debit amounts on `expense`-type transaction lines for the current calendar month, grouped by currency. Show per-currency if multiple.
- *Total Receivables:* Net running balance of the `Accounts Receivable` category and all its descendants. Per-currency.
- *Total Payables:* Net running balance of the `Accounts Payable` category and all its descendants. Per-currency.

**Recent transactions** — last 5 transactions ordered by `date` desc, then `created_at` desc.
Each row shows: Date · Description · Per-currency total amounts (debit side).

---

### 7.3 Ledger page (`/ledger`)

**Filter bar (collapsible on mobile):**

| Filter | Type |
|---|---|
| Date range | From / To date pickers |
| Category | Multi-select dropdown |
| Account Type | Multi-select: Asset / Liability / Income / Expense / Equity |
| Currency | Multi-select from user's active currencies |
| Amount range | Min / Max number inputs |
| Description | Free-text substring search (case-insensitive) |

**Table columns:**

| Column | Notes |
|---|---|
| Date | `YYYY-MM-DD` |
| Description | |
| Notes | Truncated; expand on hover/tap |
| From | Sub-columns: Category · Currency · Amount (all credit lines) |
| To | Sub-columns: Category · Currency · Amount (all debit lines) |
| Actions | Edit icon · Delete icon |

Multi-line transactions display stacked rows in From/To cells (one sub-row per line).

**Edit:** Opens the Transaction Form (same as Home page) in a modal or slide-over panel, pre-filled with the transaction's existing data. On save: update transaction + delete old lines + insert new lines (update `updated_at` on transaction).

**Delete:** Hard delete with a confirmation dialog: *"Delete this transaction? This cannot be undone."* Deletes transaction record and all its lines.

---

### 7.4 Categories page (`/categories`)

**Header:** "Categories" title + "New Category" button (top right).

**List layout:** Grouped by `type` (section header per type in order: Asset → Liability → Income → Expense → Equity). Within each type, root categories are listed; their children are indented beneath them.

**Each row:**

| Column | Notes |
|---|---|
| Name | Required. Must be unique across all categories (case-insensitive). If a duplicate name is detected on save, show an inline error: *"A category with this name already exists."* Do not submit |
| Opening Balance | Displayed if non-zero |
| Net Balance | Per-currency running balance (§5.3). Shown as a currency-keyed list. Dash for leaf expense/income categories where lifetime totals are not meaningful |
| Edit | Icon button → Category Form |
| Delete | Icon button → deletion rules (§5.4) |

**Category Form (modal):**

| Field | Rules |
|---|---|
| Name | Required |
| Account Type | Dropdown: Asset / Liability / Income / Expense / Equity. Required |
| Parent Category | Dropdown: categories of the same type only. Optional. "None (root)" option |
| Description | Optional textarea |
| Opening Balance | Number input. Default 0. |

On save of a new category with `opening_balance > 0`: run opening balance logic (§5.2).
On edit where `opening_balance` changed: re-run opening balance logic (§5.2).

---

### 7.5 Profile page (`/profile`)

**Sections:**

**Account**
- Google profile photo + display name + email (from GIS user info)
- Logout button — clears auth tokens from localStorage, resets `authStore`, redirects to sign-in state

**Home Currency**
- Display current default currency
- "Change" opens a dropdown to select from the user's active currencies

**Currencies**
- List of active currencies (code + name + symbol)
- "Add Currency" — opens a searchable dropdown of all currencies (from `baseCurrencies.js`)
- Delete icon per row (cannot delete the default currency; show tooltip)

**Data & Sync**
- "Sync with Google Drive" button — triggers sync engine (§9)
- Last synced timestamp (from `syncStore.lastSynced`)
- Sync status indicator: idle / syncing / error
- "Export Data" button — triggers JSON export (§10)

---

### 7.6 Analytics page (`/analytics`)

Placeholder only. Display: "Analytics coming soon." No logic to implement.

---

## 8. Google Auth (GIS)

### 8.1 Library

Google Identity Services loaded via script tag: `https://accounts.google.com/gsi/client`

Flow: **Token client** (`google.accounts.oauth2.initTokenClient`)

**OAuth scopes:**
```
openid
email
profile
https://www.googleapis.com/auth/drive.appdata
```

### 8.2 Sign-in requirement

**Sign-in is mandatory.** The app's unauthenticated entry point is a sign-in screen. No part of the app — no form, no ledger, no categories — is accessible until the user has authenticated with Google. There is no guest or offline mode.

### 8.3 Post sign-in initialisation

Immediately after a successful sign-in, before rendering the app:

```
Check Drive for openaccounts.json
  → File exists:  pull from Drive → populate IndexedDB → render app
  → File absent:  seed base CoA (§11) → push to Drive → render app
```

A loading screen is shown during this check. If the Drive call times out after 8 seconds, show an error state: *"Couldn't reach Google Drive. Please check your connection and try again."* Do not fall back to local data silently — Drive is the source of truth.

### 8.4 Token storage

| localStorage key | Content |
|---|---|
| `oa_access_token` | GIS access token string |
| `oa_token_expiry` | ISO timestamp of token expiry |

No refresh token — GIS token client does not issue refresh tokens.

### 8.5 Token checks

**Strict check** — Run on app load and before any protected Drive action. Verifies the user's Google session is still valid. If the token is expired and silent re-auth fails, return the user to the sign-in screen.

**Early refresh check** — Run when `oa_token_expiry` is within 5 minutes of the current time. Calls `tokenClient.requestAccessToken({ prompt: '' })` silently to obtain a fresh token before any active task breaks.

---

## 9. Google Drive Sync

### 9.1 Drive file

- **Scope:** `drive.appData` (hidden from user's Drive UI, private to this app)
- **File name:** `openaccounts.json`
- **Contents:** A single JSON object containing a snapshot of all five IndexedDB stores:

```json
{
  "version": "<Schema version>",
  "exported_at": "<ISO timestamp>",
  "categories": [...],
  "transactions": [...],
  "transaction_lines": [...],
  "currencies": [...],
  "settings": [...]
}
```

### 9.2 Sync engine

**Trigger:** Manual only — user presses "Sync" on Profile page.

**Algorithm:**

```
1. PULL  — Download openaccounts.json from Drive appData (skip if file doesn't exist)
2. MERGE — For each record in all stores:
             if record exists in both local and remote:
               keep the one with the later `updated_at`
             if record exists only in local: keep it
             if record exists only in remote: add it locally
3. PUSH  — Upload the merged result as the new openaccounts.json to Drive
4. APPLY — Write merged data back to IndexedDB
5. UPDATE syncStore.lastSynced to now
```

**Deletion handling:** Hard-deleted records are absent locally. If a record was deleted locally but still exists remotely with an older `updated_at` timestamp, the local deletion wins and the record is not restored because the remote record's `updated_at` timestamp is older than the last synced `syncStore.lastSynced` timestamp.

---

## 10. Export

- **Trigger:** "Export Data" button on Profile page.
- **Output:** A `.json` file downloaded to the user's device.
- **Contents:** Same structure as the Drive sync file (§9.1), with `exported_at` set to now.
- **File name:** `openaccounts_export_YYYYMMDD.json`

---

## 11. First-run Seeding

### New user (Drive file absent)

Triggered by the post sign-in initialisation check (§8.3) finding no `openaccounts.json` in Drive.

All of the following is executed as a **single atomic IndexedDB transaction**. If the transaction aborts for any reason, nothing is written and the process retries on the next sign-in.

1. Insert the 22 base categories from §6. Base CoA IDs use the `base_${slug}` format. Parents are inserted before children; parent references resolved by name.
2. Insert default currency: `{ code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', is_default: true }`.
3. Set `settings.theme = 'light'`.

After the transaction commits, push the seeded data to Drive immediately.

### Returning user (Drive file present)

Pull from Drive → populate IndexedDB. No seeding runs.

### One-time duplicate cleanup migration (existing users only)

On first app load after this change ships, if `settings.duplicate_cleanup_complete` is absent or false:

1. Scan the `categories` store for records sharing the same `name` (case-insensitive).
2. For each duplicate group: keep the record with the latest `updated_at`, delete all others. Update any `transaction_lines` records whose `category_id` references a deleted duplicate to point to the kept record.
3. Set `settings.duplicate_cleanup_complete = true`.
4. Push the cleaned state to Drive.

This migration runs once and never again.

---

## 12. Build Status

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

## 13. Open Items (Deferred — Do Not Implement Yet)

- Currency conversion + Forex Gain/Loss tracking
- Statement ingestion (PDF/CSV parsing)
- Email ingestion (Gmail API)
- Analytics page (charts and stats)
- Investment current-value tracking
- Multi-user / shared access

---
