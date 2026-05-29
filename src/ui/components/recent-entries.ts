import type { Transaction, Account } from '../../types/storage';

export function RecentEntriesHtml(
  transactions: Transaction[],
  accountMap: Map<number, Account>,
): string {
  if (transactions.length === 0) return '<p class="text-light">No entries yet.</p>';

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 5);

  const rows = recent
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
              <td>${split.type === 'debit' ? split.amount.toFixed(2) : '<span class="amount-empty">&mdash;</span>'}</td>
              <td>${split.type === 'credit' ? split.amount.toFixed(2) : '<span class="amount-empty">&mdash;</span>'}</td>
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
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col">Account</th>
            <th scope="col">Debit</th>
            <th scope="col">Credit</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>`;
}

function esc(s: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}
