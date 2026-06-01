import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import useCategoryStore from '../../store/categoryStore';
import useCurrencyStore from '../../store/currencyStore';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createRow() {
  return { id: crypto.randomUUID(), categoryId: '', currency: 'AED', amount: '' };
}

export default function TransactionForm() {
  const { categories, fetchAll: fetchCategories } = useCategoryStore();
  const { currencies, defaultCurrency, fetchAll: fetchCurrencies } = useCurrencyStore();

  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [fromRows, setFromRows] = useState([createRow()]);
  const [toRows, setToRows] = useState([createRow()]);

  useEffect(() => { fetchCategories(); fetchCurrencies(); }, []);

  const nonSystemCategories = categories.filter((c) => !c.is_system);

  function updateRow(side, id, field, value) {
    const updater = (rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    if (side === 'from') setFromRows(updater);
    else setToRows(updater);
  }

  function addRow(side) {
    if (side === 'from') setFromRows((prev) => [...prev, createRow()]);
    else setToRows((prev) => [...prev, createRow()]);
  }

  function deleteRow(side, id) {
    if (side === 'from') {
      setFromRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    } else {
      setToRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    }
  }

  function renderRows(side) {
    const rows = side === 'from' ? fromRows : toRows;

    return (
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row.id} className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <Select
                name={`${side}-category-${index}`}
                value={row.categoryId}
                onChange={(e) => updateRow(side, row.id, 'categoryId', e.target.value)}
                options={nonSystemCategories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Select category"
              />
            </div>
            <div className="w-24 flex-shrink-0">
              <Select
                name={`${side}-currency-${index}`}
                value={row.currency}
                onChange={(e) => updateRow(side, row.id, 'currency', e.target.value)}
                options={currencies.map((c) => ({ value: c.code, label: c.code }))}
              />
            </div>
            <div className="w-32 flex-shrink-0">
              <Input
                name={`${side}-amount-${index}`}
                type="number"
                value={row.amount}
                onChange={(e) => updateRow(side, row.id, 'amount', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <button
              type="button"
              onClick={() => deleteRow(side, row.id)}
              disabled={rows.length <= 1}
              className={`mt-6 inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-base flex-shrink-0 ${
                rows.length <= 1
                  ? 'text-text-disabled cursor-not-allowed'
                  : 'text-text-tertiary hover:text-expense hover:bg-expense-bg'
              }`}
              aria-label={`Delete ${side} row`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addRow(side)}
          className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-light rounded-md transition-colors duration-base"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Row
        </button>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5">
      <Input
        label="Date"
        name="date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <Input
        label="Description"
        name="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />

      <section className="border border-border rounded-md p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">From (credits)</h2>
        <p className="text-xs text-text-tertiary mb-3">Money out — decreases the account balance</p>
        {renderRows('from')}
      </section>

      <section className="border border-border rounded-md p-4">
        <h2 className="text-sm font-semibold text-text-primary mb-1">To (debits)</h2>
        <p className="text-xs text-text-tertiary mb-3">Money in — increases the account balance</p>
        {renderRows('to')}
      </section>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-text-primary">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-md transition-colors duration-base outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-border-strong resize-none"
        />
      </div>

      <Button disabled title="Complete description and add entries to enable save">
        Save
      </Button>
    </form>
  );
}
