import type { Transaction, Account } from '../../types/storage';

export function RecentEntriesHtml(
  transactions: Transaction[],
  _accountMap: Map<number, Account>,
): string {
  if (transactions.length === 0) {
    return '<div class="empty-state"><h3>No transactions yet</h3><p>Record your first transaction above.</p></div>';
  }

  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 8);

  return `
    <table class="ledger-table">
      <thead>
        <tr>
          <th scope="col" class="col-date">Date</th>
          <th scope="col" class="col-description">Description</th>
          <th scope="col" class="col-debit amount">Debit</th>
          <th scope="col" class="col-credit amount">Credit</th>
        </tr>
      </thead>
      <tbody>
        ${recent
          .map(
            (tx) => `
          <tr>
            <td class="cell-date">${esc(tx.date)}</td>
            <td class="cell-description">${esc(tx.description)}</td>
            <td class="cell-debit">${debitSum(tx)}</td>
            <td class="cell-credit">${creditSum(tx)}</td>
          </tr>`,
          )
          .join('')}
      </tbody>
    </table>`;
}

function debitSum(tx: Transaction): string {
  const total = tx.splits
    .filter((s) => s.type === 'debit')
    .reduce((sum, s) => sum + s.amount, 0);
  return total > 0 ? total.toFixed(2) : '';
}

function creditSum(tx: Transaction): string {
  const total = tx.splits
    .filter((s) => s.type === 'credit')
    .reduce((sum, s) => sum + s.amount, 0);
  return total > 0 ? total.toFixed(2) : '';
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
