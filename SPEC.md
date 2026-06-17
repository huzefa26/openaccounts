# OpenAccounts — Project Specification
> **Version:** 1.7 | **Status:** Active
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
| Recharts | Charting library for analytics |
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

### 2.1 App-wide constants

These are defined in `src/constants/app.js`:

| Constant | Value | Used in |
|---|---|---|
| `SYNC_DEBOUNCE_MS` | 30000 | §9.3 auto-sync |
| `TOAST_DURATION_SUCCESS` | 3000 | §14 toasts |
| `TOAST_DURATION_INFO` | 3000 | §14 toasts |
| `TOAST_DURATION_ERROR` | 5000 | §14 toasts |
| `MAX_VISIBLE_TOASTS` | 3 | §14 toasts |
| `UNDO_EXPIRY_MS` | 5000 | §14 undo |
| `APP_INIT_TIMEOUT_MS` | 8000 | §8.3 AppInit |
| `APP_INIT_COMPLETE_DELAY_MS` | 300 | §8.3 AppInit |
| `LEDGER_PAGE_SIZE` | 20 | §5.6 Ledger |

### 2.2 Design tokens

These are defined in `tailwind.config.js`:

| Token | Value | Usage |
|---|---|---|
| `font-ui` | Plus Jakarta Sans, -apple-system, sans-serif | All UI text |
| `font-numeric` | Geist Mono, Roboto Mono, monospace | Amounts, balances, dates (applied to every instance app-wide) |
| `shadow-pop` | Custom elevated shadow | Dropdowns, popups |
| `color.accent` | #1E3A5F | Primary accent, active states |
| `color.bg` | Page background (light/dark variants) | Body |
| `color.surface` | Card/panel background | Cards, modals |
| `color.border` | Divider and input borders | Throughout |
| `color.text.primary` | Main text | Body copy |
| `color.text.muted` | Secondary text | Labels, metadata |
| `color.income` | Emerald-based token | Income indicators |
| `color.expense` | Amber-based token | Expense indicators |
| `color.success` | Green-based token | Success states |
| `color.error` | Rose-based token | Error states |
| `color.warning` | Amber-based token | Warning states |

---

## 3. Folder Structure

```
src/
├── components/
│   ├── ui/                  # Reusable primitives: Button, Input, Modal, Select, MultiSelect, Toast, ToastContainer, CategorySelect
│   ├── layout/              # AppShell, Navbar, MobileTopBar, BottomNav, AppInit, AvatarWithSync, FilterBar
│   ├── transactions/        # TransactionForm
│   ├── categories/          # CategoryForm, CategoryRow, CategoryCard
│   ├── ledger/              # LedgerTable, BalanceIndicator
│   └── settings/            # DataAndSyncSection, ResetAppFlow
├── pages/
│   ├── Home.jsx
│   ├── Ledger.jsx
│   ├── Analytics.jsx        # Placeholder only (future feature)
│   ├── Categories.jsx
│   ├── Profile.jsx
│   └── SignInScreen.jsx
├── db/
│   ├── index.js             # idb initialisation + upgrade logic
│   ├── categories.js        # IndexedDB CRUD for categories store
│   ├── transactions.js      # IndexedDB CRUD for transactions store
│   ├── transactionLines.js  # IndexedDB CRUD for transaction_lines store
│   ├── currencies.js        # IndexedDB CRUD for currencies store
│   ├── settings.js          # IndexedDB CRUD for settings store
│   ├── seed.js              # First-run seeding (base CoA + currencies + settings)
│   ├── snapshot.js          # Build/populate full-database snapshots
│   └── sync.js              # Change notification hub for auto-sync
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
│   └── toastStore.js        # Zustand: toast queue
├── hooks/
│   ├── useBalance.js        # Net running balance for a category (multi-currency aware)
│   ├── useMetrics.js        # Home page metrics computations
│   ├── useCategoryTree.js   # Category tree hierarchy helpers
│   ├── useClickOutside.js   # Detect clicks outside a ref
│   └── useFormRestore.js    # Save/restore TransactionForm state across navigation
├── utils/
│   ├── accounting.js        # Per-currency debit=credit validation, balance formulas, opening balance logic
│   └── export.js            # Full JSON dump of all IndexedDB stores
├── constants/
│   ├── app.js               # App-wide constants (sync debounce, toast durations, page size)
│   ├── baseCoa.js           # The 22 base Chart of Accounts entries (see Section 6)
│   └── baseCurrencies.js    # Common currency list with codes, names, symbols
├── App.jsx                  # Router setup
├── main.jsx                 # Vite entry point
└── index.css                # Tailwind directives + CSS custom properties
```

---

## 4. Data Model (IndexedDB)

