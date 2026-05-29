import type { Account } from '../../types/storage';

export interface TransactionFormData {
  date: string;
  description: string;
  splits: Array<{
    accountId: number;
    amount: number;
    type: 'debit' | 'credit';
  }>;
}

export function TransactionFormHtml(accounts: Account[]): string {
  return `
    <article class="card" id="tx-form">
      <header>
        <h2>New Transaction</h2>
      </header>

      <label data-field>
        Date
        <input type="date" id="tx-date" value="${todayISO()}" />
      </label>

      <label data-field>
        Description
        <input type="text" id="tx-desc" placeholder="e.g. Grocery shopping" />
      </label>

      <h3>Entries</h3>
      <div id="splits-container">
        ${splitRowHtml(accounts, 0)}
        ${splitRowHtml(accounts, 1)}
      </div>

      <button type="button" class="outline" id="add-split">+ Add entry</button>

      <p id="balance-indicator">Balance: <span id="balance-text">0.00 D / 0.00 C</span> <span id="balance-status">&#10003;</span></p>

      <footer class="hstack justify-end">
        <button id="save-tx">Save Transaction</button>
      </footer>
    </article>`;
}

function splitRowHtml(accounts: Account[], idx: number): string {
  return `
    <div class="split-row" data-idx="${idx}">
      <select data-split-account required>
        <option value="">— Select account —</option>
        ${accounts.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
      <input type="number" data-split-amount placeholder="0.00" step="0.01" min="0" required />
      <label><input type="radio" name="split-type-${idx}" value="debit" checked /> Debit</label>
      <label><input type="radio" name="split-type-${idx}" value="credit" /> Credit</label>
      <button type="button" class="outline remove-split" ${idx < 2 ? 'disabled' : ''} title="Remove entry">&minus;</button>
    </div>`;
}

export function mountTransactionForm(
  el: HTMLElement,
  accounts: Account[],
  onSave: (data: TransactionFormData) => Promise<void>,
): void {
  const form = el.querySelector('#tx-form');
  if (!form) return;

  let splitCount = 2;

  const updateBalance = (): void => {
    const rows = form.querySelectorAll<HTMLElement>('.split-row');
    let debits = 0;
    let credits = 0;
    rows.forEach((row) => {
      const amount = parseFloat(
        (row.querySelector<HTMLInputElement>('[data-split-amount]')?.value ?? '0'),
      );
      if (isNaN(amount)) return;
      const type = row.querySelector<HTMLInputElement>(
        'input[type="radio"]:checked',
      )?.value;
      if (type === 'debit') debits += amount;
      else credits += amount;
    });

    const text = form.querySelector('#balance-text')!;
    const status = form.querySelector('#balance-status')!;
    const diff = Math.abs(debits - credits);
    if (diff < 0.001) {
      text.textContent = `${debits.toFixed(2)} D / ${credits.toFixed(2)} C`;
      status.textContent = '✓';
      status.className = 'balanced';
    } else {
      text.textContent = `${debits.toFixed(2)} D / ${credits.toFixed(2)} C (diff: ${diff.toFixed(2)})`;
      status.textContent = '✗';
      status.className = 'unbalanced';
    }
  };

  const onInput = (): void => updateBalance();

  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);

  form.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.matches('#add-split')) {
      const container = form.querySelector('#splits-container')!;
      container.insertAdjacentHTML('beforeend', splitRowHtml(accounts, splitCount));
      splitCount++;
      updateBalance();
      return;
    }

    if (target.matches('.remove-split')) {
      const row = target.closest<HTMLElement>('.split-row');
      if (!row) return;
      const rows = form.querySelectorAll<HTMLElement>('.split-row');
      if (rows.length <= 2) return;
      row.remove();
      splitCount--;
      updateBalance();
      return;
    }

    if (target.matches('#save-tx') || target.closest('#save-tx')) {
      const rows = form.querySelectorAll<HTMLElement>('.split-row');
      const splits: TransactionFormData['splits'] = [];

      for (const row of rows) {
        const accountId = parseInt(
          (row.querySelector<HTMLSelectElement>('[data-split-account]')?.value ?? ''),
        );
        const amount = parseFloat(
          (row.querySelector<HTMLInputElement>('[data-split-amount]')?.value ?? '0'),
        );
        const type = row.querySelector<HTMLInputElement>(
          'input[type="radio"]:checked',
        )?.value as 'debit' | 'credit';

        if (isNaN(accountId) || isNaN(amount) || amount <= 0) {
          return;
        }
        splits.push({ accountId, amount, type });
      }

      if (splits.length < 2) return;

      const debits = splits.filter((s) => s.type === 'debit').reduce((s, x) => s + x.amount, 0);
      const credits = splits.filter((s) => s.type === 'credit').reduce((s, x) => s + x.amount, 0);
      if (Math.abs(debits - credits) > 0.001) return;

      const date = (form.querySelector<HTMLInputElement>('#tx-date')?.value ?? '');
      const description = (form.querySelector<HTMLInputElement>('#tx-desc')?.value ?? '').trim();
      if (!date || !description) return;

      onSave({ date, description, splits });
      return;
    }
  });
}

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
