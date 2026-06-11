# OpenAccounts — Project Specification
> **Version:** 1.4 | **Status:** Active
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
| cmdk | Searchable combobox primitive |
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
│   ├── ui/                  # Reusable primitives: Button, Input, Modal, Select, MultiSelect, Toast, ToastContainer, CategorySelect.
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
│   ├── syncStore.js         # Zustand: sync state (in-progress, last-synced, error), timestamp
|   └── toastStore.js        # Zustand: toast queue
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
  { name: 'Accounts Receivable',    type: 'asset', description: 'People who owe you money. Create a sub-category for each person.' },
  { name: 'Fixed Assets',           type: 'asset' },
  { name: 'Investments',            type: 'asset' },
  { name: 'Credit Card',            type: 'liability' },
  { name: 'Loans',                  type: 'liability' },
  { name: 'Accounts Payable',       type: 'liability', description: 'People you owe money to. Create a sub-category for each person.' },
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
| `>= md` (desktop) | Top horizontal navbar: brand left, 4 links centered, user avatar right |

**Nav items (in order):** Home · Ledger · Analytics · Categories · Profile (via avatar photo)

Active route is highlighted on text links. No nested routing.

*Mobile sticky top bar:* Full-width bar at the top of every page on `< md`. Left: current page title. Right: sync icon button reflecting live sync state (spinner while syncing, tick on complete, cross on failure, default when idle). Tapping it triggers an immediate sync, bypassing the debounce timer.

*BottomNav scroll behaviour:* Hides on scroll down, restores on scroll up. Transition: `300ms ease` — not instantaneous. Applies on both Android and iOS. iOS: add `padding-bottom: env(safe-area-inset-bottom)` to clear the system home bar.

*Desktop navbar:* Add a sync icon button (circular arrows) to the right section of the navbar, left of the avatar. Clicking it triggers an immediate sync, bypassing the debounce timer.

---

### 7.2 Home page (`/`)

**Layout (top to bottom):**

**Transaction Entry Form:**

| Field | Type | Rules |
|---|---|---|
| Date | Date picker | Default: today (`YYYY-MM-DD`) |
| Description | Text input | Required |
| From (credits) | Dynamic rows | Dynamic rows. Min 1 row. Each row: `CategorySelect` component · Currency dropdown · Amount input. Add row button. Delete row button (disabled when only 1 row remains) |
| To (debits) | Dynamic rows | Same structure as From |
| Notes | Textarea | Optional |
| Save | Button | Disabled until per-currency invariant is met |

**Keyboard shortcuts:**
- `Ctrl+S` — submits a valid form; no-op if invariant not met
- `Enter` on an amount input — appends a new row to the same section, moves focus to the Category field of the new row
- `Tab` — logical field order: Date → Description → From rows (Category → Currency → Amount per row) → To rows → Notes → Save
- `Escape` — closes the `CategorySelect` popover if open; closes any modal if open

Below From and To sections: A per-currency equality indicator. Format: `Credits AED 100.00 = Debits AED 100.00`. One line per currency. Uses `font-numeric` for amounts. Unbalanced state: `≠` sign, red/amber colour. Balanced state: `=` sign, green colour, with a one-time pulse animation and a `≠` → `=` fade-cross transition on each transition to balanced. Hidden entirely when no amounts have been entered.

