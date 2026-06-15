import { useState, useEffect, useMemo, useRef, useReducer } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import CategorySelect from '../ui/CategorySelect';
import Button from '../ui/Button';
import BalanceIndicator from '../ledger/BalanceIndicator';
import useFormRestore from '../../hooks/useFormRestore';
import useCategoryStore from '../../store/categoryStore';
import useCurrencyStore from '../../store/currencyStore';
import useTransactionStore from '../../store/transactionStore';

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createRow(defaultCurrency) {
  return { id: crypto.randomUUID(), categoryId: '', currency: defaultCurrency?.code || '', amount: '' };
}

function initRows(initialTransaction, initialLines, defaultCurrency) {
  if (initialLines) {
    const creditRows = initialLines
      .filter((l) => l.entry_type === 'credit')
      .map((l) => ({ id: crypto.randomUUID(), categoryId: l.category_id, currency: l.currency, amount: String(l.amount) }));
    const debitRows = initialLines
      .filter((l) => l.entry_type === 'debit')
      .map((l) => ({ id: crypto.randomUUID(), categoryId: l.category_id, currency: l.currency, amount: String(l.amount) }));
    return {
      date: initialTransaction.date,
      description: initialTransaction.description,
      notes: initialTransaction.notes || '',
      fromRows: creditRows.length > 0 ? creditRows : [createRow(defaultCurrency)],
      toRows: debitRows.length > 0 ? debitRows : [createRow(defaultCurrency)],
    };
  }
  return {
    date: today(),
    description: '',
    notes: '',
    fromRows: [createRow(defaultCurrency)],
    toRows: [createRow(defaultCurrency)],
  };
}

function formReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'UPDATE_ROW': {
      const { side, id, field, value } = action;
      const key = side === 'from' ? 'fromRows' : 'toRows';
      return { ...state, [key]: state[key].map((r) => (r.id === id ? { ...r, [field]: value } : r)) };
    }
    case 'ADD_ROW': {
      const { side, row } = action;
      const key = side === 'from' ? 'fromRows' : 'toRows';
      return { ...state, [key]: [...state[key], row] };
    }
    case 'DELETE_ROW': {
      const { side, id } = action;
      const key = side === 'from' ? 'fromRows' : 'toRows';
      const rows = state[key];
      return { ...state, [key]: rows.length > 1 ? rows.filter((r) => r.id !== id) : rows };
    }
    case 'RESET': {
      const { defaultCurrency } = action;
      return {
        ...state,
        description: '',
        notes: '',
        fromRows: [createRow(defaultCurrency)],
        toRows: [createRow(defaultCurrency)],
      };
    }
    case 'RESTORE':
      return action.state;
    default:
      return state;
  }
}

