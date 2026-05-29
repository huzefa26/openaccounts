---
name: openaccounts-ui
description: >
  UI/UX design principles for a minimalist personal double-entry accounting web app.
  Use this skill whenever building or iterating on any part of the interface: the home
  dashboard, transaction entry form, general ledger, chart of accounts, or analytics.
  Also use for smaller tasks like improving a table layout, styling a data entry form,
  or choosing colors for financial data. This skill defines the visual language,
  interaction principles, and design values that keep every surface consistent and
  trustworthy. Read it before writing any UI code for this app.
---

# OpenAccounts — UI Design Skill

A minimalist, double-entry ledger app. Users sign in with Google and land directly
on a focused interface for recording and reviewing transactions. Four surfaces:
a home dashboard with a quick-entry form, a general ledger, a chart of accounts,
and an analytics view.

Consult `references/tokens.md` for the exact color values, font names, and spacing
scale when implementing any of the principles below.

---

## Design Identity

The aesthetic is **quiet precision** — the visual language of a well-organized
notebook applied to software. It sits at the intersection of three reference points:

- **iOS Notes**: content-first, minimal chrome, the interface never competes with
  the data, the entry form is always present and ready
- **Design System**: systematic clarity, zero ambiguity, every color has
  exactly one semantic job, no decoration that doesn't earn its place
- **SaaS dashboards (Lattice-style)**: structured data hierarchy, density that
  serves the user rather than impressing them, progressive disclosure of detail

The synthesis: an interface that earns trust through restraint. No gradients. No
shadows competing for attention. No color used for atmosphere when it could be
used for meaning. Financial data is high-stakes — visual noise erodes confidence
in the numbers.

**The single most important question to ask about any UI decision**: does this
make the numbers easier to read and trust, or harder?

---

## Color

The color system is **semantic first, aesthetic second**. Colors exist to carry
meaning, not mood.

Two colors are completely reserved for financial sign and must never be repurposed
for general UI states like success/error confirmation:

- **Income / credit**: a deep emerald green — money arriving
- **Expense / debit**: a muted crimson — money leaving

These two colors do enormous work throughout the entire app. Diluting them by
using them elsewhere (e.g., green for a "saved" toast, red for a required field
warning) destroys the user's ability to scan financial data at a glance.

Everything else flows from a warm near-neutral palette. The background is a warm
off-white — not pure white, which feels clinical for a daily-use personal tool.
Cards and input fields sit on true white, creating subtle separation from the
background without shadows.

A single navy/slate accent carries all interactive intent: primary buttons,
active navigation, focus rings, selected rows. One accent, used sparingly, keeps
the eye moving to what matters.

The full palette: `references/tokens.md`
Purely for inspiration, no hard following: `references/components.md`
Purely for inspiration, no hard following: `references/pages.md`

---

## Typography

Two typefaces, each with a specific domain:

**UI font** (Plus Jakarta Sans): all labels, body text, navigation, headings.
Humanist, warm, legible at small sizes. Chosen over geometric alternatives because
financial software needs to feel approachable, not clinical.

**Numeric font** (Geist Mono): every number, amount, balance, date, account code,
reference number. A monospaced typeface ensures perfect column alignment in tables
without CSS hacks, and signals to users that this value is precise data, not
decorative content. This distinction — UI text vs. numeric text — is the single
most important typographic rule in the system.

Type scale uses 6–7 steps, not 12. Most UI lives at 13–15px. Large numbers (metric
cards, hero balances) earn their size because they are the answer to a question, not
decoration.

No italic text anywhere. It reads as informal and reduces legibility at small sizes
in a tabular context.

---

## Spatial Reasoning

The layout philosophy is **deliberate density**: not sparse, not packed, but
calibrated to let data breathe without wasting screen real estate.

Tables and lists are denser than forms. Forms are denser than dashboards. Each
surface has a different job, and the whitespace budget reflects that job.

Use an 8px base unit. All spacing values are multiples of 4. Consistent rhythm
makes the layout feel organized even when content varies.

Borders over shadows for elevation. A 1px line at `--border` color separates
cards and table rows; a slightly darker `--border-strong` on focused inputs.
Shadows introduce visual weight that competes with data. The only exception:
dropdown panels and tooltips, which need genuine depth to float above content.

