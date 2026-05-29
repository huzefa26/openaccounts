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
    expect(html).toContain('New Transaction');
    expect(html).toContain('Date');
    expect(html).toContain('Description');
    expect(html).toContain('Entries');
    expect(html).toContain('Save Transaction');
  });

  it('renders 2 split rows by default', () => {
    const html = TransactionFormHtml(accounts);
    const matches = html.match(/split-row/g);
    expect(matches).toHaveLength(2);
  });

  it('renders account options in selects', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('Cash');
    expect(html).toContain('Income');
    expect(html).toContain('Rent');
  });

  it('disables remove button on first 2 rows', () => {
    const html = TransactionFormHtml(accounts);
    const disabledMatches = html.match(/disabled/g);
    expect(disabledMatches).toHaveLength(2);
  });

  it('renders a date input with today default', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('type="date"');
    expect(html).toContain('id="tx-date"');
  });

  it('renders debit/credit radios for each split', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('Debit');
    expect(html).toContain('Credit');
    expect(html).toContain('split-type-0');
    expect(html).toContain('split-type-1');
  });

  it('renders balance indicator', () => {
    const html = TransactionFormHtml(accounts);
    expect(html).toContain('balance-indicator');
    expect(html).toContain('balance-text');
    expect(html).toContain('balance-status');
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

  it('adds a split row on "+ Add entry" click', () => {
    mountTransactionForm(container, accounts, async () => {});
    const btn = container.querySelector<HTMLButtonElement>('#add-split')!;
    btn.click();
    const rows = container.querySelectorAll('.split-row');
    expect(rows.length).toBe(3);
  });

  it('does not remove split row when only 2 remain', () => {
    mountTransactionForm(container, accounts, async () => {});
    const removeBtn = container.querySelector<HTMLButtonElement>('.remove-split')!;

    expect(removeBtn.disabled).toBe(true);
    removeBtn.click();
    const rowsAfter = container.querySelectorAll('.split-row');
    expect(rowsAfter.length).toBe(2);
  });

  it('removes a split row when >2 and remove clicked', () => {
    mountTransactionForm(container, accounts, async () => {});
    container.querySelector<HTMLButtonElement>('#add-split')!.click();
    let rows = container.querySelectorAll('.split-row');
    expect(rows.length).toBe(3);

    const removeBtn = rows[2].querySelector<HTMLButtonElement>('.remove-split')!;
    expect(removeBtn.disabled).toBe(false);
    removeBtn.click();
    rows = container.querySelectorAll('.split-row');
    expect(rows.length).toBe(2);
  });

  it('calls onSave with correct data on valid form', async () => {
    let savedData: any = null;
    mountTransactionForm(container, accounts, async (data) => {
      savedData = data;
    });

    const selects = container.querySelectorAll<HTMLSelectElement>('[data-split-account]');
    const amounts = container.querySelectorAll<HTMLInputElement>('[data-split-amount]');
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');

    selects[0].value = '1';
    selects[1].value = '2';
    amounts[0].value = '100';
    amounts[1].value = '100';
    radios[3].checked = true; // row 0: debit (0), row 1: credit (3)

    const desc = container.querySelector<HTMLInputElement>('#tx-desc')!;
    desc.value = 'Test transaction';

    const saveBtn = container.querySelector<HTMLButtonElement>('#save-tx')!;
    saveBtn.click();

    expect(savedData).not.toBeNull();
    expect(savedData.description).toBe('Test transaction');
    expect(savedData.splits).toHaveLength(2);
    expect(savedData.splits[0].accountId).toBe(1);
    expect(savedData.splits[0].amount).toBe(100);
    expect(savedData.splits[0].type).toBe('debit');
    expect(savedData.splits[1].accountId).toBe(2);
    expect(savedData.splits[1].amount).toBe(100);
    expect(savedData.splits[1].type).toBe('credit');
  });

  it('does not call onSave when debits != credits', async () => {
    let savedData: any = null;
    mountTransactionForm(container, accounts, async (data) => {
      savedData = data;
    });

    const selects = container.querySelectorAll<HTMLSelectElement>('[data-split-account]');
    const amounts = container.querySelectorAll<HTMLInputElement>('[data-split-amount]');

    selects[0].value = '1';
    selects[1].value = '2';
    amounts[0].value = '100';
    amounts[1].value = '50';

    const saveBtn = container.querySelector<HTMLButtonElement>('#save-tx')!;
    saveBtn.click();

    expect(savedData).toBeNull();
  });

  it('does not call onSave with empty description', async () => {
    let savedData: any = null;
    mountTransactionForm(container, accounts, async (data) => {
      savedData = data;
    });

    const selects = container.querySelectorAll<HTMLSelectElement>('[data-split-account]');
    const amounts = container.querySelectorAll<HTMLInputElement>('[data-split-amount]');

    selects[0].value = '1';
    selects[1].value = '2';
    amounts[0].value = '100';
    amounts[1].value = '100';

    const saveBtn = container.querySelector<HTMLButtonElement>('#save-tx')!;
    saveBtn.click();

    expect(savedData).toBeNull();
  });

  it('updateBalance shows balanced when debits equal credits', () => {
    mountTransactionForm(container, accounts, async () => {});

    const amounts = container.querySelectorAll<HTMLInputElement>('[data-split-amount]');
    const radios = container.querySelectorAll<HTMLInputElement>('input[type="radio"]');
    amounts[0].value = '100';
    amounts[1].value = '100';
    radios[3].checked = true; // row 0: debit (0), row 1: credit (3)

    const inputEvent = new Event('input', { bubbles: true });
    amounts[0].dispatchEvent(inputEvent);

    const status = container.querySelector('#balance-status')!;
    expect(status.textContent).toBe('✓');
    expect(status.className).toBe('balanced');
  });

  it('updateBalance shows unbalanced when debits != credits', () => {
    mountTransactionForm(container, accounts, async () => {});

    const amounts = container.querySelectorAll<HTMLInputElement>('[data-split-amount]');
    amounts[0].value = '100';
    amounts[1].value = '50';

    const inputEvent = new Event('input', { bubbles: true });
    amounts[0].dispatchEvent(inputEvent);

    const status = container.querySelector('#balance-status')!;
    expect(status.textContent).toBe('✗');
    expect(status.className).toBe('unbalanced');
  });
});