export default function TransactionForm({ initialTransaction, initialLines, onSuccess }) {
  const { categories, fetchAll: fetchCategories } = useCategoryStore();
  const { currencies, defaultCurrency, fetchAll: fetchCurrencies } = useCurrencyStore();
  const { createTransaction, updateTransaction } = useTransactionStore();

  const isEdit = Boolean(initialTransaction);

  const [form, dispatch] = useReducer(
    formReducer,
    { initialTransaction, initialLines, defaultCurrency },
    (init) => initRows(init.initialTransaction, init.initialLines, init.defaultCurrency),
  );

  const formRef = useFormRestore(dispatch, isEdit);
  formRef.current = form;

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { fetchCategories(); fetchCurrencies(); }, []);

  const balances = useMemo(() => {
    const currencyMap = {};

    for (const row of form.fromRows) {
      if (!row.currency || !row.amount) continue;
      if (!currencyMap[row.currency]) currencyMap[row.currency] = { credits: 0, debits: 0 };
      currencyMap[row.currency].credits += Number(row.amount);
    }

    for (const row of form.toRows) {
      if (!row.currency || !row.amount) continue;
      if (!currencyMap[row.currency]) currencyMap[row.currency] = { credits: 0, debits: 0 };
      currencyMap[row.currency].debits += Number(row.amount);
    }

    return currencyMap;
  }, [form.fromRows, form.toRows]);

  const allCurrenciesBalanced = useMemo(() => {
    const codes = Object.keys(balances);
    if (codes.length === 0) return false;
    return codes.every((code) => balances[code].credits === balances[code].debits);
  }, [balances]);

  const allRowsFilled =
    form.description.trim().length > 0 &&
    [...form.fromRows, ...form.toRows].every(
      (r) => r.categoryId && r.currency && Number(r.amount) > 0,
    );

  const canSave = allCurrenciesBalanced && allRowsFilled;

  function addRow(side) {
    const newRow = createRow(defaultCurrency);
    dispatch({ type: 'ADD_ROW', side, row: newRow });
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-row-id="${newRow.id}"]`);
      if (el) {
        const trigger = el.querySelector('[data-categoryselect] button');
        trigger?.focus();
      }
    });
  }

  function resetForm() {
    dispatch({ type: 'RESET', defaultCurrency });
    setSaveError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave || saving) return;

    setSaving(true);
    setSaveError(null);

    try {
      const transaction = {
        date: form.date,
        description: form.description.trim(),
        notes: form.notes.trim(),
        is_opening_balance: false,
        opening_balance_category_id: null,
      };

      const fromLines = form.fromRows
        .filter((r) => r.categoryId && Number(r.amount) > 0)
        .map((r) => ({
          category_id: r.categoryId,
          entry_type: 'credit',
          currency: r.currency,
          amount: Number(r.amount),
        }));

      const toLines = form.toRows
        .filter((r) => r.categoryId && Number(r.amount) > 0)
        .map((r) => ({
          category_id: r.categoryId,
          entry_type: 'debit',
          currency: r.currency,
          amount: Number(r.amount),
        }));

      if (isEdit) {
        await updateTransaction(initialTransaction.id, { transaction, lines: [...fromLines, ...toLines] });
      } else {
        await createTransaction({ transaction, lines: [...fromLines, ...toLines] });
      }
      onSuccess?.();
      resetForm();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function renderRows(side) {
    const rows = side === 'from' ? form.fromRows : form.toRows;

    return (
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row.id} data-row-id={row.id} className="flex flex-col md:flex-row md:items-start gap-2">
            <div className="flex-1 min-w-0">
              <CategorySelect
                value={row.categoryId}
                onChange={(id) => dispatch({ type: 'UPDATE_ROW', side, id: row.id, field: 'categoryId', value: id })}
                categories={categories}
                placeholder="Select category"
              />
            </div>
            <div className="flex items-start gap-2">
              <div className="w-24 flex-shrink-0">
                <Select
                  name={`${side}-currency-${index}`}
                  value={row.currency}
                  onChange={(e) => dispatch({ type: 'UPDATE_ROW', side, id: row.id, field: 'currency', value: e.target.value })}
                  options={currencies.map((c) => ({ value: c.code, label: c.code }))}
                />
              </div>
              <div className="w-28 flex-shrink-0">
                <Input
                  name={`${side}-amount-${index}`}
                  type="number"
                  value={row.amount}
                  onChange={(e) => dispatch({ type: 'UPDATE_ROW', side, id: row.id, field: 'amount', value: e.target.value })}
                  placeholder="0.00"
                  className="font-numeric"
                />
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: 'DELETE_ROW', side, id: row.id })}
                disabled={rows.length <= 1}
                className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-base flex-shrink-0 ${
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

  const prevBalanced = useRef({});
  const [animating, setAnimating] = useState(new Set());

  useEffect(() => {
    const next = new Set(animating);
    for (const code of Object.keys(balances)) {
      const { credits, debits } = balances[code];
      const balanced = credits === debits;
      const wasBalanced = prevBalanced.current[code];
      if (wasBalanced !== undefined && !wasBalanced && balanced) {
        next.add(code);
      }
      prevBalanced.current[code] = balanced;
    }
    setAnimating(next);
  }, [balances]);

  function handleKeyDown(e) {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    if (e.key === 'Enter') {
      const match = e.target.name?.match(/^(from|to)-amount-(\d+)$/);
      if (match) {
        e.preventDefault();
        addRow(match[1]);
        return;
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-5">
      <Input
        label="Date"
        name="date"
        type="date"
        value={form.date}
        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'date', value: e.target.value })}
        className="w-full"
      />
      <Input
        label="Description"
        name="description"
        value={form.description}
        onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
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

      <div className="flex items-center justify-between">
        <BalanceIndicator
          balances={balances}
          animating={animating}
          onAnimEnd={(code) => {
            setAnimating((prev) => {
              const next = new Set(prev);
              next.delete(code);
              return next;
            });
          }}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-text-primary">Notes</label>
        <textarea
          id="notes"
          value={form.notes}
          onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'notes', value: e.target.value })}
          rows={3}
          className="px-3 py-2 text-sm bg-surface border border-border rounded-md transition-colors duration-base outline-none focus:ring-2 focus:ring-accent focus:border-accent hover:border-border-strong resize-none"
        />
      </div>

      {saveError && (
        <p className="text-xs text-error">{saveError}</p>
      )}

      <Button
        type="submit"
        disabled={!canSave || saving}
        title={
          !form.description.trim()
            ? 'Enter a description'
            : !allCurrenciesBalanced
              ? 'Balance credits and debits for each currency'
              : 'Save transaction'
        }
      >
        {saving ? 'Saving...' : 'Save'}
      </Button>
    </form>
  );
}
