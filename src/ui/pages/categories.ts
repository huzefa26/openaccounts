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

  return `
    <div class="page-content">
      <button id="new-category-btn" class="button" style="margin-bottom: var(--space-3);">+ New Category</button>

      ${TYPE_ORDER
        .filter((t) => groups[t])
        .map(
          (t) => `
            <section class="category-group">
              <h3 class="category-group-title">${TYPE_LABELS[t]}</h3>
              <div class="category-rows">
                ${groups[t]
                  .map((a) => {
                    const balance = (a.openingBalance ?? 0).toFixed(2);
                    return `
                      <div class="category-row" data-category-id="${a.id}">
                        <span class="category-name">
                          ${esc(a.name)}
                          <span class="account-type-badge type-${esc(a.type)}">${TYPE_LABELS[a.type] || a.type}</span>
                        </span>
                        <span class="category-currency">${esc(a.currency)}</span>
                        <span class="category-balance">${balance}</span>
                        <span class="category-actions">
                          <button class="outline small" data-edit-category="${a.id}">Edit</button>
                          ${a.isPredefined ? '' : `<button class="outline small" data-delete-category="${a.id}">&times;</button>`}
                        </span>
                      </div>`;
                  })
                  .join('')}
              </div>
            </section>`,
        )
        .join('')}

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
