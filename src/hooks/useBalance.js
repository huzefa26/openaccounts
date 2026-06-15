import { useMemo } from 'react';
import useCategoryStore from '../store/categoryStore';
import useTransactionStore from '../store/transactionStore';
import useCurrencyStore from '../store/currencyStore';

const DEBIT_NORMAL_TYPES = ['asset', 'expense'];
const CREDIT_NORMAL_TYPES = ['liability', 'equity', 'income'];

function getDescendantIds(id, categories) {
  const children = categories.filter((c) => c.parent_id === id);
  const grandchildren = children.flatMap((c) => getDescendantIds(c.id, categories));
  return [...children.map((c) => c.id), ...grandchildren];
}

export default function useBalance(categoryId) {
  const { categories } = useCategoryStore();
  const { lines, transactions } = useTransactionStore();
  const { defaultCurrency } = useCurrencyStore();

  return useMemo(() => {
    const category = categories.find((c) => c.id === categoryId);
    if (!category) return {};

    const allIds = [categoryId, ...getDescendantIds(categoryId, categories)];
    const isDebitNormal = DEBIT_NORMAL_TYPES.includes(category.type);
    const openingBalance = category.opening_balance || 0;
    const homeCurrency = defaultCurrency?.code || '';

    const obTxIds = new Set(
      transactions.filter((t) => t.is_opening_balance).map((t) => t.id),
    );

    const balanceMap = {};

    for (const line of lines) {
      if (obTxIds.has(line.transaction_id)) continue;
      if (!allIds.includes(line.category_id)) continue;

      if (!balanceMap[line.currency]) {
        balanceMap[line.currency] = 0;
      }

      if (isDebitNormal) {
        balanceMap[line.currency] += line.entry_type === 'debit' ? line.amount : -line.amount;
      } else {
        balanceMap[line.currency] += line.entry_type === 'credit' ? line.amount : -line.amount;
      }
    }

    if (homeCurrency && openingBalance) {
      if (balanceMap[homeCurrency] !== undefined) {
        balanceMap[homeCurrency] += openingBalance;
      } else {
        balanceMap[homeCurrency] = openingBalance;
      }
    }

    return balanceMap;
  }, [categoryId, categories, lines, transactions, defaultCurrency]);
}
