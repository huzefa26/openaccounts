# OpenAccounts — Project Specification
> **Version:** 1.0 | **Status:** Active  
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
| Auth | Google OAuth 2.0 PKCE flow (no third-party auth libraries) |
| Cloud sync | Google Drive REST API — `drive.appData` scope |
| Deployment | localhost (Vercel-ready, no config needed) |

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
│   ├── index.js             # idb database initialisation + upgrade logic
│   ├── categories.js        # IndexedDB CRUD for categories store
│   ├── transactions.js      # IndexedDB CRUD for transactions store
│   ├── transactionLines.js  # IndexedDB CRUD for transaction_lines store
│   ├── currencies.js        # IndexedDB CRUD for currencies store
│   └── settings.js          # IndexedDB CRUD for settings store
├── sync/
│   ├── googleAuth.js        # OAuth 2.0 PKCE: login, token storage, refresh
│   ├── googleDrive.js       # Drive REST API: read/write openaccounts.json in appData
│   └── syncEngine.js        # Pull → merge (last-write-wins by updated_at) → push
├── store/
│   ├── categoryStore.js     # Zustand: categories + balance computations
│   ├── transactionStore.js  # Zustand: transactions + lines CRUD
│   ├── currencyStore.js     # Zustand: currencies list + default
│   ├── settingsStore.js     # Zustand: app-wide settings
│   ├── authStore.js         # Zustand: Google auth state
│   └── syncStore.js         # Zustand: sync state (in-progress, last-synced, error)
├── hooks/
│   ├── useBalance.js        # Compute net balance for a category (multi-currency aware)
│   └── useMetrics.js        # Compute home page metrics
├── utils/
│   ├── accounting.js        # Per-currency debit=credit validation, balance formulas
│   ├── export.js            # Full JSON dump of all IndexedDB stores
│   └── uuid.js              # crypto.randomUUID() wrapper
├── constants/
│   ├── baseCoa.js           # The 21 base Chart of Accounts entries (see Section 6)
│   └── baseCurrencies.js    # Common currency list with codes, names, symbols
├── App.jsx                  # Router setup
└── main.jsx                 # Vite entry point
```

---

## 4. Data Model (IndexedDB)

Database name: `openaccounts_db`  
Current schema version: `1`

All records use ISO 8601 strings for timestamps (`created_at`, `updated_at`). All IDs are UUIDs generated via `crypto.randomUUID()`.

---

### 4.1 `categories` store

| Field | Type | Notes |
|---|---|---|
| `id` | string (UUID) | Primary key |
| `name` | string | Required. E.g. "Cash", "Groceries", "John Doe" |
| `type` | string | Enum: `"asset"` `"liability"` `"income"` `"expense"` `"equity"` |
| `parent_id` | string \| null | UUID of parent category. null = root category |
| `description` | string | Optional |
| `opening_balance` | number | Default: 0. Currency-agnostic — see rules in §5.2 |
| `is_system` | boolean | True only for "Opening Balance Equity". Cannot be edited or deleted |
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
| `onboarding_complete` | boolean | Whether first-run setup is done |

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

## 6. Base Chart of Accounts

Seeded on first run. These are created with `is_system: false` so the user can edit them (except Opening Balance Equity which is separate and system-locked).

```json
[
  { "name": "Cash",                  "type": "asset",     "parent": null },
  { "name": "Bank Account",          "type": "asset",     "parent": null },
  { "name": "Wallets",               "type": "asset",     "parent": null },
  { "name": "Accounts Receivable",   "type": "asset",     "parent": null },
  { "name": "Fixed Assets",          "type": "asset",     "parent": null },
  { "name": "Investments",           "type": "asset",     "parent": null },
  { "name": "Credit Card",           "type": "liability", "parent": null },
  { "name": "Loans",                 "type": "liability", "parent": null },
  { "name": "Accounts Payable",      "type": "liability", "parent": null },
  { "name": "Income",                "type": "income",    "parent": null },
  { "name": "Interest Income",       "type": "income",    "parent": null },
  { "name": "General Expenses",      "type": "expense",   "parent": null },
  { "name": "Food & Dining",         "type": "expense",   "parent": null },
  { "name": "Groceries",             "type": "expense",   "parent": "Food & Dining" },
  { "name": "Dining Out",            "type": "expense",   "parent": "Food & Dining" },
  { "name": "Transportation",        "type": "expense",   "parent": null },
  { "name": "Utilities",             "type": "expense",   "parent": null },
  { "name": "Rent",                  "type": "expense",   "parent": "Utilities" },
  { "name": "Entertainment",         "type": "expense",   "parent": null },
  { "name": "Apparel & Cosmetics",   "type": "expense",   "parent": null },
  { "name": "Healthcare",            "type": "expense",   "parent": null },
  { "name": "Opening Balance Equity","type": "equity",    "parent": null, "is_system": true }
]
```

Parent references are resolved by name during seeding (insert parents first, then children).

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

**Metrics strip** — 3 cards:
- *Total Expenses This Month:* Sum of all debit amounts on `expense`-type transaction lines for the current calendar month, grouped by currency. Show per-currency if multiple.
- *Total Receivables:* Net running balance of the `Accounts Receivable` category and all its descendants. Per-currency.
- *Total Payables:* Net running balance of the `Accounts Payable` category and all its descendants. Per-currency.

**Recent transactions** — last 5 transactions ordered by `date` desc, then `created_at` desc.  
Each row shows: Date · Description · Per-currency total amounts (debit side).

**Transaction Entry Form:**

| Field | Type | Rules |
|---|---|---|
| Date | Date picker | Default: today (`YYYY-MM-DD`) |
| Description | Text input | Required |
| From (credits) | Dynamic rows | Min 1 row. Each row: [Category dropdown, Currency dropdown, Amount number input]. Add row / delete row (cannot delete last row) |
| To (debits) | Dynamic rows | Same as From |
| Notes | Textarea | Optional |
| Save | Button | Disabled until per-currency invariant is met |

Below From and To sections: a real-time per-currency balance indicator showing difference (e.g. "AED: 0.00 ✓" or "AED: −50.00").

On Save: write transaction + all lines to IndexedDB. Reset form (keep today's date, clear all other fields, reset to 1 row each side).

---

### 7.3 Ledger page (`/ledger`)

**Filter bar (collapsible on mobile):**
- Date range (from / to date pickers)
- Category (multi-select dropdown from categories list)
- Account Type (multi-select: Asset, Liability, Income, Expense, Equity)
- Currency (multi-select from user's currencies)
- Amount range (min / max number inputs)
- Description (free text search — matches substring, case-insensitive)

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
| Name | Bold for root categories; indented + lighter for children |
| Opening Balance | Display value. Blank if 0 |
| Net Balance | Per-currency running balance (§5.3). Blank/dash for categories where it is not meaningful (e.g. Expense leaf nodes) |
| Edit | Icon button — opens Category Form |
| Delete | Icon button — triggers deletion rules (§5.4) |

**Category Form (modal):**

| Field | Rules |
|---|---|
| Name | Required |
| Account Type | Dropdown: Asset / Liability / Income / Expense / Equity. Required |
| Parent Category | Dropdown: categories of the same type only. Optional. "None (root)" option |
| Description | Optional textarea |
| Opening Balance | Number input. Default 0. On save, triggers system transaction logic (§5.2) |

On save of a new category with `opening_balance > 0`: run opening balance logic (§5.2).  
On edit where `opening_balance` changed: re-run opening balance logic (§5.2).

---

### 7.5 Profile page (`/profile`)

**Sections:**

**Account**
- Google profile photo + display name + email
- Logout button (clears auth tokens, redirects to sign-in)

**Home Currency**
- Display current default currency
- "Change" opens a dropdown to select from the user's active currencies

**Currencies**
- List of active currencies (code + name + symbol)
- "Add Currency" — opens a searchable dropdown of all currencies (from `baseCurrencies.js`)
- Delete icon per row (cannot delete the default currency; show tooltip)

**Data & Sync**
- "Sync with Google Drive" button — triggers sync engine (§8)
- Last synced timestamp (from `syncStore`)
- Sync status indicator (idle / syncing / error)
- "Export Data" button — triggers full JSON export (§5.6)

---

### 7.6 Analytics page (`/analytics`)

Placeholder only. Display: "Analytics coming soon." No logic to implement.

---

## 8. Google Auth & Drive Sync

### 8.1 Authentication

**Flow:** OAuth 2.0 PKCE (no client secret, runs entirely in the browser).

**OAuth scopes requested:**
```
openid
email
profile
https://www.googleapis.com/auth/drive.appdata
```

**Token storage:** Access token and refresh token stored in `localStorage`. Keys: `oa_access_token`, `oa_refresh_token`, `oa_token_expiry`.

**Token refresh:** Before any Drive API call, check if `oa_token_expiry` is within 5 minutes. If so, refresh using the refresh token endpoint before proceeding.

**Sign-in gate:** The app is fully usable without signing in (all local features work). Google Sign-In is required only to use the Drive sync feature. The Sign-In button is on the Profile page. If not signed in, the Sync section on Profile shows "Sign in to enable sync."

### 8.2 Drive file

- **Location:** Google Drive `appDataFolder` (hidden from user's Drive UI, private to this app)
- **File name:** `openaccounts.json`
- **Contents:** A single JSON object containing a snapshot of all five IndexedDB stores:

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

### 8.3 Sync engine

**Trigger:** Manual only — user presses "Sync" on Profile page.

**Algorithm:**

```
1. PULL  — Download openaccounts.json from Drive (if it exists)
2. MERGE — For each record in all stores:
             if record exists in both local and remote:
               keep the one with the later `updated_at`
             if record exists only in local: keep it
             if record exists only in remote: add it locally
