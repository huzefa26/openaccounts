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
    <div id="tx-form">
      <div class="home-form-row hstack gap-3">
        <div class="form-group" style="flex: 0 0 160px;">
          <label class="form-label" for="tx-date">Date</label>
          <input type="date" id="tx-date" class="input" value="${todayISO()}" />
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="form-label" for="tx-desc">Description</label>
          <input type="text" id="tx-desc" class="input" placeholder="e.g. Grocery shopping" />
        </div>
      </div>

      <div class="home-form-row hstack gap-3">
        <div class="form-group" style="flex: 1;">
          <label class="form-label">From</label>
          <div id="from-container">
            ${splitRowHtml(accounts, 'from', 0)}
          </div>
          <button type="button" class="add-link" id="add-from">+ Add from category</button>
        </div>
        <div class="form-group" style="flex: 1;">
          <label class="form-label">To</label>
          <div id="to-container">
            ${splitRowHtml(accounts, 'to', 1)}
          </div>
          <button type="button" class="add-link" id="add-to">+ Add to category</button>
        </div>
      </div>

      <div class="home-form-row">
        <div class="form-group">
          <label class="form-label" for="tx-notes">Notes (optional)</label>
          <input type="text" id="tx-notes" class="input" placeholder="Add a note..." />
        </div>
      </div>

      <p id="balance-indicator" class="balance-zero">
        <span id="balance-text">$0.00 From = $0.00 To</span>
        <span id="balance-status"></span>
      </p>

      <div class="hstack justify-end gap-2">
        <button type="button" id="reset-tx" class="outline">Reset</button>
        <button id="save-tx">Save Entry</button>
      </div>
    </div>`;
}

function splitRowHtml(accounts: Account[], side: 'from' | 'to', idx: number): string {
  return `
    <div class="split-row ${side}-row hstack gap-2" data-idx="${idx}">
      <select data-split-account class="input" required style="flex:1;">
        <option value="">— Select category —</option>
        ${accounts.map((a) => `<option value="${a.id}">${a.name}</option>`).join('')}
      </select>
      <span class="split-amount-wrap">
        <span class="currency-prefix">$</span>
        <input type="number" data-split-amount class="input" placeholder="0.00" step="0.01" min="0" required style="border:none;width:90px;text-align:right;" />
      </span>
      <button type="button" class="remove-split" disabled title="Remove entry">&minus;</button>
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
    const indicator = form.querySelector('#balance-indicator')!;
    const diff = Math.abs(fromTotal - toTotal);

    indicator.className = '';
    if (fromTotal === 0 && toTotal === 0) {
      indicator.classList.add('balance-zero');
      text.textContent = '$0.00 From = $0.00 To';
      status.textContent = '';
    } else if (diff < 0.001) {
      indicator.classList.add('balance-equal');
      text.textContent = `$${fromTotal.toFixed(2)} From = $${toTotal.toFixed(2)} To`;
      status.textContent = '✓';
    } else {
      indicator.classList.add('balance-unequal');
      text.textContent = `$${fromTotal.toFixed(2)} From ≠ $${toTotal.toFixed(2)} To (diff: $${diff.toFixed(2)})`;
      status.textContent = '✗';
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

    if (target.matches('#reset-tx')) {
      form.querySelectorAll<HTMLInputElement>('#tx-desc, #tx-notes').forEach((el) => el.value = '');
      const dateInput = form.querySelector<HTMLInputElement>('#tx-date');
      if (dateInput) dateInput.value = todayISO();
      form.querySelectorAll<HTMLInputElement>('[data-split-amount]').forEach((el) => el.value = '');
      form.querySelectorAll<HTMLSelectElement>('[data-split-account]').forEach((el) => el.selectedIndex = 0);
      // Reset balance indicator
      const text = form.querySelector('#balance-text')!;
      const status = form.querySelector('#balance-status')!;
      const indicator = form.querySelector('#balance-indicator')!;
      indicator.className = 'balance-zero';
      text.textContent = '$0.00 From = $0.00 To';
      status.textContent = '';
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

      let debits = 0;
      let credits = 0;
      for (const s of splits) {
        if (s.type === 'debit') debits += s.amount;
        else credits += s.amount;
      }
      if (Math.abs(debits - credits) >= 0.001) return;

      const date = (form.querySelector<HTMLInputElement>('#tx-date')?.value ?? '').trim();
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
