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

      <h3>From</h3>
      <div id="from-container">
        ${splitRowHtml(accounts, 'from', 0)}
      </div>
      <button type="button" class="outline" id="add-from">+ Add From</button>

      <h3>To</h3>
      <div id="to-container">
        ${splitRowHtml(accounts, 'to', 1)}
      </div>
      <button type="button" class="outline" id="add-to">+ Add To</button>

      <p id="balance-indicator">
        <span id="balance-status">&#10003;</span>
        <span id="balance-text">$0.00 From = $0.00 To</span>
      </p>

      <footer class="hstack justify-end">
        <button id="save-tx">Save Transaction</button>
      </footer>
    </article>`;
}

function splitRowHtml(accounts: Account[], side: 'from' | 'to', idx: number): string {
  return `
    <div class="split-row ${side}-row" data-idx="${idx}">
      <select data-split-account required>
        <option value="">— Select account —</option>
        ${accounts.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
      <input type="number" data-split-amount placeholder="0.00" step="0.01" min="0" required />
      <button type="button" class="outline remove-split" disabled title="Remove entry">&minus;</button>
    </div>`;
}

export function mountTransactionForm(
  el: HTMLElement,
  accounts: Account[],
  onSave: (data: TransactionFormData) => Promise<void>,
): void {
  const form = el.querySelector('#tx-form');
  if (!form) return;

  let fromCount = 1;
  let toCount = 1;

  const updateBalance = (): void => {
    const fromRows = form.querySelectorAll<HTMLElement>('#from-container .split-row');
    const toRows = form.querySelectorAll<HTMLElement>('#to-container .split-row');
    let fromTotal = 0;
    let toTotal = 0;

    fromRows.forEach((row) => {
      const amount = parseFloat(
        (row.querySelector<HTMLInputElement>('[data-split-amount]')?.value ?? '0'),
      );
      if (!isNaN(amount)) fromTotal += amount;
    });
    toRows.forEach((row) => {
      const amount = parseFloat(
        (row.querySelector<HTMLInputElement>('[data-split-amount]')?.value ?? '0'),
      );
      if (!isNaN(amount)) toTotal += amount;
    });

    const text = form.querySelector('#balance-text')!;
    const status = form.querySelector('#balance-status')!;
    const diff = Math.abs(fromTotal - toTotal);
    if (diff < 0.001) {
      text.textContent = `$${fromTotal.toFixed(2)} From = $${toTotal.toFixed(2)} To`;
      status.textContent = '✓';
      status.className = 'balanced';
    } else {
      text.textContent = `$${fromTotal.toFixed(2)} From ≠ $${toTotal.toFixed(2)} To (diff: $${diff.toFixed(2)})`;
      status.textContent = '✗';
      status.className = 'unbalanced';
    }
  };

  const onInput = (): void => updateBalance();

  const updateRemoveButtons = (): void => {
    ['#from-container', '#to-container'].forEach((sel) => {
      const container = form.querySelector(sel)!;
      const rows = container.querySelectorAll<HTMLElement>('.split-row');
      container.querySelectorAll<HTMLButtonElement>('.remove-split').forEach((btn) => {
        btn.disabled = rows.length <= 1;
      });
    });
  };

  form.addEventListener('input', onInput);
  form.addEventListener('change', onInput);
  updateRemoveButtons();

  form.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    if (target.matches('#add-from')) {
      const container = form.querySelector('#from-container')!;
      container.insertAdjacentHTML('beforeend', splitRowHtml(accounts, 'from', fromCount));
      fromCount++;
      updateBalance();
      updateRemoveButtons();
      return;
    }

    if (target.matches('#add-to')) {
      const container = form.querySelector('#to-container')!;
      container.insertAdjacentHTML('beforeend', splitRowHtml(accounts, 'to', toCount));
      toCount++;
      updateBalance();
      updateRemoveButtons();
      return;
    }

    if (target.matches('.remove-split')) {
      const row = target.closest<HTMLElement>('.split-row');
      if (!row) return;
      const isFrom = row.classList.contains('from-row');
      const container = row.closest<HTMLElement>('#from-container, #to-container')!;
      const rows = container.querySelectorAll<HTMLElement>('.split-row');
      if (rows.length <= 1) return;
      row.remove();
      if (isFrom) fromCount--;
      else toCount--;
      updateBalance();
      updateRemoveButtons();
      return;
    }

    if (target.matches('#save-tx') || target.closest('#save-tx')) {
      const fromRows = form.querySelectorAll<HTMLElement>('#from-container .split-row');
      const toRows = form.querySelectorAll<HTMLElement>('#to-container .split-row');
      const splits: TransactionFormData['splits'] = [];

      for (const row of fromRows) {
        const accountId = parseInt(
          (row.querySelector<HTMLSelectElement>('[data-split-account]')?.value ?? ''),
        );
        const amount = parseFloat(
          (row.querySelector<HTMLInputElement>('[data-split-amount]')?.value ?? '0'),
        );
        if (isNaN(accountId) || isNaN(amount) || amount <= 0) return;
        splits.push({ accountId, amount, type: 'credit' });
      }

      for (const row of toRows) {
        const accountId = parseInt(
          (row.querySelector<HTMLSelectElement>('[data-split-account]')?.value ?? ''),
        );
        const amount = parseFloat(
          (row.querySelector<HTMLInputElement>('[data-split-amount]')?.value ?? '0'),
        );
        if (isNaN(accountId) || isNaN(amount) || amount <= 0) return;
        splits.push({ accountId, amount, type: 'debit' });
      }

      if (splits.length < 2) return;

      const debits = splits.filter((s) => s.type === 'debit').reduce((s, x) => s + x.amount, 0);
      const credits = splits.filter((s) => s.type === 'credit').reduce((s, x) => s + x.amount, 0);
      if (Math.abs(debits - credits) > 0.001) return;

      const date = (form.querySelector<HTMLInputElement>('#tx-date')?.value ?? '');
      const description = (form.querySelector<HTMLInputElement>('#tx-desc')?.value ?? '').trim();
      if (!date || !description) return;

      onSave({ date, description, splits });
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
