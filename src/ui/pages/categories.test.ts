import { describe, it, expect } from 'vitest';
import { CategoriesPageHtml } from './categories';
import type { Account } from '../../types/storage';

function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    name: 'Test',
    type: 'asset',
    currency: 'USD',
    category: null,
    isPredefined: true,
    archived: false,
    parentId: null,
    openingBalance: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('CategoriesPageHtml', () => {
  it('renders new category button', () => {
    const html = CategoriesPageHtml([]);
    expect(html).toContain('+ New Category');
  });

  it('groups categories by type', () => {
    const accounts = [
      makeAccount({ name: 'Cash', type: 'asset' }),
      makeAccount({ name: 'Loan', type: 'liability' }),
      makeAccount({ name: 'Income', type: 'income' }),
    ];
    const html = CategoriesPageHtml(accounts);
    expect(html).toContain('Assets');
    expect(html).toContain('Liabilities');
    expect(html).toContain('Income');
    expect(html).toContain('Cash');
    expect(html).toContain('Loan');
  });

  it('renders types in canonical order', () => {
    const accounts = [
      makeAccount({ name: 'X', type: 'expense' }),
      makeAccount({ name: 'Y', type: 'asset' }),
    ];
    const html = CategoriesPageHtml(accounts);
    const assetIdx = html.indexOf('Assets');
    const expenseIdx = html.indexOf('Expenses');
    expect(assetIdx).toBeLessThan(expenseIdx);
  });

  it('omits type sections with no accounts', () => {
    const html = CategoriesPageHtml([
      makeAccount({ name: 'Cash', type: 'asset' }),
    ]);
    expect(html).toContain('Assets');
    expect(html).toContain('category-group');
    // Only one type section should be present (Liabilities, Equity, Income, Expenses each appear in modal type dropdown)
    const groupMatches = html.match(/class="category-group"/g);
    expect(groupMatches).toHaveLength(1);
  });

  it('renders Edit button for each category', () => {
    const accounts = [
      makeAccount({ id: 1, name: 'Cash', type: 'asset' }),
    ];
    const html = CategoriesPageHtml(accounts);
    expect(html).toContain('data-edit-category="1"');
  });

  it('hides delete button for predefined categories', () => {
    const accounts = [
      makeAccount({ id: 1, name: 'Cash', isPredefined: true }),
    ];
    const html = CategoriesPageHtml(accounts);
    expect(html).not.toContain('data-delete-category="1"');
  });

  it('shows delete button for non-predefined categories', () => {
    const accounts = [
      makeAccount({ id: 1, name: 'Custom', isPredefined: false }),
    ];
    const html = CategoriesPageHtml(accounts);
    expect(html).toContain('data-delete-category="1"');
  });

  it('renders opening balance', () => {
    const accounts = [
      makeAccount({ id: 1, name: 'Cash', openingBalance: 1000 }),
    ];
    const html = CategoriesPageHtml(accounts);
    expect(html).toContain('1000.00');
  });

  it('renders the category form modal', () => {
    const html = CategoriesPageHtml([]);
    expect(html).toContain('category-modal');
    expect(html).toContain('dialog');
  });

  it('excludes archived categories', () => {
    const accounts = [
      makeAccount({ id: 1, name: 'Cash', type: 'asset', archived: false }),
      makeAccount({ id: 2, name: 'Old', type: 'asset', archived: true }),
    ];
    const html = CategoriesPageHtml(accounts);
    expect(html).toContain('Cash');
    expect(html).not.toContain('Old');
  });
});
