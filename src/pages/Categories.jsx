import { useEffect, useState } from 'react';
import useCategoryStore from '../store/categoryStore';
import useTransactionStore from '../store/transactionStore';
import useToastStore from '../store/toastStore';
import useBalance from '../hooks/useBalance';
import CategoryRow from '../components/tables/CategoryRow';
import CategoryForm from '../components/forms/CategoryForm';

const TYPE_LABELS = {
  asset: 'Assets',
  liability: 'Liabilities',
  income: 'Income',
  expense: 'Expenses',
  equity: 'Equity',
};

const TYPE_ORDER = ['asset', 'liability', 'income', 'expense', 'equity'];

export default function Categories() {
  const { categories, fetchAll } = useCategoryStore();
  const { fetchAll: fetchTransactions } = useTransactionStore();
  const [editingCategory, setEditingCategory] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [collapsedTypes, setCollapsedTypes] = useState(new Set());

  useEffect(() => {
    fetchAll();
    fetchTransactions();
  }, []);

  const visible = categories.filter((c) => !c.is_system);

  const childrenMap = {};
  const roots = [];

  for (const cat of visible) {
    if (cat.parent_id) {
      if (!childrenMap[cat.parent_id]) childrenMap[cat.parent_id] = [];
      childrenMap[cat.parent_id].push(cat);
    } else {
      roots.push(cat);
    }
  }

  const grouped = {};
  for (const type of TYPE_ORDER) {
    grouped[type] = roots.filter((c) => c.type === type);
  }

  function renderCategory(cat, depth = 0) {
    const children = childrenMap[cat.id] || [];
    return (
      <CategoryRow
        key={cat.id}
        category={cat}
        depth={depth}
        onEdit={(c) => { setEditingCategory(c); setShowForm(true); }}
        onDelete={(c) => { setDeletingId(c.id); setDeleteError(null); }}
      >
        {children
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => renderCategory(child, depth + 1))}
      </CategoryRow>
    );
  }

  function CategoryCard({ category, depth }) {
    const balance = useBalance(category.id);
    const indent = depth * 20;

    const balanceDisplay = Object.keys(balance).length > 0
      ? Object.entries(balance)
          .map(([currency, amount]) => `${Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`)
          .join(', ')
      : '—';

    return (
      <div className="flex items-start justify-between gap-2 px-4 py-3">
        <div className="flex-1 min-w-0" style={{ marginLeft: `${indent}px` }}>
          <p className={`text-sm ${depth === 0 ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
            {category.name}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {category.opening_balance ? (
              <span className="text-xs text-text-tertiary font-numeric">
                Opening: {Number(category.opening_balance).toLocaleString()}
              </span>
            ) : null}
            <span className="text-xs text-text-tertiary font-numeric">
              Balance: {balanceDisplay}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!category.is_system && (
            <>
              <button
                onClick={() => { setEditingCategory(category); setShowForm(true); }}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-text-primary hover:bg-accent-light transition-colors duration-base"
                aria-label={`Edit ${category.name}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => { setDeletingId(category.id); setDeleteError(null); }}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-expense hover:bg-expense-bg transition-colors duration-base"
                aria-label={`Delete ${category.name}`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  function renderCategoryCard(cat, depth = 0) {
    const children = childrenMap[cat.id] || [];
    return (
      <div key={cat.id}>
        <CategoryCard category={cat} depth={depth} />
        {children
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((child) => renderCategoryCard(child, depth + 1))}
      </div>
    );
  }

  async function handleDelete(id) {
    const store = useCategoryStore.getState();
    const cat = store.categories.find((c) => c.id === id);
    if (cat.is_system) return;

    const children = store.categories.filter((c) => c.parent_id === id);
    if (children.length > 0) {
      useToastStore.getState().addToast({
        message: 'Cannot delete: This category has sub-categories. Delete or reassign them first.',
        type: 'error',
      });
      return;
    }

    const { lines } = useTransactionStore.getState();
    const hasLines = lines.some((l) => l.category_id === id);
    if (hasLines) {
      useToastStore.getState().addToast({
        message: 'Cannot delete: This category has recorded transactions. Remove them first or reassign them.',
        type: 'error',
      });
      return;
    }

    await useCategoryStore.getState().deleteCategory(id);
    setDeletingId(null);
    setDeleteError(null);
  }

  function toggleType(type) {
    setCollapsedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingCategory(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-end mb-6">
        <button
          onClick={() => { setEditingCategory(null); setShowForm(true); }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors duration-base"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Category
        </button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full hidden md:table">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th className="py-2.5 px-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
              <th className="py-2.5 px-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Opening Balance</th>
              <th className="py-2.5 px-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Net Balance</th>
              <th className="py-2.5 px-2 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-10" />
              <th className="py-2.5 pl-2 pr-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-10" />
            </tr>
          </thead>
          <tbody>
            {TYPE_ORDER.map((type) => {
              const typeCategories = grouped[type];
              if (!typeCategories || typeCategories.length === 0) return null;
              return (
                <>
                  <tr key={`header-${type}`} className="bg-bg border-b border-border">
                    <td colSpan={5} className="py-2 px-4">
                      <button
                        type="button"
                        onClick={() => toggleType(type)}
                        className="flex items-center gap-2 w-full text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform duration-base ${
                            collapsedTypes.has(type) ? '-rotate-90' : 'rotate-0'
                          }`}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        {TYPE_LABELS[type]}
                      </button>
                    </td>
                  </tr>
                  {!collapsedTypes.has(type) && typeCategories
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cat) => renderCategory(cat))}
                </>
              );
            })}
            {roots.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-text-tertiary">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="block md:hidden divide-y divide-border">
          {TYPE_ORDER.map((type) => {
            const typeCategories = grouped[type];
            if (!typeCategories || typeCategories.length === 0) return null;
            return (
              <div key={type}>
                <div className="px-4 py-2 bg-bg border-b border-border">
                  <button
                    type="button"
                    onClick={() => toggleType(type)}
                    className="flex items-center gap-2 w-full text-left text-xs font-semibold text-text-secondary uppercase tracking-wider"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-base ${
                        collapsedTypes.has(type) ? '-rotate-90' : 'rotate-0'
                      }`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    {TYPE_LABELS[type]}
                  </button>
                </div>
                {!collapsedTypes.has(type) && typeCategories
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((cat) => renderCategoryCard(cat))}
              </div>
            );
          })}
          {roots.length === 0 && (
            <div className="py-8 text-center text-sm text-text-tertiary">
              No categories yet.
            </div>
          )}
        </div>
      </div>

      {deletingId && (
        <div className="mt-4 p-4 border border-border rounded-md bg-surface">
          <p className="text-sm text-text-primary mb-3">
            Delete this category? This cannot be undone.
          </p>
          {deleteError && (
            <p className="text-xs text-error mb-3">{deleteError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => handleDelete(deletingId)}
              className="px-3 py-1.5 text-sm font-medium bg-expense text-white rounded-md hover:opacity-90 transition-colors duration-base"
            >
              Delete
            </button>
            <button
              onClick={() => { setDeletingId(null); setDeleteError(null); }}
              className="px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-accent-light rounded-md transition-colors duration-base"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <CategoryForm
          category={editingCategory}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
