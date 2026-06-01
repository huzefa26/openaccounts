import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import useCategoryStore from '../../store/categoryStore';
import useCurrencyStore from '../../store/currencyStore';
import { handleOpeningBalance } from '../../utils/accounting';

const TYPE_OPTIONS = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'equity', label: 'Equity' },
];

export default function CategoryForm({ category, onClose }) {
  const isEdit = Boolean(category);
  const { categories, createCategory, updateCategory } = useCategoryStore();
  const { defaultCurrency, fetchAll: fetchCurrencies } = useCurrencyStore();

  const [name, setName] = useState(category?.name || '');
  const [type, setType] = useState(category?.type || 'expense');
  const [parentId, setParentId] = useState(category?.parent_id || '');
  const [description, setDescription] = useState(category?.description || '');
  const [openingBalance, setOpeningBalance] = useState(category?.opening_balance ?? 0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const sameTypeCategories = categories.filter(
    (c) => c.type === type && c.id !== category?.id && !c.is_system,
  );

  function validate() {
    const next = {};
    if (!name.trim()) next.name = 'Name is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = {
        name: name.trim(),
        type,
        parent_id: parentId || null,
        description: description.trim(),
        opening_balance: Number(openingBalance) || 0,
      };

      let saved;
      if (isEdit) {
        saved = await updateCategory(category.id, data);
      } else {
        saved = await createCategory(data);
      }

      const oldBalance = category?.opening_balance || 0;
      const newBalance = Number(openingBalance) || 0;
      if (newBalance !== oldBalance) {
        await handleOpeningBalance(saved, newBalance, defaultCurrency);
      }

      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Category' : 'New Category'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => { if (!name.trim()) setErrors((e) => ({ ...e, name: 'Name is required' })); else setErrors((e) => { const { name, ...rest } = e; return rest; }); }}
          error={errors.name}
          required
        />

        <Select
          label="Account Type"
          name="type"
          value={type}
          onChange={(e) => { setType(e.target.value); setParentId(''); }}
          options={TYPE_OPTIONS}
          required
        />

        <Select
          label="Parent Category"
          name="parentId"
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          options={sameTypeCategories.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="None (root)"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="description" className="text-sm font-medium text-text-primary">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="px-3 py-2 text-sm bg-surface border border-border rounded-md transition-colors duration-base outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-border-strong resize-none"
          />
        </div>

        <Input
          label="Opening Balance"
          name="openingBalance"
          type="number"
          value={openingBalance}
          onChange={(e) => setOpeningBalance(e.target.value)}
          placeholder="0"
        />

        {errors.submit && (
          <p className="text-xs text-error">{errors.submit}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
