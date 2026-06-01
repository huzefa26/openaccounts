import { useEffect } from 'react';
import TransactionForm from '../components/forms/TransactionForm';
import useMetrics from '../hooks/useMetrics';
import useCategoryStore from '../store/categoryStore';
import useTransactionStore from '../store/transactionStore';
import useCurrencyStore from '../store/currencyStore';

function MetricCard({ title, amounts, color }) {
  const isEmpty = !amounts || Object.keys(amounts).length === 0;
  return (
    <div className="flex-1 min-w-[200px] border border-border rounded-md p-4">
      <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">{title}</h3>
      {isEmpty ? (
        <span className="text-sm text-text-disabled font-numeric">—</span>
      ) : (
        <div className="flex flex-col gap-1">
          {Object.entries(amounts).map(([currency, amount]) => (
            <div key={currency} className="flex items-center gap-2 text-sm font-numeric">
              <span className="text-xs text-text-tertiary w-8 text-right">{currency}</span>
              <span className={color || 'text-text-primary'}>
                {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { expenses, receivables, payables } = useMetrics();
  const { fetchAll: fetchCategories } = useCategoryStore();
  const { fetchAll: fetchTransactions } = useTransactionStore();
  const { fetchAll: fetchCurrencies } = useCurrencyStore();

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    fetchCurrencies();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Home</h1>

      <div className="flex flex-wrap gap-4 mb-8">
        <MetricCard title="Total Expenses This Month" amounts={expenses} color="text-expense" />
        <MetricCard title="Receivables" amounts={receivables} />
        <MetricCard title="Payables" amounts={payables} />
      </div>

      <TransactionForm />
    </div>
  );
}
