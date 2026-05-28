import { describe, it, expect } from 'vitest';
import { AccountsPage } from './accounts';
import type { Account } from '../types/storage';

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    name: 'Test',
    type: 'asset',
    currency: 'USD',
    category: null,
    isPredefined: true,
    archived: false,
    parentId: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('AccountsPage', () => {
  it('renders header', () => {
    const html = AccountsPage([]);
    expect(html).toContain('OpenAccounts');
    expect(html).toContain('Chart of Accounts');
  });

  it('groups accounts by type', () => {
    const accounts = [
      makeAccount({ name: 'Cash', type: 'asset' }),
      makeAccount({ name: 'Loan', type: 'liability' }),
      makeAccount({ name: 'Income', type: 'income' }),
    ];
    const html = AccountsPage(accounts);
    expect(html).toContain('Assets');
    expect(html).toContain('Liabilities');
    expect(html).toContain('Income');
    expect(html).toContain('Cash');
    expect(html).toContain('Loan');
  });

  it('renders types in canonical order', () => {
    const accounts = [
      makeAccount({ name: 'X', type: 'expense' }),
      makeAccount({ name: 'Y', type: 'asset' }),
    ];
    const html = AccountsPage(accounts);
    const assetIdx = html.indexOf('Assets');
    const expenseIdx = html.indexOf('Expenses');
    expect(assetIdx).toBeLessThan(expenseIdx);
  });

  it('omits type sections with no accounts', () => {
    const html = AccountsPage([
      makeAccount({ name: 'Cash', type: 'asset' }),
    ]);
    expect(html).toContain('Assets');
    expect(html).not.toContain('Liabilities');
    expect(html).not.toContain('Equity');
    expect(html).not.toContain('Income');
    expect(html).not.toContain('Expenses');
  });
});
