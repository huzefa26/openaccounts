import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CategoryFormModalHtml, mountCategoryFormModal } from './category-form';
import type { Account } from '../../types/storage';

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    name: 'Test',
    type: 'asset',
    currency: 'USD',
    category: null,
    isPredefined: false,
    archived: false,
    parentId: null,
    openingBalance: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const accounts: Account[] = [
  makeAccount({ id: 1, name: 'Cash', type: 'asset' }),
  makeAccount({ id: 2, name: 'Groceries', type: 'expense' }),
  makeAccount({ id: 3, name: 'Salary', type: 'income' }),
];

describe('CategoryFormModalHtml', () => {
  it('renders modal structure', () => {
    const html = CategoryFormModalHtml();
    expect(html).toContain('category-modal');
    expect(html).toContain('dialog');
    expect(html).toContain('cat-name');
    expect(html).toContain('cat-type');
    expect(html).toContain('cat-currency');
    expect(html).toContain('cat-parent');
    expect(html).toContain('cat-opening');
  });

  it('renders all currencies', () => {
    const html = CategoryFormModalHtml();
    expect(html).toContain('USD');
    expect(html).toContain('EUR');
    expect(html).toContain('INR');
    expect(html).toContain('AED');
    expect(html).toContain('CAD');
  });

  it('renders all account types', () => {
    const html = CategoryFormModalHtml();
    expect(html).toContain('Asset');
    expect(html).toContain('Liability');
    expect(html).toContain('Equity');
    expect(html).toContain('Income');
    expect(html).toContain('Expense');
  });

  it('renders Cancel and Save buttons', () => {
    const html = CategoryFormModalHtml();
    expect(html).toContain('Cancel');
    expect(html).toContain('Save');
  });
});

describe('mountCategoryFormModal', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = CategoryFormModalHtml();
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('returns open and close functions', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    expect(typeof modal.open).toBe('function');
    expect(typeof modal.close).toBe('function');
  });

  it('open shows the dialog', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    const dialog = container.querySelector<HTMLDialogElement>('#category-modal')!;
    expect(dialog.hasAttribute('open')).toBe(false);
    modal.open();
    expect(dialog.hasAttribute('open')).toBe(true);
  });

  it('open sets title to New Category when no editing', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    modal.open();
    const title = container.querySelector('#category-modal-title')!;
    expect(title.textContent).toBe('New Category');
  });

  it('open sets title to Edit Category when editing', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    modal.open(accounts[0]);
    const title = container.querySelector('#category-modal-title')!;
    expect(title.textContent).toBe('Edit Category');
  });

  it('open pre-fills fields when editing', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    modal.open(accounts[1]);
    const nameIn = container.querySelector<HTMLInputElement>('#cat-name')!;
    const typeIn = container.querySelector<HTMLSelectElement>('#cat-type')!;
    expect(nameIn.value).toBe('Groceries');
    expect(typeIn.value).toBe('expense');
  });

  it('open allows editing predefined accounts', () => {
    const predefined = makeAccount({ id: 5, name: 'Bank', isPredefined: true });
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    modal.open(predefined);
    const nameIn = container.querySelector<HTMLInputElement>('#cat-name')!;
    const saveBtn = container.querySelector<HTMLButtonElement>('#cat-save')!;
    expect(nameIn.disabled).toBe(false);
    expect(saveBtn.style.display).not.toBe('none');
  });

  it('close hides the dialog', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    modal.open();
    modal.close();
    const dialog = container.querySelector<HTMLDialogElement>('#category-modal')!;
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('calls onSave with form data on Save click', async () => {
    let saved: any = null;
    let editingAccount: any = null;
    const modal = mountCategoryFormModal(container, accounts, async (data, editing) => {
      saved = data;
      editingAccount = editing;
    });

    modal.open();

    const nameIn = container.querySelector<HTMLInputElement>('#cat-name')!;
    const typeIn = container.querySelector<HTMLSelectElement>('#cat-type')!;
    nameIn.value = 'Rent';
    typeIn.value = 'expense';

    container.querySelector<HTMLButtonElement>('#cat-save')!.click();

    // wait for microtask
    await new Promise((r) => setTimeout(r, 0));

    expect(saved).not.toBeNull();
    expect(saved.name).toBe('Rent');
    expect(saved.type).toBe('expense');
    expect(saved.currency).toBe('USD');
    expect(saved.openingBalance).toBe(0);
    expect(editingAccount).toBeNull();
  });

  it('calls onSave with editing account when editing', async () => {
    let editingAccount: any = null;
    const modal = mountCategoryFormModal(container, accounts, async (_data, editing) => {
      editingAccount = editing;
    });

    modal.open(accounts[1]);

    container.querySelector<HTMLButtonElement>('#cat-save')!.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(editingAccount).not.toBeNull();
    expect(editingAccount.id).toBe(2);
  });

  it('Cancel closes the dialog', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    modal.open();
    container.querySelector<HTMLButtonElement>('#cat-cancel')!.click();
    const dialog = container.querySelector<HTMLDialogElement>('#category-modal')!;
    expect(dialog.hasAttribute('open')).toBe(false);
  });

  it('updates parent dropdown when type changes', () => {
    const modal = mountCategoryFormModal(container, accounts, async () => {});
    modal.open();

    const typeIn = container.querySelector<HTMLSelectElement>('#cat-type')!;
    const parentIn = container.querySelector<HTMLSelectElement>('#cat-parent')!;

    typeIn.value = 'expense';
    typeIn.dispatchEvent(new Event('change', { bubbles: true }));

    // Only Groceries (expense) should be in parent dropdown
    const options = Array.from(parentIn.options).map((o) => o.value);
    expect(options).toContain('');
    expect(options).not.toContain('1'); // Cash is asset
    expect(options).toContain('2'); // Groceries is expense
  });
});
