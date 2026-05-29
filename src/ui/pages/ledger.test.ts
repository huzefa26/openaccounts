import { describe, it, expect } from 'vitest';
import { LedgerHtml } from './ledger';
import type { Transaction, Account } from '../../types/storage';

const accounts: Account[] = [
  {
    id: 1, name: 'Cash', type: 'asset', currency: 'USD',
    category: null, isPredefined: false, archived: false,
    parentId: null, createdAt: '', updatedAt: '',
  },
  {
    id: 2, name: 'Income', type: 'income', currency: 'USD',
    category: null, isPredefined: false, archived: false,
    parentId: null, createdAt: '', updatedAt: '',
  },
  {
    id: 3, name: 'Rent', type: 'expense', currency: 'USD',
    category: null, isPredefined: false, archived: false,
    parentId: null, createdAt: '', updatedAt: '',
  },
];

const accountMap = new Map(accounts.map((a) => [a.id!, a]));

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    date: '2026-05-29',
    description: 'Test transaction',
    splits: [
      { accountId: 1, amount: 100, type: 'debit', currency: 'USD' },
      { accountId: 2, amount: 100, type: 'credit', currency: 'USD' },
    ],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('LedgerHtml', () => {
  it('shows empty state when no transactions', () => {
    const html = LedgerHtml([], accountMap);
    expect(html).toContain('No transactions found');
    expect(html).not.toContain('ledger-table');
  });

  it('renders table with thead and tbody', () => {
    const html = LedgerHtml([makeTx()], accountMap);
    expect(html).toContain('ledger-table');
    expect(html).toContain('<thead>');
    expect(html).toContain('<tbody>');
    expect(html).toContain('col-date');
    expect(html).toContain('col-description');
    expect(html).toContain('col-account');
    expect(html).toContain('col-debit');
    expect(html).toContain('col-credit');
  });

  it('renders transaction date and description on first split', () => {
    const html = LedgerHtml([makeTx()], accountMap);
    expect(html).toContain('2026-05-29');
    expect(html).toContain('Test transaction');
  });

  it('renders account names from map', () => {
    const html = LedgerHtml([makeTx()], accountMap);
    expect(html).toContain('Cash');
    expect(html).toContain('Income');
  });

  it('renders debit and credit amounts in correct columns', () => {
    const html = LedgerHtml([makeTx()], accountMap);
    expect(html).toContain('100.00');
    const debitRow = html.indexOf('Cash');
    const creditRow = html.indexOf('Income');
    expect(debitRow).toBeLessThan(creditRow);
  });

  it('shows unknown account name for missing account IDs', () => {
    const tx = makeTx({
      splits: [
        { accountId: 999, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: 2, amount: 100, type: 'credit', currency: 'USD' },
      ],
    });
    const html = LedgerHtml([tx], accountMap);
    expect(html).toContain('[id:999]');
  });

  it('sorts transactions by date descending', () => {
    const t1 = makeTx({ id: 1, date: '2026-01-01', description: 'First' });
    const t2 = makeTx({ id: 2, date: '2026-06-01', description: 'Second' });
    const t3 = makeTx({ id: 3, date: '2026-03-01', description: 'Third' });

    const html = LedgerHtml([t1, t2, t3], accountMap);
    const firstIdx = html.indexOf('First');
    const secondIdx = html.indexOf('Second');
    const thirdIdx = html.indexOf('Third');

    // Second (Jun) should come first, then Third (Mar), then First (Jan)
    expect(secondIdx).toBeLessThan(thirdIdx);
    expect(thirdIdx).toBeLessThan(firstIdx);
  });

  it('escapes HTML in description', () => {
    const tx = makeTx({ description: 'Grocery <script>alert("xss")</script>' });
    const html = LedgerHtml([tx], accountMap);
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('renders multiple splits for a single transaction', () => {
    const tx = makeTx({
      splits: [
        { accountId: 1, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: 2, amount: 80, type: 'credit', currency: 'USD' },
        { accountId: 3, amount: 20, type: 'credit', currency: 'USD' },
      ],
    });
    const html = LedgerHtml([tx], accountMap);
    expect(html).toContain('Cash');
    expect(html).toContain('Income');
    expect(html).toContain('Rent');
  });

  it('only shows date/description on first split row', () => {
    const tx = makeTx({
      splits: [
        { accountId: 1, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: 2, amount: 80, type: 'credit', currency: 'USD' },
        { accountId: 3, amount: 20, type: 'credit', currency: 'USD' },
      ],
    });
    const html = LedgerHtml([tx], accountMap);
    // Date and description should appear only once
    const dateMatches = html.match(/2026-05-29/g);
    expect(dateMatches).toHaveLength(1);
  });
});
