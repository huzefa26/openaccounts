import { useEffect, useMemo } from 'react';
import TransactionForm from '../components/transactions/TransactionForm';
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

function RecentTransactions({ transactions, lines }) {
  const recent = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return b.created_at.localeCompare(a.created_at);
      })
      .slice(0, 5);
  }, [transactions]);

  function debitTotals(txId) {
    const byCurrency = {};
    for (const line of lines) {
      if (line.transaction_id !== txId || line.entry_type !== 'debit') continue;
      byCurrency[line.currency] = (byCurrency[line.currency] || 0) + line.amount;
    }
    return byCurrency;
  }

  if (recent.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-text-primary mb-3">Recent Transactions</h2>
      <div className="border border-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-bg">
              <th scope="col" className="py-2 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-28">Date</th>
              <th scope="col" className="py-2 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Description</th>
              <th scope="col" className="py-2 px-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Amount</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((tx) => {
              const totals = debitTotals(tx.id);
              return (
                <tr key={tx.id} className="border-b border-border last:border-b-0 hover:bg-accent-light/40 transition-colors duration-base">
                  <td className="py-2.5 px-3 text-sm font-numeric text-text-primary whitespace-nowrap">{tx.date}</td>
                  <td className="py-2.5 px-3 text-sm text-text-primary">{tx.description}</td>
                  <td className="py-2.5 px-3 text-sm font-numeric text-right text-text-primary">
                    {Object.keys(totals).length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {Object.entries(totals).map(([currency, amount]) => (
                          <div key={currency} className="flex items-center justify-end gap-2">
                            <span className="text-xs text-text-tertiary font-numeric">{currency}</span>
                            <span className="w-24 text-right font-numeric">
                              {Number(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-text-disabled">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Home() {
  const { transactions, lines, fetchAll: fetchTransactions } = useTransactionStore();
  const { expenses, receivables, payables } = useMetrics();
  const { fetchAll: fetchCategories } = useCategoryStore();
  const { fetchAll: fetchCurrencies } = useCurrencyStore();

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
    fetchCurrencies();
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="h-4" />
      <TransactionForm />

      <div className="flex flex-wrap gap-4 mt-8 mb-8">
        <MetricCard title="Total Expenses This Month" amounts={expenses} color="text-expense" />
        <MetricCard title="Receivables" amounts={receivables} />
        <MetricCard title="Payables" amounts={payables} />
      </div>

      <RecentTransactions transactions={transactions} lines={lines} />
    </div>
  );
}
