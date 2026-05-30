import type { Transaction } from '../../types/storage';

export function RecentEntriesHtml(
  transactions: Transaction[],
  _accountMap: Map<number, unknown>,
): string {
  if (transactions.length === 0) return '<p class="text-light">No entries yet.</p>';

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 5);

  const rows = recent
    .map((tx) => {
      const total = tx.splits
        .filter((s) => s.type === 'debit')
        .reduce((s, split) => s + split.amount, 0);
      return `
        <tr>
          <td>${esc(tx.date)}</td>
          <td>${esc(tx.description)}</td>
          <td class="numeric">${total.toFixed(2)}</td>
        </tr>`;
    })
    .join('');

  return `
    <div class="table">
      <table>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Description</th>
            <th scope="col" class="amount">Amount</th>
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
