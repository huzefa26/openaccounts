import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import CategorySelect from '../ui/CategorySelect';
import Button from '../ui/Button';
import useCategoryStore from '../../store/categoryStore';
import useCurrencyStore from '../../store/currencyStore';
import useTransactionStore from '../../store/transactionStore';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function TransactionForm({ initialTransaction, initialLines, onSuccess }) {
  const { categories, fetchAll: fetchCategories } = useCategoryStore();
  const { currencies, defaultCurrency, fetchAll: fetchCurrencies } = useCurrencyStore();

  function createRow() {
    return { id: crypto.randomUUID(), categoryId: '', currency: defaultCurrency?.code || 'AED', amount: '' };
  }
  const { createTransaction, updateTransaction, formRestoreState, saveFormRestoreState, markFormRestored, undoRestoreState, clearUndoRestoreState } = useTransactionStore();

  const isEdit = Boolean(initialTransaction);

  function initRows() {
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
        fromRows: creditRows.length > 0 ? creditRows : [createRow()],
        toRows: debitRows.length > 0 ? debitRows : [createRow()],
      };
    }
    return {
      date: today(),
      description: '',
      notes: '',
      fromRows: [createRow()],
      toRows: [createRow()],
    };
  }

  const [date, setDate] = useState(initRows().date);
  const [description, setDescription] = useState(initRows().description);
  const [notes, setNotes] = useState(initRows().notes);
  const [fromRows, setFromRows] = useState(initRows().fromRows);
  const [toRows, setToRows] = useState(initRows().toRows);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const formStateRef = useRef({ date, description, notes, fromRows, toRows });
  useEffect(() => { formStateRef.current = { date, description, notes, fromRows, toRows }; });

  useEffect(() => {
    if (!isEdit && formRestoreState) {
      setDate(formRestoreState.date);
      setDescription(formRestoreState.description);
      setNotes(formRestoreState.notes || '');
      setFromRows(formRestoreState.fromRows);
      setToRows(formRestoreState.toRows);
      markFormRestored();
    }
  }, []);

  useEffect(() => {
    if (!isEdit && undoRestoreState) {
      setDate(undoRestoreState.date);
      setDescription(undoRestoreState.description);
      setNotes(undoRestoreState.notes || '');
      setFromRows(undoRestoreState.fromRows);
      setToRows(undoRestoreState.toRows);
      clearUndoRestoreState();
    }
  }, [undoRestoreState]);

  useEffect(() => {
    return () => {
      if (!isEdit) {
        saveFormRestoreState(formStateRef.current);
      }
    };
  }, [isEdit]);

  useEffect(() => { fetchCategories(); fetchCurrencies(); }, []);

  const balances = useMemo(() => {
    const currencyMap = {};

    for (const row of fromRows) {
      if (!row.currency || !row.amount) continue;
      if (!currencyMap[row.currency]) currencyMap[row.currency] = { credits: 0, debits: 0 };
      currencyMap[row.currency].credits += Number(row.amount);
    }

    for (const row of toRows) {
      if (!row.currency || !row.amount) continue;
      if (!currencyMap[row.currency]) currencyMap[row.currency] = { credits: 0, debits: 0 };
      currencyMap[row.currency].debits += Number(row.amount);
    }

    return currencyMap;
  }, [fromRows, toRows]);

  const allCurrenciesBalanced = useMemo(() => {
    const codes = Object.keys(balances);
    if (codes.length === 0) return false;
    return codes.every((code) => balances[code].credits === balances[code].debits);
  }, [balances]);

  const allRowsFilled =
    description.trim().length > 0 &&
    [...fromRows, ...toRows].every(
      (r) => r.categoryId && r.currency && Number(r.amount) > 0,
    );

  const canSave = allCurrenciesBalanced && allRowsFilled;

  function updateRow(side, id, field, value) {
    const updater = (rows) =>
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r));
    if (side === 'from') setFromRows(updater);
    else setToRows(updater);
  }

  function addRow(side) {
    const newRow = createRow();
    if (side === 'from') setFromRows((prev) => [...prev, newRow]);
    else setToRows((prev) => [...prev, newRow]);
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-row-id="${newRow.id}"]`);
      if (el) {
        const trigger = el.querySelector('[data-categoryselect] button');
        trigger?.focus();
      }
    });
  }

  function deleteRow(side, id) {
    if (side === 'from') {
      setFromRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    } else {
      setToRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
    }
  }

  function resetForm() {
    setDescription('');
    setNotes('');
    setFromRows([createRow()]);
    setToRows([createRow()]);
    setSaveError(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave || saving) return;

    setSaving(true);
    setSaveError(null);

    try {
      const transaction = {
        date,
        description: description.trim(),
        notes: notes.trim(),
        is_opening_balance: false,
        opening_balance_category_id: null,
      };

      const fromLines = fromRows
        .filter((r) => r.categoryId && Number(r.amount) > 0)
        .map((r) => ({
          category_id: r.categoryId,
          entry_type: 'credit',
          currency: r.currency,
          amount: Number(r.amount),
        }));

      const toLines = toRows
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
    const rows = side === 'from' ? fromRows : toRows;

    return (
      <div className="flex flex-col gap-2">
        {rows.map((row, index) => (
          <div key={row.id} data-row-id={row.id} className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <CategorySelect
                value={row.categoryId}
                onChange={(id) => updateRow(side, row.id, 'categoryId', id)}
                categories={categories}
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
                className="font-numeric"
              />
            </div>
            <button
              type="button"
              onClick={() => deleteRow(side, row.id)}
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

  function renderBalanceIndicator() {
    const codes = Object.keys(balances);
    if (codes.length === 0) return null;

    return (
      <div className="flex flex-wrap gap-4 px-1">
        {codes.map((code) => {
          const { credits, debits } = balances[code];
          const balanced = credits === debits;
          const isAnimating = animating.has(code);

          const lineAnimClass = isAnimating && balanced ? 'animate-pulse-once' : '';
          const symbolAnimClass = isAnimating && balanced ? 'animate-fade-cross' : '';

          function handleAnimEnd() {
            setAnimating((prev) => {
              const next = new Set(prev);
              next.delete(code);
              return next;
            });
          }

          return (
            <div
              key={code}
              onAnimationEnd={handleAnimEnd}
              className={`flex items-center gap-1.5 text-sm ${lineAnimClass}`}
            >
              <span className="text-text-secondary">Credits</span>
              <span className="font-numeric text-text-primary">{credits.toFixed(2)}</span>
              <span className={`font-numeric text-base leading-none ${symbolAnimClass} ${balanced ? 'text-income' : 'text-expense'}`}>
                {balanced ? '=' : '≠'}
              </span>
              <span className="text-text-secondary">Debits</span>
              <span className="font-numeric text-text-primary">{debits.toFixed(2)}</span>
              <span className="text-xs font-numeric text-text-tertiary">{code}</span>
            </div>
          );
        })}
      </div>
    );
  }

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

      <div className="flex items-center justify-between">
        {renderBalanceIndicator()}
      </div>

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

      {saveError && (
        <p className="text-xs text-error">{saveError}</p>
      )}

      <Button
        type="submit"
        disabled={!canSave || saving}
        title={
          !description.trim()
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