Navigation chrome (sidebar, header, bottom tabs) should be visually quieter than
the content it frames. Muted text, no background fills, no extra borders. The
navigation should feel like a margin on a notebook page, not a frame.

---

## Financial Data Display

These rules are non-negotiable. Violating them makes the app feel untrustworthy
regardless of how well everything else is designed.

**Numbers**: always right-aligned, always monospaced, always formatted with
thousands separators (`12,450.00`, never `12450.00`). Zero exceptions.

**Debit and credit columns**: never share a column. A single "Amount" column with
parentheses for negatives is an anti-pattern for double-entry bookkeeping. The
two sides of an entry must be visually separate.

**Empty amount cells**: show a dash (`—`), never leave blank. Blank cells look
like missing data; a dash communicates "this side has no value here."

**Negative balances**: use the expense color, not parentheses and not a minus sign
alone. Color communicates sign faster than a character does.

**Running balance**: always visible in ledger view. Users should never have to
mentally calculate where they stand.

**Currency prefix**: display as a non-editable prefix on amount inputs, not inside
the input value. This prevents formatting errors and makes currency unambiguous.

---

## Interaction Design

The home page's entry form is always visible, never behind a button. Recording
a transaction is the primary action in the entire app — removing a single click
from that action is more valuable than any animation or visual polish.

Transitions are permitted only on color and border changes — hover states, focus
rings, input validation states. Use `120ms ease`. Nothing else moves. No layout
transitions, no number counter animations, no page transitions. Finance software
should feel immediate, not performative.

Confirmations for destructive actions (deleting a transaction) happen inline, in
the same row or panel where the action was triggered. No modals. The user's eye
should not be forced to center-screen to confirm something they already decided.

After a successful form save, the data appearing correctly in the ledger IS the
confirmation. No toast notification required for routine saves. Reserve toast
notifications for background operations (export complete) and genuine errors
(network failure). Green toasts after every save train users to ignore toasts —
defeating their purpose when something actually needs attention.

Form validation: on blur, not on keystroke. Error messages appear as text below
the field, not as alert banners. Clear the error the moment the user corrects it
(on input, not on blur).

Skeleton loading states instead of spinners for tables and lists. Spinners focus
attention on waiting; skeletons preview the layout the data will occupy, which
feels faster even when it isn't. Static skeletons (no shimmer animation) keep the
page calm.

Pagination for the ledger, not infinite scroll. Users need to know where they are
in their transaction history. "Page 3 of 8" is information. An infinite feed
is not.

---

## Accessibility

Every interactive element needs a visible focus ring. Use `outline: 2px solid
[accent color]; outline-offset: 2px` consistently — do not suppress outlines.

Color is never the only differentiator. Debit and credit rows are distinguished
by color AND column placement AND the presence of a value in that column. Income
and expense account badges use color AND a text label. A user who cannot
distinguish red from green must still understand the data.

Amount values read by screen readers should be full phrases: "four hundred
twenty-five dirhams" or the equivalent, not "4 2 5 . 0 0". Use `aria-label`
on amount cells when the visual formatting (monospace, color) carries meaning
that the raw text does not.

Table headers need `scope="col"`. Icon buttons need `aria-label`. Account type
badges need their text content — the color alone is not sufficient.

Minimum touch target: 44×44px on all interactive elements. Mobile users recording
a transaction at the end of a shopping trip are not in ideal conditions.

Target WCAG 2.2 AA contrast ratios throughout. The warm off-white background
requires checking all text colors — not just against pure white.

---

## What Never Belongs Here

These are the anti-patterns most likely to be introduced by an AI working without
this skill. Treat each as a hard constraint, not a preference:

- **No shadows** for card separation. Use borders.
- **No gradients** on any UI element, ever.
- **No color outside the defined palette.** Not even "just for this one chart."
- **No amount columns without right-alignment.**
- **No numbers without monospace font.**
- **No numbers without thousand separators.**
- **No modals for delete confirmation.** Inline only.
- **No success toast for every save.** The updated data is the confirmation.
- **No infinite scroll in the ledger.** Pagination only.
- **No placeholder text as a substitute for labels.** Every input has a visible
  label above it. Placeholders provide examples, not labels.
- **No italic text** anywhere in the UI.
- **No disabled buttons without inline explanation** of why the action is
  unavailable.
- **No use of income/expense colors** for anything except financial sign.