Database name: `openaccounts_db`
Current schema version: `3`

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

*Transaction lines are always written as part of a transaction CRUD operation in `transactions.js`, never independently. Therefore `transactionLines.js` does not call `notifyChange()` — doing so would double-count the sync trigger.*

---

### 4.4 `currencies` store

| Field | Type | Notes |
|---|---|---|
| `code` | string | Primary key. ISO 4217 code, e.g. `"AED"`. 3 letters only. |
| `name` | string | E.g. `"UAE Dirham"` |
| `is_default` | boolean | Exactly one must be true at all times |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

*Schema version bumped to `3`. Migration: strip `symbol` field from all existing currency records in the upgrade handler in `db/index.js`.*

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

*`settings.js` does not call `notifyChange()`. Settings changes (theme, last_synced_at, app_version) are internal bookkeeping. Specifically, `last_synced_at` is written by the sync engine itself — triggering a new sync from a settings write would create an infinite loop.*

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

The opening balance transaction uses the **default currency** at the time it is created.

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
    balance[C] = opening_balance (default currency only) + SUM(debits in C) - SUM(credits in C)
  if normal_side = "credit":
    balance[C] = opening_balance (default currency only) + SUM(credits in C) - SUM(debits in C)
```

Note: `opening_balance` is recorded in the default currency. For multi-currency accounts, the opening balance applies only to the default currency bucket.

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

Pagnination size constant `PAGE_SIZE` is defined in `src/constants/app.js`.

*The filter bar is implemented as `FilterBar.jsx`. On mobile it is collapsed by default and shows a `!` badge on the toggle button when any filters are active.*

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

*Desktop navbar:* Add a sync icon button (circular arrows) to the right section of the navbar, left of the avatar. Clicking it triggers an immediate sync, bypassing the debounce timer. While it is syncing, it shows a rotation animation.

*User Avatar:* Displays the profile picture of the user available from their Google account. There are three overlay states on the avatar:
- **Syncing:** amber spinning ring — **removed** (the sync icon button adjacent to the avatar already shows the spinner animation; the ring is redundant and visually noisy)
- **Error:** small amber `!` badge, persists until next successful sync
- **Success:** green checkmark badge, auto-dismisses after 3 seconds
- **Idle:** no overlay

---

### 7.2 Home page (`/`)

**Layout (top to bottom):**

**Transaction Entry Form:**

| Field | Type | Rules |
|---|---|---|
| Date | Date picker | Default: today (`YYYY-MM-DD`). Applied `w-full` to match Description and Notes width. |
| Description | Text input | Required |
| From (credits) | Dynamic rows | Dynamic rows. Min 1 row. Each row: `CategorySelect` component · Currency dropdown · Amount input. Add row button. Delete row button (disabled when only 1 row remains) |
| To (debits) | Dynamic rows | Same structure as From |
| Notes | Textarea | Optional |
| Save | Button | Disabled until per-currency invariant is met |

**CategorySelect component** (used for each From/To row's category picker):

A searchable combobox built on `cmdk` following the shadcn Command/Combobox pattern:

- **Trigger:** Shows the selected category name (no indentation). Placeholder when empty.
- **Popover:** Opens on trigger click with search input auto-focused.
- **Search:** Filters all options by substring match (case-insensitive) across both parent and child category names.
- **Auto-focus:** The top matching result is automatically highlighted on open and on each keystroke, so pressing `Enter` immediately selects it.
- **Grouping:** Options are grouped under their account type label (Assets, Liabilities, Income, Expenses, Equity). Group labels are non-selectable headers.
- **Order:** Within each group, root categories first, children indented below with left padding and slightly muted weight.
- **System categories:** `is_system: true` categories (Opening Balance Equity) are never shown.
- **Empty state:** If search produces no results, show: *"No categories found."*
- **Keyboard:** `↑`/`↓` to move focus (wraps within results), `Enter` to select focused option and close, `Escape` to close without selecting and return focus to trigger.

On mobile (`< md`), each From/To row splits into two lines: CategorySelect (full width) on line 1, Currency + Amount + Delete button inline on line 2. Desktop keeps a single inline row.

**Keyboard shortcuts:**
- `Ctrl+S` — submits a valid form; no-op if invariant not met
- `Enter` on an amount input — appends a new row to the same section, moves focus to the Category field of the new row
- `Tab` — logical field order: Date → Description → From rows (Category → Currency → Amount per row) → To rows → Notes → Save
- `Escape` — closes the `CategorySelect` popover if open; closes any modal if open

*Form state persistence: `useFormRestore` saves the form's current state to `transactionStore.formRestoreState` on unmount (when the user navigates away from Home). On remount, if `formRestoreState` is set, it is dispatched as a `RESTORE` action to refill the form. The undo path uses a separate `transactionStore.undoRestoreState` field, which when set triggers a `RESTORE` dispatch independently of navigation.*

Below From and To sections: A per-currency equality indicator. Format: `Credits AED 100.00 = Debits AED 100.00`. One line per currency. Uses `font-numeric` for amounts. Unbalanced state: `≠` sign, red/amber colour. Balanced state: `=` sign, green colour, with a one-time pulse animation and a `≠` → `=` fade-cross transition on each transition to balanced. Hidden entirely when no amounts have been entered.

On Save: write transaction + all lines to IndexedDB. Update Zustand stores. Reset form (today's date, cleared fields, 1 row each side).

**Undo (transaction save only):** After a transaction is saved, `transactionStore` stores the full payload of the just-saved transaction + lines as `lastSavedTransaction`. The success toast message is *"Transaction saved"* with an *"Undo"* action link. Clicking Undo: hard-deletes the saved transaction and its lines, restores the form to its pre-save state, dismisses the toast. After 5 seconds (`UNDO_EXPIRY_MS`): toast auto-dismisses, `lastSavedTransaction` is cleared. No undo is offered for edits or deletes — those are final.

The undo delete operation must not call `schedulePendingSync()` and must not increment `pendingChangeCount`. It must call `syncStore.decrementAndMaybeCancel()` instead. *Known Issue #9: The Undo button is currently hidden in the Toast; the backend logic is kept intact. Re-enable only after auto-sync compatibility is fully validated.*

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

**Header:** a horizontal bar containing a search input (left/centre) and a "New Category" button (right-aligned). Page title is shown by MobileTopBar.

Header Search behaviour:
- Search input filters the category list in real-time as the user types
- Searches across: name, description, and account type
- Matching is case-insensitive substring
- Account type groups with no matching categories are hidden entirely
- When the search is cleared, the full grouped list is restored

**List layout:** Grouped by `type` (section header per type in order: Asset → Liability → Income → Expense → Equity). Within each type, root categories are listed; their children are indented beneath them.

**Each row:**

| Column | Notes |
|---|---|
| Name | Required. Must be unique across all categories (case-insensitive). If a duplicate name is detected on save, show an inline error: *"A category with this name already exists."* Do not submit |
| Opening Balance | Displayed if non-zero |
| Net Balance | Per-currency running balance (§5.3). Shown as a currency-keyed list. Dash (`-`) for leaf expense/income categories where lifetime totals are not meaningful |
| Edit | Icon button → Category Form |
| Delete | Icon button → deletion rules (§5.4) |

**Mobile Layout (`< md`):** The table is replaced by a card list. Each category card shows Name (bold for roots, indented label for children), Opening Balance if non-zero, Net Balance, and Edit/Delete icons. Account type group headers remain as full-width section dividers.

On `md+`, `CategoryRow` (desktop `<tr>`) component is used. On `< md`, `CategoryCard` (mobile card) component is used. Both use `useBalance()` for net balance and `useCategoryTree()` for hierarchy.

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

**Default Currency**
- Display current default currency
- "Change" opens a dropdown to select from the user's active currencies

**Currencies**
- List of active currencies (code + name)
- "Add Currency" — opens a searchable dropdown of all currencies (from `baseCurrencies.js` + user defined) and a *"Define custom currency"* option at the bottom.
- "Add Currency" button: active press state — `active:scale-95` with `transition-transform`.
- Currency search popup: solid background, visible border, and `shadow-pop` drop shadow to visually separate it from the page behind it.
- Delete icon per row (cannot delete the default currency; show tooltip)
- "Define custom currency" opens a form: Code (3 letters, validated as not already existing), Name (required), "Save" button that initiates the validation and saves the custom currency if validated, and a "Cancel" button to close the form.

**Data & Sync**
- "Sync with Google Drive" button — triggers sync engine (§9)
- Last synced timestamp (from `syncStore.lastSynced`)
- Sync status indicator:
  - `idle`: "Ready"
  - `syncing`: "Syncing…" with spinner
  - `error`: "Sync failed" with last attempt time
- "Export Data" button — triggers JSON export (§10)

**Danger Zone**
- A clearly delineated section labelled "Danger Zone" at the bottom of the Profile page. Contains one action: **Reset App** button (red, destructive styling).
- `ResetAppFlow.jsx` implements a 3-step guarded confirmation flow triggered by this button:
  1. Step 1 — Warning screen:
  *"This will permanently delete all your data, including your Google Drive backup. This cannot be undone."*
  Button: "Continue"
  2. Step 2 — Type to confirm:
  User must type the word `delete` into an input field exactly.
  Button: "Confirm" (disabled until input matches)
  3. Step 3 — Final confirmation:
  User must type `i am sure` into an input field exactly.
  Button: "Reset App" (disabled until input matches)
- On final confirm, `Profile.jsx::handleReset()` executes in sequence:
  1. `resetDB()` — calls `indexedDB.deleteDatabase('openaccounts_db')`
  2. `deleteFile(fileId)` — calls `DELETE /drive/v3/files/{fileId}` via `googleDrive.js`. Accepts 204 (deleted) and 404 (already gone) as success
  3. Signs out via `authStore.signOut()`
  4. User is returned to the sign-in screen

---

### 7.6 Analytics page (`/analytics`)

The Analytics page provides financial insights via Recharts. All charts share one global time range filter. Default range: **Last 6 months**. Range options: This Month · Last 3 Months · Last 6 Months · This Year · All Time.

**Five charts, displayed in this order:**

**1. Spending by Category — Donut chart**
Aggregates total debit amounts on `expense`-type transaction lines over the selected period. Each slice = one category. Legend lists category name and percentage. Hovering/tapping a slice shows the total amount. Excludes zero-spend categories.

**2. Monthly Expenses vs Income — Grouped bar chart**
One group of two bars per calendar month in the selected period. Bar 1 = sum of all income lines for that month. Bar 2 = sum of all expense lines. X-axis: month labels (e.g. "Jan", "Feb"). Y-axis: amount. Tooltip shows exact values.

**3. Net Worth over time — Line chart**
One data point per calendar month. Value = total assets net balance minus total liabilities net balance at the end of that month, in the default currency. X-axis: months. Y-axis: amount. A horizontal reference line at zero.

**4. Cash Flow over time — Line chart**
One data point per calendar month. Value = sum of all income transaction lines minus sum of all expense transaction lines for that month. Positive = surplus, negative = deficit. Same axis treatment as Net Worth chart. Reference line at zero.

**5. Balance per Account — Horizontal bar chart**
One bar per selected account. User selects which accounts to display via a multi-select above the chart. Default selection: all root-level asset accounts. Bar length = net running balance per §5.3 formula, in the default currency. Accounts with zero balance are included if selected.

**Multi-currency note:** All Analytics charts aggregate amounts in the default currency only. Transactions in other currencies are excluded from chart computations. A subtle note below each chart reads: *"Amounts shown in [default currency code] only."*

**Recharts components used:** `PieChart`, `BarChart`, `LineChart`, `ResponsiveContainer`, `Tooltip`, `Legend`, `XAxis`, `YAxis`, `CartesianGrid`. All styled using the app's design tokens (colours from `tailwind.config.js`, `font-numeric` for axis tick values).

### 7.7 Page pre-react-hydrated

A CSS spinner inside <div id="root"> in `index.html` is visible immediately on page load before React hydrates. Styled with the app's accent colour. React's first render replaces it.

---

### 7.8 Toast System

**Infrastructure:**

- **`toastStore.js`** (Zustand) — State: `toasts: []` where each toast is `{ id, message, type, duration, action }`. Actions: `addToast(toast)`, `removeToast(id)`, `clearAll()`.
- **Types:** `success`, `error`, `info`.
- **`Toast.jsx`** — Single toast: icon (check / × / info), message, optional action link, manual `×` dismiss button. Auto-dismisses after `duration` ms except when `type === 'error'` (manual close only). Entry animation: slide up from bottom. Exit: fade out.
- **`ToastContainer.jsx`** — Renders active queue. Position on `md+`: fixed bottom-right. Position on `< md`: fixed with `bottom` offset equal to BottomNav height plus padding (`bottom: calc(4rem + env(safe-area-inset-bottom) + 0.5rem)`). Max 3 toasts visible; when a 4th is added, the oldest is removed immediately. Mounted in `App.jsx` at root level, outside Router's page components.

**Clearing behaviour:**
- Browser refresh: automatic (Zustand is in-memory, not persisted).
- Sign-out: `toastStore.clearAll()` called in the sign-out handler in `googleAuth.js`.
- Page navigation: `useEffect` in `ToastContainer` listens to React Router's `useLocation()` — on every route change, calls `toastStore.clearAll()`.

**Event wiring:**

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

The toast duration for an event is set by global constants dependending on the event type. TOAST_DURATION_SUCCESS for "success", TOAST_DURATION_ERROR for "error" and TOAST_DURATION_INFO for "info".

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

Implemented in `SignInScreen.jsx`. Two error states are handled:
- `authStore.authError` set (permissions denied or OAuth dismissed): shows "Google permissions are required to use OpenAccounts." + "Try again" button
- `authStore.error` set (generic failure): shows the error string

### 8.3 Post sign-in initialisation

Implemented in `AppInit.jsx`, rendered immediately after sign-in, before the main app shell.  The Drive check uses an 8-second `AbortController` timeout (`APP_INIT_TIMEOUT_MS`). A loading screen is shown during this check. On timeout or network error, shows an error message *"Couldn't reach Google Drive. Please check your connection and try again."* with a "Try Again" button — does not fall back to local data silently. Drive is the source of truth.

```
Check Drive for openaccounts.json
  → File exists:  pull from Drive → populate IndexedDB → render app
  → File absent:  seed base CoA (§11) → push to Drive → render app
