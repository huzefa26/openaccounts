import type { Account } from '../../types/storage';
import type { StorageService } from '../../lib/storage';
import { CategoryFormModalHtml, mountCategoryFormModal } from '../components/category-form';
import type { CategoryFormData } from '../components/category-form';

const TYPE_LABELS: Record<string, string> = {
  asset: 'Assets',
  liability: 'Liabilities',
  equity: 'Equity',
  income: 'Income',
  expense: 'Expenses',
};

const TYPE_ORDER = ['asset', 'liability', 'equity', 'income', 'expense'];

export function CategoriesPageHtml(accounts: Account[]): string {
  const groups: Record<string, Account[]> = {};
  for (const a of accounts) {
    if (!a.archived) (groups[a.type] ??= []).push(a);
  }

  const sections = TYPE_ORDER
    .filter((t) => groups[t])
    .map((t, i) => {
      const isFirst = i === 0;
      const rows = groups[t]!.map((a) => {
        const balance = (a.openingBalance ?? 0).toFixed(2);
        return `
          <div class="category-row" data-category-id="${a.id}">
            <span class="badge ${a.type}">${esc(a.type)}</span>
            <span class="category-name">${esc(a.name)}</span>
            <span class="category-balance">${balance}</span>
            <span class="category-actions">
              <button class="btn-icon small" data-edit-category="${a.id}" aria-label="Edit ${esc(a.name)}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              ${a.isPredefined ? '' : `<button class="btn-icon small" data-delete-category="${a.id}" aria-label="Delete ${esc(a.name)}">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>`}
            </span>
          </div>`;
      }).join('');

      return `
        <div class="account-section">
          <div class="account-section-header ${isFirst ? 'open' : ''}" data-section="${t}">
            <span class="account-section-icon">${isFirst ? '▼' : '▶'}</span>
            <span class="account-section-name">${TYPE_LABELS[t]}</span>
            <span class="account-section-count">${groups[t]!.length}</span>
          </div>
          <div class="account-section-body" ${isFirst ? '' : 'style="display:none"'}>
            ${rows}
          </div>
        </div>`;
    })
    .join('');

  return `
    <div class="page-content">
      <header class="hstack justify-between items-center" style="margin-bottom: var(--space-6);">
        <h2>Chart of Accounts</h2>
        <button id="new-category-btn" class="button">+ New Account</button>
      </header>

      ${sections}

      ${CategoryFormModalHtml()}
    </div>`;
}

export function mountCategoriesPage(
  el: HTMLElement,
  accounts: Account[],
  storage: StorageService,
  onRefresh: () => Promise<void>,
): void {
  const modal = mountCategoryFormModal(el, accounts, async (data: CategoryFormData, editing) => {
    if (editing) {
      await storage.updateAccount(editing.id!, {
        name: data.name,
        type: data.type,
        currency: data.currency,
        parentId: data.parentId,
        openingBalance: data.openingBalance,
      });
    } else {
      await storage.createAccount({
        name: data.name,
        type: data.type,
        currency: data.currency,
        parentId: data.parentId,
        openingBalance: data.openingBalance,
        category: null,
        isPredefined: false,
        archived: false,
      });
    }
    await onRefresh();
  });

  el.querySelector('#new-category-btn')?.addEventListener('click', () => modal.open());

  // Collapsible sections
  el.addEventListener('click', (e) => {
    const header = (e.target as HTMLElement).closest('.account-section-header');
    if (header) {
      const section = header.closest('.account-section');
      const body = section?.querySelector('.account-section-body') as HTMLElement | null;
      const icon = header.querySelector('.account-section-icon') as HTMLElement | null;
      if (body && icon) {
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : '';
        header.classList.toggle('open', !isOpen);
        icon.textContent = isOpen ? '▶' : '▼';
      }
      return;
    }
  });

  // Edit / Delete
  el.addEventListener('click', (e) => {
    const editBtn = (e.target as HTMLElement).closest('[data-edit-category]');
    if (editBtn) {
      const id = Number(editBtn.getAttribute('data-edit-category'));
      const account = accounts.find((a) => a.id === id);
      if (account) modal.open(account);
      return;
    }

    const deleteBtn = (e.target as HTMLElement).closest('[data-delete-category]');
    if (deleteBtn) {
      const id = Number(deleteBtn.getAttribute('data-delete-category'));
      const account = accounts.find((a) => a.id === id);
      if (!account) return;
      if (!confirm(`Delete "${account.name}"? This cannot be undone.`)) return;
      storage
        .deleteAccount(id)
        .then(() => onRefresh())
        .catch((err) => alert(err instanceof Error ? err.message : 'Failed to delete category'));
      return;
    }
  });
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
