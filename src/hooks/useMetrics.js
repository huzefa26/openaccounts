import { useMemo } from 'react';
import useTransactionStore from '../store/transactionStore';
import useCategoryStore from '../store/categoryStore';
import useBalance from './useBalance';

function currentMonthBounds() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const firstDay = `${year}-${month}-01`;
  const lastDay = new Date(year, now.getMonth() + 1, 0).toISOString().slice(0, 10);
  return { firstDay, lastDay };
}

export default function useMetrics() {
  const { transactions, lines } = useTransactionStore();
  const { categories } = useCategoryStore();

  const accountsReceivable = categories.find((c) => c.name === 'Accounts Receivable');
  const accountsPayable = categories.find((c) => c.name === 'Accounts Payable');

  const receivables = useBalance(accountsReceivable?.id);
  const payables = useBalance(accountsPayable?.id);

  const expenses = useMemo(() => {
    const { firstDay, lastDay } = currentMonthBounds();

    const txIdsInMonth = new Set(
      transactions
        .filter((t) => t.date >= firstDay && t.date <= lastDay)
        .map((t) => t.id),
    );

    const obTxIds = new Set(
      transactions.filter((t) => t.is_opening_balance).map((t) => t.id),
    );

    const expenseCategoryIds = new Set(
      categories.filter((c) => c.type === 'expense').map((c) => c.id),
    );

    const result = {};

    for (const line of lines) {
      if (obTxIds.has(line.transaction_id)) continue;
      if (line.entry_type !== 'debit') continue;
      if (!expenseCategoryIds.has(line.category_id)) continue;
      if (!txIdsInMonth.has(line.transaction_id)) continue;

      result[line.currency] = (result[line.currency] || 0) + line.amount;
    }

    return result;
  }, [transactions, lines, categories]);

  return { expenses, receivables, payables };
}
