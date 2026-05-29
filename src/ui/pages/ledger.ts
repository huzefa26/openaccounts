import type { Transaction, Account } from '../../types/storage';

const PER_PAGE = 25;

export interface LedgerFilters {
  search: string;
}

export function LedgerHtml(
  transactions: Transaction[],
  accountMap: Map<number, Account>,
  filters: LedgerFilters = { search: '' },
  page: number = 1,
): string {
  let filtered = transactions;

  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(
      (tx) =>
        tx.description.toLowerCase().includes(q) ||
        tx.date.includes(q),
    );
  }

  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <h3>No transactions found</h3>
        <p>${transactions.length === 0 ? 'Record your first transaction from the home page.' : 'Try adjusting your filters.'}</p>
      </div>`;
  }

  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  const totalPages = Math.ceil(sorted.length / PER_PAGE);
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = sorted.slice(start, start + PER_PAGE);

  const totalDebit = filtered.reduce((sum, tx) =>
    sum + tx.splits.filter((s) => s.type === 'debit').reduce((s, sp) => s + sp.amount, 0), 0);
  const totalCredit = filtered.reduce((sum, tx) =>
    sum + tx.splits.filter((s) => s.type === 'credit').reduce((s, sp) => s + sp.amount, 0), 0);
  const net = totalCredit - totalDebit;

  const rows = pageItems
    .map((tx) => {
      return tx.splits
        .map((split, j) => {
          const acct = accountMap.get(split.accountId);
          const acctName = acct?.name ?? `[id:${split.accountId}]`;
          const badgeClass = acct ? `badge ${acct.type}` : 'badge';
          return `
            <tr data-tx-id="${tx.id}">
              <td class="cell-date">${j === 0 ? esc(tx.date) : ''}</td>
              <td class="cell-description">${j === 0 ? esc(tx.description) : ''}</td>
              <td><span class="${badgeClass}">${esc(acctName)}</span></td>
              <td class="cell-debit">${split.type === 'debit' ? split.amount.toFixed(2) : ''}</td>
              <td class="cell-credit">${split.type === 'credit' ? split.amount.toFixed(2) : ''}</td>
            </tr>`;
        })
        .join('');
    })
    .join('');

  const netClass = net >= 0 ? 'positive' : 'negative';

  return `
    <div class="filter-bar">
      <input type="search" class="filter-search" id="ledger-search" placeholder="Search transactions..." value="${esc(filters.search)}" />
    </div>

    <div class="ledger-summary">
      <span class="summary-item">${filtered.length} entr${filtered.length === 1 ? 'y' : 'ies'}</span>
      <span class="summary-item">Total Debit: <strong>${totalDebit.toFixed(2)}</strong></span>
      <span class="summary-item">Total Credit: <strong>${totalCredit.toFixed(2)}</strong></span>
      <span class="summary-item">Net: <strong class="${netClass}">${net >= 0 ? '+' : ''}${net.toFixed(2)}</strong></span>
    </div>

    <table class="ledger-table">
      <thead>
        <tr>
          <th scope="col" class="col-date">Date</th>
          <th scope="col" class="col-description">Description</th>
          <th scope="col" class="col-account">Account</th>
          <th scope="col" class="col-debit amount">Debit</th>
          <th scope="col" class="col-credit amount">Credit</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    ${totalPages > 1 ? paginationHtml(currentPage, totalPages) : ''}`;
}

export function mountLedger(
  el: HTMLElement,
  _transactions: Transaction[],
  _accountMap: Map<number, Account>,
  onRefresh: (filters: LedgerFilters, page: number) => Promise<void>,
): void {
  const searchInput = el.querySelector<HTMLInputElement>('#ledger-search');
  if (searchInput) {
    let debounceTimer: ReturnType<typeof setTimeout>;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        onRefresh({ search: searchInput.value }, 1);
      }, 300);
    });
  }

  el.addEventListener('click', (e) => {
    const pageBtn = (e.target as HTMLElement).closest<HTMLElement>('[data-page]');
    if (pageBtn) {
      const search = el.querySelector<HTMLInputElement>('#ledger-search')?.value ?? '';
      onRefresh({ search }, Number(pageBtn.getAttribute('data-page')));
      return;
    }
  });
}

function paginationHtml(current: number, total: number): string {
  const pages: string[] = [];

  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(String(i));
  } else {
    pages.push('1');
    if (current > 3) pages.push('...');
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      pages.push(String(i));
    }
    if (current < total - 2) pages.push('...');
    pages.push(String(total));
  }

  return `
    <nav class="pagination" role="navigation" aria-label="Pagination">
      <button class="page-btn" data-page="${current - 1}" ${current <= 1 ? 'disabled' : ''}>← Prev</button>
      ${pages.map((p) =>
        p === '...'
          ? '<span class="page-ellipsis">…</span>'
          : `<button class="page-btn${Number(p) === current ? ' active' : ''}" data-page="${p}" ${Number(p) === current ? 'aria-current="page"' : ''}>${p}</button>`,
      ).join('')}
      <button class="page-btn" data-page="${current + 1}" ${current >= total ? 'disabled' : ''}>Next →</button>
    </nav>`;
}

function esc(s: string): string {
  const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  return s.replace(/[&<>"']/g, (c) => map[c]);
}