On Save: write transaction + all lines to IndexedDB. Update Zustand stores. Reset form (today's date, cleared fields, 1 row each side).

**Metrics strip** — 3 cards:
- *Total Expenses This Month:* Sum of all debit amounts on `expense`-type transaction lines for the current calendar month, grouped by currency. Show per-currency if multiple.
- *Total Receivables:* Net running balance of the `Accounts Receivable` category and all its descendants. Per-currency.
- *Total Payables:* Net running balance of the `Accounts Payable` category and all its descendants. Per-currency.

Each metric card: when the value is zero or no data exists, display `—` instead of a blank space.

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

**Mobile Layout (`< md`):** The table is replaced by a card list. Each transaction card shows Date and Description on the first line, From entries (category · currency · amount) stacked below, To entries stacked below those, and Edit/Delete icons in the top-right corner. Filter bar remains collapsible above. Pagination controls remain below.

**Edit:** Opens the Transaction Form (same as Home page) in a modal or slide-over panel, pre-filled with the transaction's existing data. It includes `CategorySelect` and all keyboard shortcuts by inheritance. On save: update transaction + delete old lines + insert new lines (update `updated_at` on transaction).

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

**Mobile Layout (`< md`):** The table is replaced by a card list. Each category card shows Name (bold for roots, indented label for children), Opening Balance if non-zero, Net Balance, and Edit/Delete icons. Account type group headers remain as full-width section dividers.

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
- "Add Currency" button: active press state — `active:scale-95` with `transition-transform`.
- Currency search popup: solid background, visible border, and `shadow-pop` drop shadow to visually separate it from the page behind it.
- Delete icon per row (cannot delete the default currency; show tooltip)

**Data & Sync**
- "Sync with Google Drive" button — triggers sync engine (§9)
- Last synced timestamp (from `syncStore.lastSynced`)
- Sync status indicator: idle / syncing / error
- "Export Data" button — triggers JSON export (§10)

---

### 7.6 Analytics page (`/analytics`)

Placeholder only. Display: "Analytics coming soon." No logic to implement.

### 7.7 Page pre-react-hydrated

Place a CSS spinner inside <div id="root"> in index.html, visible immediately on page load before React hydrates. React's first render replaces it. Style with the app's primary colour.

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

If the user dismisses the Google OAuth prompt or denies permissions, do not proceed with initialisation. Show an error state on the sign-in screen: *"Google permissions are required to use OpenAccounts."* with a *"Try again"* button that re-initiates the OAuth flow.

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

### 9.3 Auto sync

Every write (transaction created/updated/deleted, category created/updated/deleted, currency added/removed) schedules an automatic sync with a 30-second debounce. Each new write resets the timer.

`syncStore` gains two new fields:
- `pendingChangeCount: number` — tracks outstanding unsynced writes. Default `0`.
- `pendingSyncTimer: ReturnType<typeof setTimeout> | null`

Rules:
- **Every write:** increment `pendingChangeCount`, call `schedulePendingSync()` (clears old timer, sets 30-second timeout calling `syncEngine.sync()`).
- **On undo:** decrement `pendingChangeCount` by 1 (floor 0). The undo delete is not a new write — it does not increment the counter and does not call `schedulePendingSync()`. If `pendingChangeCount` reaches `0`: cancel the timer. If `pendingChangeCount > 0`: call `schedulePendingSync()` to reset the 30-second window from now.
- **Manual sync (navbar or Profile page):** cancel timer, set `pendingChangeCount = 0`, call `syncEngine.sync()` immediately.
- **Auto sync fires successfully:** set `pendingChangeCount = 0`, clear timer.
- **Auto sync fails:** do not reset `pendingChangeCount`, do not reschedule. Show error toast. User must retry manually.


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
2. Insert base currencies from the file `src/constants/baseCurrencies.js`.
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
| 10 | Navbar restructure: 3-section layout (logo left, nav centered, avatar right), AvatarWithSync shared component with sync overlays (amber ring/badges), full-width no constraint | ✅ Complete |
| 11 | Monospaced numbers — register `font-numeric` in Tailwind config, apply to all amounts, balances, and dates app-wide | ✅ Complete |
| 12 | `CategorySelect` component — searchable combobox built on `cmdk` following the shadcn Command/Combobox pattern; grouped by type, children indented, auto-focus top match, keyboard navigation; replace all category inputs in `TransactionForm` | ✅ Complete |
| 13 | Transaction form enhancements — keyboard shortcuts (`Ctrl+S`, `Tab`, `Enter`, `Escape`); zero-balance equality indicator with animation | ✅ Complete |
| 14 | Toast notification system — `toastStore`, `Toast`, `ToastContainer`; all event wiring; Undo for transaction save; clear on navigation and sign-out | ✅ Complete |
| 15 | Mobile & UX bug fixes — Ledger and Categories card views on mobile; transaction form row widths (CategorySelect `flex-1`, fixed currency + amount widths); date input full width matching other inputs; BottomNav smooth scroll hide/restore with iOS safe-area; mobile sticky top bar layout shell (consumed by Phase 16 for sync wiring); Profile currencies button press animation and popup elevation; Home metrics dash for empty state; Google permissions denied error state and retry; `index.html` first-load spinner; base CoA descriptions for AR and AP | ⏳ Pending |
| 16 | Auto sync — `syncStore` additions (`pendingChangeCount`, `pendingSyncTimer`, `schedulePendingSync`, `decrementAndMaybeCancel`); wire all DB writes to `schedulePendingSync`; wire undo to `decrementAndMaybeCancel`; manual sync buttons (desktop navbar + mobile top bar) cancel timer and call `syncEngine.sync()` immediately; sync state icon wired to mobile top bar | ⏳ Pending |

---

## 13. Next Phases (planned)

### Phase 11 — Monospaced numbers

**Scope:** `tailwind.config.js`, and a targeted class-addition pass across `src/components/` and `src/pages/`.

**Work:**
Register `font-numeric` in `tailwind.config.js` under `theme.extend.fontFamily`:
```js
numeric: ['Geist Mono', 'Roboto Mono', 'monospace'],
```
Then apply the `font-numeric` Tailwind class to every instance of: transaction amounts (form inputs and ledger display), balance totals, currency symbols when adjacent to amounts, opening balance fields, net balance on the Categories page, all date strings (ledger column, recent transactions list, metrics), and the per-currency balance indicator on the transaction form.

**Do not touch:** Any logic, stores, DB, or layout structure.

**Acceptance criteria:** All amounts, balances, and dates render in Geist Mono / Roboto Mono. Non-numeric UI text (labels, descriptions, nav items) is unaffected.

---

### Phase 12 — CategorySelect component

**Scope:** `src/components/ui/CategorySelect.jsx` (new), `src/components/forms/TransactionForm.jsx`.

**Work:**

Build `CategorySelect` as a custom combobox component following the shadcn Command/Combobox pattern, using `cmdk` as the underlying primitive. It replaces every category `<select>` in the transaction form.

*Behaviour:*
- Trigger button shows the selected category name, or a placeholder when empty. No indentation, no breadcrumb — just the name, regardless of whether it's a root or child category.
- Clicking the trigger opens a popover with a search input auto-focused.
- Typing filters all options by substring match (case-insensitive) across both parent and child category names.
- The top matching result is automatically in a focused/highlighted state (visually equivalent to hover) so pressing `Enter` immediately selects it.
- Options are grouped under their account type label (Assets, Liabilities, Income, Expenses, Equity). Group labels are non-selectable headers.
- Within each group, root categories are listed first. Their children appear immediately below them, indented with a left padding increment and slightly muted text weight.
- `is_system: true` categories (Opening Balance Equity) are never shown.
- No account type colour tokens are applied at this stage — that is a separate future session.
- If search produces no results, show: *"No categories found."*

*Keyboard:*
- `↑` / `↓` — move focus through options (wraps within results)
- `Enter` — selects the focused option, closes the popover
- `Escape` — closes the popover without selecting, returns focus to the trigger

*Wiring:*
Replace all existing category dropdowns in `TransactionForm` (From rows and To rows) with `CategorySelect`. Pass the full categories list from `categoryStore`. The component receives `value`, `onChange`, and `placeholder` props.

**Do not touch:** Ledger edit modal (separate instance, addressed in a later pass), Categories page dropdowns, any store or DB logic.

**Acceptance criteria:** Typing in the search field filters options correctly. Arrow key navigation works. The top result is auto-focused on open and on each keystroke. Selecting a child category shows only its name in the trigger. `Escape` closes without selecting. System categories never appear.

---

### Phase 13 — Transaction form enhancements

**Scope:** `src/components/forms/TransactionForm.jsx`, `src/utils/accounting.js` (balance indicator logic only).

**Work:**

*Keyboard shortcuts:*
- `Ctrl+S` — submits the form if the per-currency invariant is met; does nothing if the form is invalid. Attach to `keydown` on the form container with `e.preventDefault()` to suppress browser save dialog.
- `Tab` — ensure logical focus order: Date → Description → From row 1 (Category, Currency, Amount) → From row 2… → To row 1… → Notes → Save button.
- `Enter` — when pressed while focus is on an amount input (the last field in a row), append a new row to the same section (From or To) and move focus to the Category field of the new row.
- `Escape` — if the `CategorySelect` popover is open, close it and return focus to the trigger. If no popover is open and a modal is open, close the modal.

*Zero-balance success indicator:*

Replace the current per-currency difference display with an equality statement format. For each currency present in the form:

- **Unbalanced state:** `Credits AED 100.00 ≠ Debits AED 150.00` — displayed in the existing unbalanced colour (red/amber).
- **Balanced state:** `Credits AED 100.00 = Debits AED 100.00` — displayed in green. On transition from unbalanced to balanced, play a brief success animation: the `≠` flips to `=` with a fade-cross transition, and the line pulses green once.

One line per currency. Use `font-numeric` for all amounts in this indicator. If the form has no amounts entered yet, the indicator is hidden entirely.

**Do not touch:** CategorySelect internals (Phase 12), any store, DB, or sync logic.

**Acceptance criteria:** `Ctrl+S` saves a valid form and does nothing on an invalid one. `Enter` on an amount field adds a row and moves focus correctly. The balance indicator shows the equality format with correct amounts per currency. The animation fires exactly once on each transition from unbalanced to balanced.

---

### Phase 14 — Toast notification system

**Scope:** `src/store/toastStore.js` (new), `src/components/ui/Toast.jsx` (new), `src/components/ui/ToastContainer.jsx` (new), `src/App.jsx`, plus targeted wiring in existing stores and components.

**Work:**

*Infrastructure:*

`toastStore.js` — Zustand store. State: `toasts: []` where each toast is `{ id, message, type, duration, action }`. Actions: `addToast(toast)`, `removeToast(id)`, `clearAll()`. Types: `success`, `error`, `info`.

`Toast.jsx` — single toast. Shows icon (check / × / info), message, optional action link, and a manual `×` dismiss button. Auto-dismisses after `duration` ms except when `type === 'error'` (manual close only). Entry animation: slide up from bottom. Exit: fade out.

`ToastContainer.jsx` — renders the active queue. Position: fixed, bottom-right on `md+`, bottom-centre on mobile. Max 3 toasts visible; when a 4th is added, the oldest is removed immediately. Mount inside `App.jsx` at the root level, outside the Router's page components.

*Clearing behaviour:*
- Browser refresh: automatic (Zustand is in-memory, not persisted).
- Sign-out: call `toastStore.clearAll()` in the sign-out handler in `googleAuth.js`.
- Page navigation: add a `useEffect` in `ToastContainer` that listens to React Router's `useLocation()` — on every route change, call `toastStore.clearAll()`.

*Undo (transaction save only):*

After a transaction is saved, `transactionStore` stores the full payload of the just-saved transaction + lines as `lastSavedTransaction`. The success toast message is *"Transaction saved"* with an *"Undo"* action link. Clicking Undo: hard-deletes the saved transaction and its lines, restores the form to its pre-save state, dismisses the toast. After 5 seconds: toast auto-dismisses, `lastSavedTransaction` is cleared. No undo is offered for edits or deletes — those are final.

The undo delete operation must not call `schedulePendingSync()` and must not increment `pendingChangeCount`. It must call `syncStore.decrementAndMaybeCancel()` (or equivalent action) instead.

*Event wiring:*

| Event | Type | Duration | Message | Action |
|---|---|---|---|---|
| Transaction saved | success | 5s | "Transaction saved." | Undo |
| Transaction updated | success | 3s | "Transaction updated." | — |
| Transaction deleted | success | 3s | "Transaction deleted." | — |
| Category created | success | 3s | "Category created." | — |
| Category updated | success | 3s | "Category saved." | — |
| Category delete blocked | error | manual | "Cannot delete: [reason]." | — |
| Signed in | success | 3s | "Signed in as [email]." | — |
| Signed out | info | 3s | "Signed out." | — |
| Token re-auth failed | error | manual | "Session expired. Please sign in again." | Sign In |
| Sync started | info | persistent | "Syncing…" | — |
| Sync complete | success | 3s | "Sync complete." | — |
| Sync failed | error | 5s | "Sync failed. Try again." | — |
| Export downloaded | success | 3s | "Export downloaded." | — |

The persistent sync-started toast is replaced (not stacked) by the sync complete or sync failed toast.

**Do not touch:** Any DB schema, routing config, CategorySelect, or balance indicator logic.

**Acceptance criteria:** Every listed event fires the correct toast. Error toasts require manual close. Three-toast cap enforced. Undo correctly reverses the last save and restores form state. All toasts clear on route change and on sign-out. Sync toasts replace rather than stack.

### Phase 15 — Mobile & UX Bug Fixes

**Scope:** `index.html`, `src/constants/baseCoa.js`, `src/components/layout/AppShell.jsx`, `src/components/layout/MobileTopBar.jsx` (new), `src/components/layout/BottomNav.jsx`, `src/components/forms/TransactionForm.jsx`, `src/pages/Home.jsx`, `src/pages/Ledger.jsx`, `src/components/tables/LedgerTable.jsx`, `src/pages/Categories.jsx`, `src/components/tables/CategoryTable.jsx`, `src/pages/Profile.jsx`, sign-in screen component.

**Work:**

*First-load blank screen:*
Add a CSS spinner inside `<div id="root">` in `index.html`. It must be visible immediately — no JavaScript required to render it. Style it using the app's teal primary colour (`#0D9488`). React's first render replaces the `root` contents, removing the spinner automatically.

*Base CoA descriptions:*
In `baseCoa.js`, add `description` fields to two entries:
- Accounts Receivable: `"People who owe you money. Create a sub-category for each person."`
- Accounts Payable: `"People you owe money to. Create a sub-category for each person."`

*BottomNav — scroll behaviour:*
Track scroll direction with a `useEffect` event listener on `window`. When the user scrolls down past a 60px threshold from the top, apply a `translate-y-full` transform to hide the BottomNav. When the user scrolls up, remove it. CSS transition on the transform: `duration-300 ease-in-out`. Apply `padding-bottom: env(safe-area-inset-bottom)` to the BottomNav container to clear the iOS system home bar. The 60px threshold prevents the nav from hiding on minor incidental scroll at the top of the page.

*Mobile top bar — layout shell (sync wiring deferred to Phase 16):*
Create `MobileTopBar.jsx`. Renders only on `< md`. Fixed at the top of the viewport, full width, standard height (`h-14`). Left: current page title derived from `useLocation()` matched against the route map (`/` → "Home", `/ledger` → "Ledger", etc.). Right: a sync icon button (circular arrows). In Phase 15 the sync icon is rendered but not yet wired — it is visually present as a placeholder. Mount `MobileTopBar` in `AppShell.jsx` above the page content on mobile. Add `pt-14` top padding to the page content area on `< md` to prevent content from sitting behind the bar.

*Transaction form — row widths:*
In `TransactionForm.jsx`, each From/To row container uses `flex items-center gap-2`. Apply:
- `CategorySelect`: `flex-1 min-w-0` so it takes all remaining space
- Currency dropdown: fixed `w-24`
- Amount input: fixed `w-28`
- Delete row icon: fixed `w-8` (or `shrink-0`)

The `flex-1 min-w-0` on CategorySelect also ensures its dropdown popover inherits an appropriate minimum width rather than collapsing to the trigger's narrow width. Set the popover's `min-w` explicitly to `min-w-[200px]` in `CategorySelect.jsx`.

*Transaction form — date input width:*
Remove any fixed narrow width from the date input. Apply `w-full` so it matches the full-width behaviour of the Description and Notes inputs.

*Ledger — mobile card view:*
On `< md`, replace the table with a card list in `LedgerTable.jsx`. Each transaction renders as a card with:
- First row: Date (`font-numeric`, muted) and Description (semibold), space-between
- Second row if Notes present: Notes text, truncated to one line, muted and smaller
- From section label + stacked entries: each entry on its own line as `Category — Currency Amount` (`font-numeric` for amount)
- To section label + stacked entries: same format
- Top-right corner of card: Edit icon and Delete icon
- Cards separated by a subtle divider or gap

The filter bar remains collapsible above the card list. Pagination controls remain below. The desktop table layout is unchanged.

*Categories — mobile card view:*
On `< md`, replace the table with a card list in `CategoryTable.jsx`. Each category renders as a card with:
- Name: bold for root categories; for children, a left indent and slightly muted weight
- Opening Balance: shown inline if non-zero, labelled "Opening:" prefix, `font-numeric`
- Net Balance: shown per currency, labelled "Balance:" prefix, `font-numeric`; dash if not meaningful
- Bottom-right: Edit and Delete icon buttons
- Cards separated by a subtle divider

Account type group headers (Assets, Liabilities, etc.) remain as full-width section labels between groups. The desktop table layout is unchanged.

*Home — metrics empty state:*
In `Home.jsx` (or `useMetrics.js`), wherever metric values are rendered: if a value is zero or the data set is empty, display `—` in place of any numeric value. Do not leave a blank space.

*Profile — currencies UI:*
In `Profile.jsx`:
- "Add Currency" button: add `active:scale-95 transition-transform` classes for a press-down feedback animation.
- Currency search popup: ensure it has a solid background (`bg-white dark:bg-gray-900` or the app's established surface token), a visible border (`border border-gray-200 dark:border-gray-700`), and a `shadow-pop` drop shadow (consistent with other dropdowns). The popup must not visually merge with the page behind it.

*Google permissions denied:*
In `googleAuth.js`, inspect the GIS token client callback response. If the response contains `error: 'access_denied'` or if the user closes the OAuth dialog without granting permissions, do not proceed with initialisation. Set an `authError` field in `authStore`. On the sign-in screen, when `authError` is set, display: *"Google permissions are required to use OpenAccounts."* and a *"Try again"* button that clears `authError` and re-initiates `tokenClient.requestAccessToken()`. The app must not reach a blank or partially initialised state.

**Do not touch:** `syncStore`, `syncEngine`, any DB store logic, Navbar (desktop), Phase 11–14 components, Analytics page.

**Acceptance criteria:**
- A CSS spinner is visible on first page load before React renders
- Accounts Receivable and Accounts Payable show their descriptions in the Category edit form
- BottomNav hides smoothly on scroll down and restores on scroll up with a visible transition; does not flicker on minor scroll; clears the iOS home bar
- Mobile top bar is visible on mobile, shows correct page title per route, and contains a sync icon (non-functional in this phase)
- CategorySelect takes the majority of row width on mobile; its dropdown is at least 200px wide
- Date input is full-width, consistent with Description and Notes
- Ledger shows card layout on mobile; desktop table is unchanged
- Categories shows card layout on mobile; desktop table is unchanged
- Home metrics show `—` when values are zero
- "Add Currency" button visually depresses on tap
- Currency popup is clearly elevated from the background
- Denying Google OAuth shows the error message and Try again button; the app does not proceed

---

### Phase 16 — Auto Sync + Mobile Top Bar Wiring

**Scope:** `src/store/syncStore.js`, `src/db/transactions.js`, `src/db/categories.js`, `src/db/currencies.js`, `src/store/transactionStore.js`, `src/components/layout/MobileTopBar.jsx`, `src/components/layout/Navbar.jsx`, `src/pages/Profile.jsx`.

**Work:**

*syncStore additions:*
Add the following to `syncStore.js`:

```
pendingChangeCount: number         // default 0
pendingSyncTimer: timeout | null   // default null

schedulePendingSync()
  — clears pendingSyncTimer if set
  — sets a new 30-second timeout that calls syncEngine.sync()
  — stores the timeout reference in pendingSyncTimer

decrementAndMaybeCancel()
  — decrements pendingChangeCount by 1, floor at 0
  — if pendingChangeCount reaches 0: clears pendingSyncTimer, sets it to null
  — if pendingChangeCount > 0: calls schedulePendingSync() to reset the 30-second window

syncNow()
  — clears pendingSyncTimer, sets it to null
  — sets pendingChangeCount to 0
  — calls syncEngine.sync() immediately
```

On successful auto or manual sync completion: set `pendingChangeCount = 0`, clear `pendingSyncTimer`.
On sync failure: do not reset `pendingChangeCount`, do not reschedule. Existing error toast handles user feedback.

*Wire all DB writes:*
After every successful write in `db/transactions.js`, `db/categories.js`, and `db/currencies.js`, call `syncStore.getState().schedulePendingSync()` and increment `pendingChangeCount` by 1 before calling `schedulePendingSync`. Specifically:
- `createTransaction`, `updateTransaction`, `deleteTransaction`
- `createCategory`, `updateCategory`, `deleteCategory`
- `addCurrency`, `removeCurrency`, `setDefaultCurrency`

*Wire undo to decrementAndMaybeCancel:*
In `transactionStore.js`, the undo operation hard-deletes the saved transaction and its lines directly via the DB layer — bypassing the normal `deleteTransaction` write path so it does not call `schedulePendingSync`. After the undo delete completes, call `syncStore.getState().decrementAndMaybeCancel()`.

*Manual sync buttons:*
- **Desktop navbar** (`Navbar.jsx`): add a sync icon button (circular arrows) to the right section, left of the avatar. `onClick` calls `syncStore.getState().syncNow()`.
- **Mobile top bar** (`MobileTopBar.jsx`): wire the existing sync icon button placeholder to `syncStore.getState().syncNow()`.
- **Profile page** (`Profile.jsx`): the existing "Sync with Google Drive" button calls `syncStore.getState().syncNow()` instead of calling `syncEngine.sync()` directly.

*Sync state display:*
Both the desktop navbar avatar (existing) and the mobile top bar sync icon (new) must reflect live sync state from `syncStore`:
- `syncStatus === 'syncing'`: spinner animation on the icon
- `syncStatus === 'success'`: tick/check icon, revert to default after 3 seconds
- `syncStatus === 'error'`: cross icon, persists until next sync attempt
- `syncStatus === 'idle'`: default circular arrows icon

`MobileTopBar.jsx` reads `syncStore.syncStatus` and applies the appropriate icon and animation class, consistent with the existing avatar behaviour.

**Do not touch:** Any IndexedDB schema, `syncEngine.js` internals (only its `sync()` entry point is called), Phase 11–14 components, Categories or Ledger layout, any page content outside the navbar and top bar.

**Acceptance criteria:**
- Saving a transaction triggers an auto sync after 30 seconds of no further writes
- Saving a second transaction within 30 seconds of the first resets the timer; only one sync fires
- Pressing Undo after a save cancels the pending sync if no other writes exist; if other writes exist, the timer continues
- Pressing any manual sync button triggers sync immediately and cancels any pending timer
- After a successful manual or auto sync, `pendingChangeCount` is `0` and no timer is active
- After a failed sync, `pendingChangeCount` is unchanged and no auto-retry fires
- Mobile top bar sync icon shows spinner during sync, tick on success, cross on failure
- Desktop navbar sync button behaves identically to the Profile page sync button
- The undo delete path does not schedule a new sync

---

## 14. Open Items (Deferred — Do Not Implement Yet)

- Currency conversion + Forex Gain/Loss tracking
- Statement ingestion (PDF/CSV parsing)
- Email ingestion (Gmail API)
- Analytics page (charts and stats)
- Investment current-value tracking
- Multi-user / shared access

---
