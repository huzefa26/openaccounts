import type { Transaction, Account } from '../../types/storage';

export function RecentEntriesHtml(
  transactions: Transaction[],
  _accountMap: Map<number, Account>,
): string {
  if (transactions.length === 0) return '<p class="text-light">No entries yet.</p>';

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 5);

  return `
    <div class="table">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          ${recent
            .map(
              (tx) => `
            <tr>
              <td>${esc(tx.date)}</td>
              <td>${esc(tx.description)}</td>
              <td>$${tx.splits.reduce((s, x) => s + x.amount, 0).toFixed(2)}</td>
            </tr>`,
            )
            .join('')}
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
