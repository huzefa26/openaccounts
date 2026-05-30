import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TransactionFormHtml, mountTransactionForm } from './transaction-form';
import type { Account } from '../../types/storage';

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    name: 'Test',
    type: 'asset',
    currency: 'USD',
    category: null,
    isPredefined: false,
    archived: false,
    parentId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const accounts: Account[] = [
  makeAccount({ id: 1, name: 'Cash', type: 'asset' }),
  makeAccount({ id: 2, name: 'Income', type: 'income' }),
  makeAccount({ id: 3, name: 'Rent', type: 'expense' }),
];

describe('TransactionFormHtml', () => {
  it('renders form structure', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('Date');
    expect(html).toContain('Description');
    expect(html).toContain('Save Entry');
  });

  it('renders From and To sections', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('>From<');
    expect(html).toContain('>To<');
  });

  it('renders 1 From row and 1 To row by default', () => {
    const html = TransactionFormHtml(accounts);
    const fromMatches = html.match(/from-row/g);
    const toMatches = html.match(/to-row/g);
    expect(fromMatches).toHaveLength(1);
    expect(toMatches).toHaveLength(1);
  });

  it('renders account options in selects', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('Cash');
    expect(html).toContain('Income');
    expect(html).toContain('Rent');
  });

  it('renders a date input with today default', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('type="date"');
    expect(html).toContain('id="tx-date"');
  });

  it('has no debit/credit radio buttons', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).not.toContain('Debit');
    expect(html).not.toContain('Credit');
    expect(html).not.toContain('split-type');
  });

  it('renders balance indicator', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('balance-indicator');
    expect(html).toContain('balance-text');
    expect(html).toContain('balance-status');
  });

  it('renders add buttons for both sections', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('id="add-from"');
    expect(html).toContain('id="add-to"');
    expect(html).toContain('+ Add from category');
    expect(html).toContain('+ Add to category');
  });
});

