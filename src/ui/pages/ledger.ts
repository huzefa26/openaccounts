import type { Transaction, Account } from '../../types/storage';

export function LedgerHtml(
  transactions: Transaction[],
  accountMap: Map<number, Account>,
): string {
  if (transactions.length === 0) {
    return '<p>No entries yet.</p>';
  }

  const sorted = [...transactions].sort(
    (a, b) => b.date.localeCompare(a.date),
  );

  const rows = sorted
    .map((tx) => {
      return tx.splits
        .map((split, j) => {
          const acct = accountMap.get(split.accountId);
          const acctName = acct?.name ?? `[id:${split.accountId}]`;
          return `
            <tr>
              <td>${j === 0 ? esc(tx.date) : ''}</td>
              <td>${j === 0 ? esc(tx.description) : ''}</td>
              <td>${esc(acctName)}</td>
              <td>${split.type === 'debit' ? split.amount.toFixed(2) : ''}</td>
              <td>${split.type === 'credit' ? split.amount.toFixed(2) : ''}</td>
            </tr>`;
        })
        .join('');
    })
    .join('');

  return `
    <div class="table">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Account</th>
            <th>Debit</th>
            <th>Credit</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
}

function esc(s: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}
