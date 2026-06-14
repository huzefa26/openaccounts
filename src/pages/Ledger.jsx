import { useEffect, useState, useMemo } from 'react';
import useTransactionStore from '../store/transactionStore';
import useCategoryStore from '../store/categoryStore';
import useCurrencyStore from '../store/currencyStore';
import LedgerTable from '../components/tables/LedgerTable';
import FilterBar from '../components/layout/FilterBar';
import Modal from '../components/ui/Modal';
import TransactionForm from '../components/forms/TransactionForm';

const PAGE_SIZE = 20;

function defaultFilters() {
  return {
    dateFrom: '',
    dateTo: '',
    categoryIds: [],
    typeIds: [],
    currencyCodes: [],
    amountMin: '',
    amountMax: '',
    description: '',
  };
}

function matchesTransaction(tx, lines, filters, categories) {
  if (filters.dateFrom && tx.date < filters.dateFrom) return false;
  if (filters.dateTo && tx.date > filters.dateTo) return false;

  if (filters.description) {
    const q = filters.description.toLowerCase();
    if (!tx.description.toLowerCase().includes(q)) return false;
  }

  if (!filters.amountMin && !filters.amountMax && !filters.categoryIds.length &&
      !filters.typeIds.length && !filters.currencyCodes.length) {
    return true;
  }

  return lines.some((line) => {
    if (line.transaction_id !== tx.id) return false;

    if (filters.amountMin && Number(line.amount) < Number(filters.amountMin)) return false;
    if (filters.amountMax && Number(line.amount) > Number(filters.amountMax)) return false;

    if (filters.categoryIds.length && !filters.categoryIds.includes(line.category_id)) return false;

    if (filters.currencyCodes.length && !filters.currencyCodes.includes(line.currency)) return false;

    if (filters.typeIds.length) {
      const cat = categories.find((c) => c.id === line.category_id);
      if (!cat || !filters.typeIds.includes(cat.type)) return false;
    }

    return true;
  });
}

export default function Ledger() {
  const { transactions, lines, fetchAll: fetchTransactions, deleteTransaction } = useTransactionStore();
  const { categories, fetchAll: fetchCategories } = useCategoryStore();
  const { currencies, fetchAll: fetchCurrencies } = useCurrencyStore();
  const [filters, setFilters] = useState(defaultFilters);
  const [page, setPage] = useState(1);
  const [editingTx, setEditingTx] = useState(null);
  const [editingLines, setEditingLines] = useState(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
    fetchCurrencies();
  }, []);

  function handleFilterChange(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  }

  function clearFilters() {
    setFilters(defaultFilters());
    setPage(1);
  }

  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateCmp = b.date.localeCompare(a.date);
      if (dateCmp !== 0) return dateCmp;
      return b.created_at.localeCompare(a.created_at);
    });
  }, [transactions]);

  const filtered = useMemo(() => {
    return sorted.filter((tx) => {
      const txLines = lines.filter((l) => l.transaction_id === tx.id);
      return matchesTransaction(tx, txLines, filters, categories);
    });
  }, [sorted, lines, filters, categories]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function handleEdit(tx, txLines) {
    setEditingTx(tx);
    setEditingLines(txLines);
  }

  function handleDelete(id) {
    deleteTransaction(id);
  }

  function handleEditSuccess() {
    setEditingTx(null);
    setEditingLines(null);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="h-4" />
      <div className="mb-4">
        <FilterBar
          filters={filters}
          categories={categories}
          currencies={currencies}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
        />
      </div>

      <LedgerTable
        transactions={paginated}
        lines={lines}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        page={safePage}
        totalPages={totalPages}
        onPageChange={setPage}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
      />

      {editingTx && (
        <Modal open onClose={() => setEditingTx(null)} title="Edit Transaction">
          <TransactionForm
            initialTransaction={editingTx}
            initialLines={editingLines}
            onSuccess={handleEditSuccess}
          />
        </Modal>
      )}
    </div>
  );
}