```

Drive restore uses `populateFromSnapshot(db, data)` from `db/snapshot.js` — this clears all IndexedDB stores and bulk-inserts from the Drive file.
Post-seed push uses `buildSnapshot()` from `db/snapshot.js` to serialise the seeded state before pushing to Drive.

### 8.4 Token storage

| localStorage key | Content |
|---|---|
| `oa_access_token` | GIS access token string |
| `oa_token_expiry` | ISO timestamp of token expiry |
| `oa_user_info` | JSON string - Full user profile from `fetchUserInfo()`: `{ sub, name, givenName, familyName, picture, email, emailVerified }`. Persists the profile across page refreshes without an extra API call |

No refresh token — GIS token client does not issue refresh tokens.

### 8.5 Token checks

**Strict check** — Run on app load and before any protected Drive action. Verifies the user's Google session is still valid. If the token is expired and silent re-auth fails, return the user to the sign-in screen.

**Early refresh check** — Run when `oa_token_expiry` is within 5 minutes of the current time. Calls `tokenClient.requestAccessToken({ prompt: '' })` silently to obtain a fresh token before any active task breaks.

### 8.6 Managing auth errors and Drive access loss

**Background:** A 403 from the Drive API means the app's OAuth token lacks the `drive.appdata` scope. This happens in two distinct scenarios.

**Case 1 — Scope not granted on first sign-in**

*When:* During `AppInit.jsx` initial Drive check, immediately after the user signs in for the first time.

*Cause:* The user dismissed or unchecked the Drive permission in the Google OAuth consent screen.

*Detection:* Drive API returns 403 during the first file check.

*Flow:*
1. `AppInit` catches the 403 and sets `authStore.driveAccessDenied = true`
2. A full-screen message replaces the loading state:
   *"OpenAccounts needs access to your Google Drive to save your data. It can only access files it creates - nothing else in your Drive is visible to this app."*
   Button: **"Grant Access"**
3. User taps "Grant Access" → `tokenClient.requestAccessToken()` is called with `prompt: 'consent'` to force the consent screen to reappear
4. On success: clear `driveAccessDenied`, retry the Drive file check, continue normal init
5. On repeated denial: show the message again

**Case 2 — Scope revoked or reset during active use**

*When:* During `syncEngine.sync()` — either the upload (push) or download (pull) step.

*Cause:* The user revoked Drive access via Google account settings, or the token scope was reset externally.

*Detection:* Drive API returns 403 during an upload or download call inside `syncEngine`.

*Flow:*
1. `syncEngine` catches the 403 and aborts the sync operation
2. `pendingChangeCount` is **not reset** — the user's unsynced local changes remain intact in IndexedDB and the count is preserved
3. `syncStore.syncStatus` is set to `'error'`
4. A persistent (manual-dismiss) toast is shown:
   *"Drive access was lost. Your local data is safe — re-authorise to resume syncing."*
   Action link: **"Re-authorise"**
5. User taps "Re-authorise" → `tokenClient.requestAccessToken()` is called with `prompt: 'consent'`
6. On success: dismiss the toast, automatically call `syncStore.syncNow()` to retry the sync with the pending changes
7. The user's changes that were pending are pushed as part of the retry — nothing is lost

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

`buildSnapshot(data)` from `db/snapshot.js` is the canonical serialiser for this format. It is called by `syncEngine.js` (Drive push), `AppInit.jsx` (post-seed push), and `export.js` (JSON download).

`deleteFile(fileId)` — `DELETE /drive/v3/files/{fileId}`. Accepts 204 (deleted) and 404 (already gone) as success. Throws on other errors. Called by `ResetAppFlow` during full app reset.

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

Every write (transaction created/updated/deleted, category created/updated/deleted, currency added/removed) schedules an automatic sync with a 30-second debounce. Each new write resets the timer. The connection between DB writes and `syncStore` is mediated by `db/sync.js` — a pub-sub notification hub. This decoupling prevents a circular dependency between the DB layer and `syncStore`. `syncStore` registers itself via `registerOnChange()` on startup. `categories.js`, `transactions.js`, and `currencies.js` call `notifyChange()` after every successful write (unless `suppressSync: true`). `transactionLines.js` and `settings.js` do not call it — see §4.3 and §4.5 for reasons.

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
| 14 | Toast notification system — `toastStore`, `Toast`, `ToastContainer`; all event wiring; Undo backend logic (action link disabled — see Known Issue #13); clear on navigation and sign-out | ✅ Complete |
| 15 | Mobile & UX bug fixes — Ledger and Categories card views on mobile; transaction form row widths (CategorySelect `flex-1`, fixed currency + amount widths) and two-line mobile layout; date input full width matching other inputs; BottomNav smooth scroll hide/restore with iOS safe-area; mobile sticky top bar layout shell (consumed by Phase 16 for sync wiring); Profile currencies button press animation and popup elevation; page headers removed (redundant with MobileTopBar); Google permissions denied error state and retry; `index.html` first-load spinner; base CoA descriptions for AR and AP | ✅ Complete |
| 16 | Auto sync — `syncStore` additions (`pendingChangeCount`, `pendingSyncTimer`, `schedulePendingSync`, `decrementAndMaybeCancel`, `syncNow`); wire all DB writes (`transactions`, `categories`, `currencies`) to increment + `schedulePendingSync` with `suppressSync` option for undo; wire undo to `decrementAndMaybeCancel`; manual sync buttons (desktop navbar + mobile top bar) call `syncNow()`; Profile sync button switched to `syncNow()`; timer identity check guards writes-during-sync race; `visibilitychange` hook syncs pending writes on tab hide | ✅ Complete |
| 17 | Bug fix batch — issues #2, #3, #4, #5 (drop avatar sync ring), #6, #7, #8, #10 | ⏳ Pending |
| 18 | Auth: Drive 403 handling — two-case re-authorisation flow (§8.6) | ⏳ Pending |
| 19 | User-defined currencies — custom code + name form, schema v3 migration to drop symbol | ⏳ Pending |
| 20 | Categories search — inline search next to New Category button, real-time filtering, hide empty groups | ⏳ Pending |
| 21 | Analytics page — Recharts, 5 charts, global time range filter, multi-currency exclusion note | ⏳ Pending |

---

## 13. Known Issues

Bugs and regressions identified during Phase 15 testing. These are tracked for resolution but are not blocking.

| # | Issue | Priority | Notes |
|---|-------|----------|-------|
| 1 | Drive API 403 — insufficient auth scopes | High | "Try Again" on 403 leads to dead end. Need to detect 403, clear token, and re-initiate OAuth with full scopes |
| 2 | Categories console warning — missing `key` prop | Low | `Fragment <>` usage in `Categories.jsx` list rendering without keys. Resolved in Phase 17. |
| 3 | Toast appears above BottomNav | Medium | Fix: offset ToastContainer bottom by BottomNav height + safe-area on mobile. Resolved in Phase 17. |
| 4 | Profile reset modal overlay not dimming | Low | Nested modals during reset flow may not apply `bg-overlay` correctly. Resolved in Phase 17. |
| 5 | Avatar sync ring animation visual polish | Low | Resolution: drop the avatar sync ring entirely. Sync icon button adjacent to avatar already shows spinner. Resolved in Phase 17. |
| 6 | Profile image broken on re-navigation | Medium | Image fails to load after navigating away and back; investigate `referrerpolicy` or cache behaviour. Resolved in Phase 17. |
| 7 | "Add Row" button retains `:focus` on mobile | Low | After tapping "Add Row", the button stays visually focused; use `:focus-visible`. Resolved in Phase 17. |
| 8 | Delete button alignment in TransactionForm's rows on mobile | Low | Push delete button to far-right of line 2 with a flex spacer. Resolved in Phase 17. |
| 9 | Undo (transaction save) disabled | Low | Button hidden in Toast. Backend logic (`lastSavedTransaction`, 5s auto-clear) kept intact. Re-enable only after auto-sync compatibility is fully validated: (1) undo must not schedule a sync, (2) undo must correctly decrement `pendingChangeCount`, (3) undo must restore form state without data races |
| 10 | Leaf income/expense net balance dash | Low | CategoryRow and CategoryCard always show the computed net balance. SPEC §7.4 requires a dash (`—`) for leaf expense/income categories where lifetime totals are not meaningful. Resolved in Phase 17. |

---

## 14. Next Phases (planned)

**Set the app's version to the `<current-major-version>.<current-phase>.<current-patch-version>`**

### Phase 17 — Bug fix batch (remaining issues from §13)

**Scope:** `src/components/ui/ToastContainer.jsx`, `src/components/layout/AvatarWithSync.jsx`, `src/components/transactions/TransactionForm.jsx`, `src/components/categories/CategoryRow.jsx`, `src/components/categories/CategoryCard.jsx`

**Work:**

*Issue #3 — Toast appears above BottomNav on mobile:*
In `ToastContainer.jsx`, change the mobile (`< md`) position: replace `fixed bottom-4 right-4 max-md:left-4` with a bottom offset that accounts for the BottomNav height: `fixed bottom-0 left-0 right-0 max-md:bottom-[calc(4rem+env(safe-area-inset-bottom)+0.5rem)]`. This ensures toasts never overlap the BottomNav.

*Issue #5 — Avatar sync ring is redundant:*
In `AvatarWithSync.jsx`, remove the `<div>` block that renders the spinning ring when `status === 'syncing'`. The sync icon button adjacent to the avatar already shows a spinner, making the ring redundant and visually noisy.

*Issue #7 — "Add Row" button retains `:focus` on mobile:*
In `TransactionForm.jsx`, replace `focus:` with `focus-visible:` on the "Add Row" button's Tailwind classes so the focus ring does not persist after a tap interaction on mobile.

*Issue #8 — Delete button alignment in TransactionForm rows on mobile:*
In `TransactionForm.jsx`, on mobile (`flex-col` layout), add an `ml-auto` flex spacer before the delete button on line 2 to push it to the far-right.

*Issue #10 — Leaf income/expense net balance dash:*
In `CategoryRow.jsx` and `CategoryCard.jsx`, update the `balanceDisplay` logic to show `—` (dash) when the category has no children (leaf) and its `type` is `income` or `expense`. Use `useCategoryTree` to determine leaf status.

**Do not touch:** Any DB schema, sync logic, auth logic, CategorySelect internals, toast infrastructure beyond the position fix.

**Acceptance criteria:**
- Toasts on mobile clear the BottomNav (no overlap).
- Avatar has no visible sync ring overlay.
- "Add Row" button does not retain focus highlight on mobile after tap.
- Delete button is right-aligned on line 2 of mobile rows.
- Leaf income and expense categories show `—` for net balance; parent categories still show computed balances.

---

### Phase 18 — Auth: Drive 403 handling

Implement the two-case Drive 403 re-authorisation flow specified in §8.6.

**Scope:** `src/components/layout/AppInit.jsx`, `src/sync/googleDrive.js`, `src/sync/googleAuth.js`, `src/store/authStore.js`, `src/sync/syncEngine.js`, `src/store/syncStore.js`, toast wiring.

**Work:**

*Case 1 — Scope not granted on first sign-in (§8.6 Case 1):*
1. Add `driveAccessDenied: boolean` field to `authStore`.
2. In `AppInit.jsx`, detect 403 responses from the initial Drive file check. On 403, set `authStore.driveAccessDenied = true` and render a full-screen message: *"OpenAccounts needs access to your Google Drive to save your data. It can only access files it creates — nothing else in your Drive is visible to this app."* with a **"Grant Access"** button.
3. "Grant Access" calls `tokenClient.requestAccessToken({ prompt: 'consent' })`. On success: clear `driveAccessDenied`, retry the Drive file check, continue normal init. On repeated denial: show the message again.

*Case 2 — Scope revoked during active use (§8.6 Case 2):*
4. In `googleDrive.js`, propagate 403 status codes distinctly (e.g., throw a typed error or attach a flag).
5. In `syncEngine.js`, catch 403 during pull or push. On 403: abort the sync, do not reset `pendingChangeCount`, set `syncStore.syncStatus = 'error'`.
6. Show a persistent (manual-dismiss) error toast: *"Drive access was lost. Your local data is safe — re-authorise to resume syncing."* with an action link **"Re-authorise"**.
7. "Re-authorise" calls `tokenClient.requestAccessToken({ prompt: 'consent' })`. On success: dismiss the toast, call `syncStore.syncNow()` automatically to retry with pending changes intact.

**Do not touch:** Any DB schema, category/transaction CRUD, form UI, analytics, or any page content outside the auth/sync flows.

**Acceptance criteria:**
- First sign-in with Drive permission unchecked shows the "Grant Access" screen instead of a generic error.
- Tapping "Grant Access" re-opens the OAuth consent screen with `drive.appdata` scope.
- Revoking Drive access during active use shows the persistent "Re-authorise" toast.
- Tapping "Re-authorise" triggers consent screen, and on success retries the sync without losing pending changes.
- Unrelated API errors (4xx other than 403, 5xx) do not trigger the 403-specific flow.

---

### Phase 19 — User-defined currencies

**Scope:** `src/pages/Profile.jsx`, `src/db/index.js`, `src/db/currencies.js`, `src/db/seed.js`, `src/db/snapshot.js`

**Work:**

*Schema v3 migration (drop `symbol` field):*
1. Bump `DB_VERSION` in `db/index.js` from `2` to `3`.
2. Add an upgrade handler that iterates all currency records in the `currencies` store and deletes the `symbol` field from each.
3. Update `db/snapshot.js`'s `version` from `2` to `3`.
4. Update `db/seed.js` to stop writing the `symbol` field during currency seeding.

*Custom currency form (per §7.5):*
5. In `Profile.jsx`'s "Add Currency" flow, add a *"Define custom currency"* option at the bottom of the base currency search popup.
6. Tapping it opens an inline form with:
   - **Code:** text input, max 3 letters, validated against existing currency codes (case-insensitive). Show inline error if already exists.
   - **Name:** text input, required.
   - **Save** button: validates and writes via `currencyStore.addCurrency({ code, name })`.
   - **Cancel** button: closes the form.
7. Existing base-currency search-and-select flow continues to work unchanged.

**Do not touch:** Any other page, any transaction/category logic, any sync logic (currencies already sync via existing `currencies.js` `notifyChange` call), any auth logic, the CategorySelect component.

**Acceptance criteria:**
- Schema v3 migration runs automatically on existing databases; `symbol` field is absent from all currency records after migration.
- Base currency search and selection works as before.
- "Define custom currency" option appears at the bottom of the currency search popup.
- Custom currency with valid code and name is saved and appears in the active currencies list.
- Duplicate code (case-insensitive) shows an inline error and does not save.
- Custom currencies sync correctly to/from Drive.

---

### Phase 20 — Categories search

Implement the inline search header specified in §7.4.

**Scope:** `src/pages/Categories.jsx`

**Work:**
1. Add a text input to the header bar, left of the "New Category" button.
2. Maintain a `searchQuery` state in `Categories.jsx`.
3. Filter the rendered categories in real-time as the user types. Match against `name`, `description`, and account type label (case-insensitive substring).
4. Account type groups with no matching visible categories are hidden entirely (section header not rendered).
5. When the search query is cleared, restore the full grouped list.

**Do not touch:** Any DB store, category CRUD logic, any other page, any layout component outside `Categories.jsx`, the Category Form modal.

**Acceptance criteria:**
- Text input is visible in the header bar next to "New Category".
- Typing filters visible categories in real-time. Matching is case-insensitive and searches name, description, and type.
- Empty groups are hidden (no orphaned section headers).
- Clearing the search restores the full list instantly.

---

### Phase 21 — Analytics page

Build the Analytics page per the full visual and data spec in §7.6.

**Scope:** `src/pages/Analytics.jsx`, `package.json`

**Work:**
1. Install `recharts` as a project dependency.
2. Implement the component in `src/pages/Analytics.jsx`.
3. Add a global time range filter with options: This Month · Last 3 Months · Last 6 Months · All Time (default: Last 6 months).
4. Build five charts in display order:
   - **Spending by Category** — `<PieChart>` donut with `<Tooltip>` and `<Legend>`. Each slice = one category's total expense debits.
   - **Monthly Expenses vs Income** — `<BarChart>` with two `<Bar>` series per month.
   - **Net Worth over time** — `<LineChart>` with a horizontal reference line at zero.
   - **Cash Flow over time** — `<LineChart>` with reference line at zero.
   - **Balance per Account** — horizontal `<BarChart>` preceded by a multi-select for account selection (default: all root-level assets).
5. Apply the multi-currency exclusion note below each chart: *"Amounts shown in [default currency code] only."*
6. Use `useBalance` and `useMetrics` hooks where applicable; create page-specific data computation logic as needed.
7. Style using the app's design tokens (colours from `tailwind.config.js`, `font-numeric` for axis tick values, `ResponsiveContainer` for responsiveness).

**Do not touch:** Any other page, any DB schema, any sync/auth/export logic, the CategorySelect or Toast components, the transaction form.

**Acceptance criteria:**
- All five charts render with correct data based on the selected time range.
- Changing time range updates all charts simultaneously.
- Charts display amounts in the default currency only; other currencies are excluded.
- The multi-currency exclusion note is visible below each chart.
- The page does not crash when there are no transactions (empty state shown gracefully).
- Recharts components use the app's design tokens for colours and fonts.

---

## 15. Open Items (Deferred — Do Not Implement Yet)

- Currency conversion + Forex Gain/Loss tracking
- Statement ingestion (PDF/CSV parsing)
- Email ingestion (Gmail API)
- Investment current-value tracking
- Multi-user / shared access
- Person-to-person splits and transfers with Accounts Payable/Receivable tracking
- Multi-tab safety — handle account switching across tabs without data corruption

---
