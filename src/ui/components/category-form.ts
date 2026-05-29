import type { Account, AccountType } from '../../types/storage';

export interface CategoryFormData {
  name: string;
  type: AccountType;
  currency: string;
  parentId: number | null;
  openingBalance: number;
}

const CURRENCIES = ['USD', 'EUR', 'INR', 'AED', 'CAD'];

export function CategoryFormModalHtml(): string {
  return `
    <dialog id="category-modal">
      <form method="dialog" id="category-form">
        <header class="hstack justify-between items-center">
          <h3 id="category-modal-title">New Category</h3>
          <button type="button" id="category-modal-close" class="outline small" aria-label="Close">&times;</button>
        </header>

        <label data-field>
          Name
          <input type="text" id="cat-name" required autofocus />
        </label>

        <label data-field>
          Type
          <select id="cat-type" required>
            <option value="">— Select type —</option>
            <option value="asset">Asset</option>
            <option value="liability">Liability</option>
            <option value="equity">Equity</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </label>

        <label data-field>
          Currency
          <select id="cat-currency" required>
            ${CURRENCIES.map((c) => `<option value="${c}">${c}</option>`).join('')}
          </select>
        </label>

        <label data-field>
          Parent
          <select id="cat-parent">
            <option value="">None</option>
          </select>
        </label>

        <label data-field>
          Opening Balance
          <input type="number" id="cat-opening" placeholder="0.00" step="0.01" min="0" />
        </label>

        <footer class="hstack justify-end" style="gap: var(--space-2);">
          <button type="button" id="cat-cancel" class="outline">Cancel</button>
          <button type="button" id="cat-save">Save</button>
        </footer>
      </form>
    </dialog>`;
}

export function mountCategoryFormModal(
  el: HTMLElement,
  accounts: Account[],
  onSave: (data: CategoryFormData, editing: Account | null) => Promise<void>,
): { open: (editing?: Account) => void; close: () => void } {
  const dialog = el.querySelector<HTMLDialogElement>('#category-modal')!;
  const title = el.querySelector('#category-modal-title')!;
  const nameIn = el.querySelector<HTMLInputElement>('#cat-name')!;
  const typeIn = el.querySelector<HTMLSelectElement>('#cat-type')!;
  const currencyIn = el.querySelector<HTMLSelectElement>('#cat-currency')!;
  const parentIn = el.querySelector<HTMLSelectElement>('#cat-parent')!;
  const openingIn = el.querySelector<HTMLInputElement>('#cat-opening')!;
  const saveBtn = el.querySelector<HTMLButtonElement>('#cat-save')!;
  const cancelBtn = el.querySelector<HTMLButtonElement>('#cat-cancel')!;
  const closeBtn = el.querySelector<HTMLButtonElement>('#category-modal-close')!;
  const form = el.querySelector<HTMLFormElement>('#category-form')!;

  let editing: Account | null = null;

  function updateParentOptions(type: string): void {
    const filtered = accounts.filter(
      (a) => a.type === type && a.id !== editing?.id && !a.archived,
    );
    parentIn.innerHTML =
      `<option value="">None</option>` +
      filtered
        .map((a) => `<option value="${a.id}">${esc(a.name)}</option>`)
        .join('');
  }

  function open(editingAccount?: Account): void {
    editing = editingAccount ?? null;

    if (editing && editing.isPredefined) {
      nameIn.value = editing.name;
      typeIn.value = editing.type;
      currencyIn.value = editing.currency;
      openingIn.value = (editing.openingBalance ?? 0).toFixed(2);
      updateParentOptions(editing.type);
      parentIn.value = editing.parentId ? String(editing.parentId) : '';

      nameIn.disabled = true;
      typeIn.disabled = true;
      currencyIn.disabled = true;
      openingIn.disabled = true;
      parentIn.disabled = true;
      saveBtn.style.display = 'none';
      title.textContent = 'Edit Category (read-only)';
      dialog.showModal();
      return;
    }

    nameIn.disabled = false;
    typeIn.disabled = false;
    currencyIn.disabled = false;
    openingIn.disabled = false;
    parentIn.disabled = false;
    saveBtn.style.display = '';

    if (editing) {
      nameIn.value = editing.name;
      typeIn.value = editing.type;
      currencyIn.value = editing.currency;
      openingIn.value = (editing.openingBalance ?? 0).toFixed(2);
      updateParentOptions(editing.type);
      parentIn.value = editing.parentId ? String(editing.parentId) : '';
      title.textContent = 'Edit Category';
    } else {
      form.reset();
      openingIn.value = '';
      updateParentOptions(typeIn.value);
      title.textContent = 'New Category';
    }

    dialog.showModal();
  }

  function close(): void {
    dialog.close();
  }

  typeIn.addEventListener('change', () => {
    updateParentOptions(typeIn.value);
  });

  saveBtn.addEventListener('click', async () => {
    const name = nameIn.value.trim();
    const type = typeIn.value as AccountType;
    const currency = currencyIn.value;
    if (!name || !type || !currency) return;

    const data: CategoryFormData = {
      name,
      type,
      currency,
      parentId: parentIn.value ? Number(parentIn.value) : null,
      openingBalance: parseFloat(openingIn.value) || 0,
    };

    await onSave(data, editing);
    close();
  });

  cancelBtn.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  return { open, close };
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
