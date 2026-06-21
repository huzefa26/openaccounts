import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useBalance from '../../src/hooks/useBalance';
import useCategoryStore from '../../src/store/categoryStore';
import useTransactionStore from '../../src/store/transactionStore';
import useCurrencyStore from '../../src/store/currencyStore';

describe('useBalance', () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [
        { id: 'income_1', name: 'Salary', type: 'income', opening_balance: 0 },
        { id: 'expense_1', name: 'Groceries', type: 'expense', opening_balance: 0 },
        { id: 'eq_1', name: 'Equity', type: 'equity', opening_balance: 100 },
      ],
    });
    useTransactionStore.setState({
      transactions: [
        { id: 'tx_1', date: '2026-06-01', description: 'Earned', is_opening_balance: false },
        { id: 'tx_2', date: '2026-06-02', description: 'Spent', is_opening_balance: false },
      ],
      lines: [
        { id: 'l1', transaction_id: 'tx_1', category_id: 'income_1', entry_type: 'credit', amount: 500, currency: 'USD' },
        { id: 'l2', transaction_id: 'tx_2', category_id: 'expense_1', entry_type: 'debit', amount: 100, currency: 'USD' },
      ],
    });
    useCurrencyStore.setState({
      currencies: [{ code: 'USD', is_default: true }],
      defaultCurrency: { code: 'USD' },
    });
  });

  it('returns balance for an income category', () => {
    const { result } = renderHook(() => useBalance('income_1'));
    expect(result.current.USD).toBe(500);
  });

  it('returns balance for an expense category', () => {
    const { result } = renderHook(() => useBalance('expense_1'));
    expect(result.current.USD).toBe(100);
  });

  it('includes opening balance in home currency', () => {
    const { result } = renderHook(() => useBalance('eq_1'));
    expect(result.current.USD).toBe(100);
  });
});