describe('mountTransactionForm', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = TransactionFormHtml(accounts);
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('adds a From row on "+ Add From" click', () => {
    mountTransactionForm(container, accounts, async () => {});
    container.querySelector<HTMLButtonElement>('#add-from')!.click();
    const rows = container.querySelectorAll('#from-container .split-row');
    expect(rows.length).toBe(2);
  });

  it('adds a To row on "+ Add To" click', () => {
    mountTransactionForm(container, accounts, async () => {});
    container.querySelector<HTMLButtonElement>('#add-to')!.click();
    const rows = container.querySelectorAll('#to-container .split-row');
    expect(rows.length).toBe(2);
  });

  it('does not remove last From row', () => {
    mountTransactionForm(container, accounts, async () => {});
    const removeBtn = container.querySelector<HTMLButtonElement>('#from-container .remove-split')!;
    expect(removeBtn.disabled).toBe(true);
    removeBtn.click();
    const rows = container.querySelectorAll('#from-container .split-row');
    expect(rows.length).toBe(1);
  });

  it('does not remove last To row', () => {
    mountTransactionForm(container, accounts, async () => {});
    const removeBtn = container.querySelector<HTMLButtonElement>('#to-container .remove-split')!;
    expect(removeBtn.disabled).toBe(true);
    removeBtn.click();
    const rows = container.querySelectorAll('#to-container .split-row');
    expect(rows.length).toBe(1);
  });

  it('removes a From row when >1', () => {
    mountTransactionForm(container, accounts, async () => {});
    container.querySelector<HTMLButtonElement>('#add-from')!.click();
    let rows = container.querySelectorAll('#from-container .split-row');
    expect(rows.length).toBe(2);
    const removeBtn = rows[1].querySelector<HTMLButtonElement>('.remove-split')!;
    expect(removeBtn.disabled).toBe(false);
    removeBtn.click();
    rows = container.querySelectorAll('#from-container .split-row');
    expect(rows.length).toBe(1);
  });

  it('removes a To row when >1', () => {
    mountTransactionForm(container, accounts, async () => {});
    container.querySelector<HTMLButtonElement>('#add-to')!.click();
    let rows = container.querySelectorAll('#to-container .split-row');
    expect(rows.length).toBe(2);
    const removeBtn = rows[1].querySelector<HTMLButtonElement>('.remove-split')!;
    expect(removeBtn.disabled).toBe(false);
    removeBtn.click();
    rows = container.querySelectorAll('#to-container .split-row');
    expect(rows.length).toBe(1);
  });

  it('calls onSave with correct data on valid form', async () => {
    let savedData: any = null;
    mountTransactionForm(container, accounts, async (data) => {
      savedData = data;
    });

    const fromSelects = container.querySelectorAll<HTMLSelectElement>('#from-container [data-split-account]');
    const toSelects = container.querySelectorAll<HTMLSelectElement>('#to-container [data-split-account]');
    const fromAmounts = container.querySelectorAll<HTMLInputElement>('#from-container [data-split-amount]');
    const toAmounts = container.querySelectorAll<HTMLInputElement>('#to-container [data-split-amount]');

    fromSelects[0].value = '1';
    toSelects[0].value = '2';
    fromAmounts[0].value = '100';
    toAmounts[0].value = '100';

    const desc = container.querySelector<HTMLInputElement>('#tx-desc')!;
    desc.value = 'Test transaction';

    container.querySelector<HTMLButtonElement>('#save-tx')!.click();

    expect(savedData).not.toBeNull();
    expect(savedData.description).toBe('Test transaction');
    expect(savedData.splits).toHaveLength(2);
    expect(savedData.splits[0]).toEqual({ accountId: 1, amount: 100, type: 'credit' });
    expect(savedData.splits[1]).toEqual({ accountId: 2, amount: 100, type: 'debit' });
  });

  it('does not call onSave when From sum != To sum', async () => {
    let savedData: any = null;
    mountTransactionForm(container, accounts, async (data) => {
      savedData = data;
    });

    const fromAmounts = container.querySelectorAll<HTMLInputElement>('#from-container [data-split-amount]');
    const toAmounts = container.querySelectorAll<HTMLInputElement>('#to-container [data-split-amount]');
    fromAmounts[0].value = '100';
    toAmounts[0].value = '50';

    container.querySelector<HTMLButtonElement>('#save-tx')!.click();
    expect(savedData).toBeNull();
  });

  it('does not call onSave with empty description', async () => {
    let savedData: any = null;
    mountTransactionForm(container, accounts, async (data) => {
      savedData = data;
    });

    const fromSelects = container.querySelectorAll<HTMLSelectElement>('#from-container [data-split-account]');
    const toSelects = container.querySelectorAll<HTMLSelectElement>('#to-container [data-split-account]');
    fromSelects[0].value = '1';
    toSelects[0].value = '2';

    container.querySelector<HTMLButtonElement>('#save-tx')!.click();
    expect(savedData).toBeNull();
  });

  it('updateBalance shows balanced when From = To', () => {
    mountTransactionForm(container, accounts, async () => {});

    const fromAmounts = container.querySelectorAll<HTMLInputElement>('#from-container [data-split-amount]');
    const toAmounts = container.querySelectorAll<HTMLInputElement>('#to-container [data-split-amount]');
    fromAmounts[0].value = '100';
    toAmounts[0].value = '100';

    fromAmounts[0].dispatchEvent(new Event('input', { bubbles: true }));

    const indicator = container.querySelector('#balance-indicator')!;
    expect(indicator.classList.contains('balance-equal')).toBe(true);
    expect(container.querySelector('#balance-status')!.textContent).toBe('✓');
  });

  it('updateBalance shows unbalanced when From != To', () => {
    mountTransactionForm(container, accounts, async () => {});

    const fromAmounts = container.querySelectorAll<HTMLInputElement>('#from-container [data-split-amount]');
    fromAmounts[0].value = '100';
    fromAmounts[0].dispatchEvent(new Event('input', { bubbles: true }));

    const indicator = container.querySelector('#balance-indicator')!;
    expect(indicator.classList.contains('balance-unequal')).toBe(true);
    expect(container.querySelector('#balance-status')!.textContent).toBe('✗');
  });

  it('updateBalance shows zero state initially', () => {
    mountTransactionForm(container, accounts, async () => {});

    const indicator = container.querySelector('#balance-indicator')!;
    expect(indicator.classList.contains('balance-zero')).toBe(true);
    expect(container.querySelector('#balance-status')!.textContent).toBe('');
  });
});
