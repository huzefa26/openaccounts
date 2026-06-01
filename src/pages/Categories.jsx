import { useEffect, useState } from 'react';
import useCategoryStore from '../store/categoryStore';
import useTransactionStore from '../store/transactionStore';
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

  useEffect(() => {
    fetchAll();
    fetchTransactions();
  }, []);

  const childrenMap = {};
  const roots = [];

  for (const cat of categories) {
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

  async function handleDelete(id) {
    const store = useCategoryStore.getState();
    const cat = store.categories.find((c) => c.id === id);
    if (cat.is_system) return;

    const children = store.categories.filter((c) => c.parent_id === id);
    if (children.length > 0) {
      setDeleteError('This category has sub-categories. Delete or reassign them first.');
      return;
    }

    const { lines } = useTransactionStore.getState();
    const hasLines = lines.some((l) => l.category_id === id);
    if (hasLines) {
      setDeleteError('This category has recorded transactions. Remove them first or reassign them.');
      return;
    }

    await useCategoryStore.getState().deleteCategory(id);
    setDeletingId(null);
    setDeleteError(null);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingCategory(null);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-text-primary">Categories</h1>
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
        <table className="w-full">
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
                    <td colSpan={5} className="py-2 px-4 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                      {TYPE_LABELS[type]}
                    </td>
                  </tr>
                  {typeCategories
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((cat) => renderCategory(cat))}
                </>
              );
            })}
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-text-tertiary">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
