import type { Transaction, Account } from '../../types/storage';

const PAGE_SIZE = 20;

interface SplitRow {
  date: string;
  description: string;
  accountId: number;
  accountName: string;
  amount: number;
  type: 'debit' | 'credit';
  balanceAfter: number;
  isFirstSplit: boolean;
}

export function LedgerHtml(
  transactions: Transaction[],
  accountMap: Map<number, Account>,
  page = 1,
): string {
  if (transactions.length === 0) {
    return '<p class="text-light">No entries yet.</p>';
  }

  const rows = buildSplitRows(transactions, accountMap);
  return renderPage(rows, page);
}

export function mountLedgerPage(
  el: HTMLElement,
  transactions: Transaction[],
  accountMap: Map<number, Account>,
): void {
  el.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>(
      '.pagination button[data-page]',
    );
    if (!btn) return;
    const page = Number(btn.getAttribute('data-page'));
    if (page < 1) return;
    const rows = buildSplitRows(transactions, accountMap);
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    if (page > totalPages) return;
    const section = el.querySelector('.table');
    if (section) {
      section.outerHTML = renderPage(rows, page);
    }
  });
}

function buildSplitRows(
  transactions: Transaction[],
  accountMap: Map<number, Account>,
): SplitRow[] {
  const ascending = [...transactions].sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const balances = new Map<number, number>();
  const allRows: SplitRow[] = [];

  for (const tx of ascending) {
    for (let j = 0; j < tx.splits.length; j++) {
      const split = tx.splits[j];
      const acct = accountMap.get(split.accountId);
      const acctName = acct?.name ?? `[id:${split.accountId}]`;
      const prev = balances.get(split.accountId) ?? 0;
      const balanceAfter =
        split.type === 'debit' ? prev + split.amount : prev - split.amount;
      balances.set(split.accountId, balanceAfter);

      allRows.push({
        date: tx.date,
        description: tx.description,
        accountId: split.accountId,
        accountName: acctName,
        amount: split.amount,
        type: split.type,
        balanceAfter,
        isFirstSplit: j === 0,
      });
    }
  }

  return allRows.reverse();
}

function renderPage(allRows: SplitRow[], page: number): string {
  const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = allRows.slice(start, start + PAGE_SIZE);

  const tbody = pageRows
    .map(
      (r) => `
        <tr>
          <td>${r.isFirstSplit ? esc(r.date) : ''}</td>
          <td>${r.isFirstSplit ? esc(r.description) : ''}</td>
          <td>${esc(r.accountName)}</td>
          <td>${r.type === 'debit' ? r.amount.toFixed(2) : '<span class="amount-empty">&mdash;</span>'}</td>
          <td>${r.type === 'credit' ? r.amount.toFixed(2) : '<span class="amount-empty">&mdash;</span>'}</td>
          <td>${r.balanceAfter.toFixed(2)}</td>
        </tr>`,
    )
    .join('');

  const pagination =
    totalPages <= 1
      ? ''
      : `
        <nav class="pagination" aria-label="Ledger pagination">
          <button data-page="${currentPage - 1}" ${currentPage <= 1 ? 'disabled' : ''}>← Prev</button>
          <span class="page-info">Page ${currentPage} of ${totalPages}</span>
          <button data-page="${currentPage + 1}" ${currentPage >= totalPages ? 'disabled' : ''}>Next →</button>
        </nav>`;

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
            <th scope="col">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${tbody}
        </tbody>
      </table>
      ${pagination}
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