3. PUSH  — Upload the merged result as the new openaccounts.json to Drive
4. APPLY — Write merged data back to IndexedDB
5. UPDATE syncStore.lastSynced to now
```

Hard-deleted records are gone locally. If a record was deleted locally but still exists remotely (older `updated_at`), the local deletion wins because the remote record's `updated_at` is older than the last sync timestamp. Track last sync timestamp in `settings` store under key `last_synced_at`.

---

## 9. Export

**Trigger:** "Export Data" button on Profile page.

**Output:** A `.json` file downloaded to the user's device.

**Contents:** Same structure as the Drive sync file (§8.2), with `exported_at` set to now.

**File name:** `openaccounts_export_YYYYMMDD.json`

---

## 10. First-run Seeding

On first launch (when `openaccounts_db` does not exist or `settings.onboarding_complete` is false):

1. Create IndexedDB with schema version 1.
2. Insert the 22 base categories (21 from §6 + Opening Balance Equity).
3. Insert the default currency: `{ code: "AED", name: "UAE Dirham", symbol: "د.إ", is_default: true }`.
4. Set `settings.onboarding_complete = true`.

---

## 11. Build Phases (Session Plan)

Each session is a vertical slice. Declare scope at the start, update this file at the end.

| Phase | Scope | Acceptance criteria |
|---|---|---|
| **1** | Vite + React + Tailwind + React Router scaffold. Folder structure. AppShell with responsive Navbar (desktop) + BottomNav (mobile). 5 placeholder pages. | App loads, nav works on mobile and desktop, no errors |
| **2** | IndexedDB layer (`db/` folder). All 5 stores with schema. CRUD functions. First-run seeding. All 5 Zustand stores wired to IndexedDB. | Stores seed correctly on first run; CRUD verified in browser DevTools |
| **3** | Categories page. Grouped list view. New/Edit category form modal. Delete with validation. Opening balance system transaction logic. | Can create, edit, delete categories; OB transaction appears in IndexedDB |
| **4** | Transaction Entry Form (Home page). From/To dynamic rows. Per-currency balance indicator. Validation. Save to IndexedDB. | Can record a multi-line transaction; debit=credit enforced per currency |
| **5** | Ledger page. Table with all columns. Filter bar. Edit transaction (modal, pre-filled). Hard delete with confirmation. | Transactions appear; filters work; edit and delete function correctly |
| **6** | Home page metrics + recent transactions list. `useMetrics` hook. `useBalance` hook. | Correct totals shown; recent 5 transactions listed |
| **7** | Profile page (static sections). Currency management (add/remove/set default). Export data. | Can add/remove currencies; export downloads correct JSON |
| **8** | Google Sign-In (OAuth 2.0 PKCE). Token storage and refresh. Auth state in `authStore`. Sign-in/out flow. | Sign-in works; tokens stored; sign-out clears state |
| **9** | Google Drive sync engine. Pull → merge → push. Sync UI on Profile page (button, status, last synced). | Sync creates/updates `openaccounts.json` in Drive appData; merge logic correct |

---

## 12. Open Items (Deferred — Do Not Implement Yet)

- Currency conversion + Forex Gain/Loss tracking
- Statement ingestion (PDF/CSV parsing)
- Email ingestion (Gmail API)
- Analytics page (charts and stats)
- Investment current-value tracking
- Multi-user / shared access

---

*Last updated: initial spec — Phase 0 complete. No code written yet.*
