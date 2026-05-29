import { describe, it, expect } from 'vitest';
import { RecentEntriesHtml } from './recent-entries';
import type { Transaction, Account } from '../../types/storage';

const accountMap = new Map<number, Account>([
  [1, { id: 1, name: 'Cash', type: 'asset', currency: 'USD', category: null, isPredefined: false, archived: false, parentId: null, createdAt: '', updatedAt: '' }],
  [2, { id: 2, name: 'Income', type: 'income', currency: 'USD', category: null, isPredefined: false, archived: false, parentId: null, createdAt: '', updatedAt: '' }],
]);

function makeTx(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 1,
    date: '2026-05-29',
    description: 'Test',
    splits: [
      { accountId: 1, amount: 100, type: 'debit', currency: 'USD' },
      { accountId: 2, amount: 100, type: 'credit', currency: 'USD' },
    ],
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

describe('RecentEntriesHtml', () => {
  it('shows empty state when no transactions', () => {
    const html = RecentEntriesHtml([], accountMap);
    expect(html).toContain('No entries yet');
  });

  it('renders table with transactions sorted by date desc', () => {
    const t1 = makeTx({ id: 1, date: '2026-01-01', description: 'First' });
    const t2 = makeTx({ id: 2, date: '2026-06-01', description: 'Second' });
    const html = RecentEntriesHtml([t1, t2], accountMap);
    expect(html.indexOf('Second')).toBeLessThan(html.indexOf('First'));
  });

  it('limits to 5 entries', () => {
    const txs = Array.from({ length: 10 }, (_, i) =>
      makeTx({ id: i, date: `2026-01-${String(i + 1).padStart(2, '0')}`, description: `Tx ${i}` }),
    );
    const html = RecentEntriesHtml(txs, accountMap);
    const matches = html.match(/<tr>/g);
    expect(matches).toHaveLength(6); // 5 data rows + 1 header
  });

  it('shows total amount (sum of debits or credits)', () => {
    const tx = makeTx({
      splits: [
        { accountId: 1, amount: 200, type: 'debit', currency: 'USD' },
        { accountId: 2, amount: 200, type: 'credit', currency: 'USD' },
      ],
    });
    const html = RecentEntriesHtml([tx], accountMap);
    expect(html).toContain('$400.00');
  });

  it('escapes HTML in description', () => {
    const tx = makeTx({ description: '<b>test</b>' });
    const html = RecentEntriesHtml([tx], accountMap);
    expect(html).toContain('&lt;b&gt;test&lt;/b&gt;');
    expect(html).not.toContain('<b>');
  });
});
