import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useMetrics from '../../src/hooks/useMetrics';
import useCategoryStore from '../../src/store/categoryStore';
import useTransactionStore from '../../src/store/transactionStore';
import useCurrencyStore from '../../src/store/currencyStore';

describe('useMetrics', () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [
        { id: 'expense_1', name: 'Groceries', type: 'expense' },
        { id: 'expense_2', name: 'Rent', type: 'expense' },
        { id: 'ar', name: 'Accounts Receivable', type: 'asset' },
        { id: 'ap', name: 'Accounts Payable', type: 'liability' },
      ],
    });
    useTransactionStore.setState({
      transactions: [
        { id: 'tx_1', date: new Date().toISOString().slice(0, 10), description: 'Market run', is_opening_balance: false },
        { id: 'tx_2', date: new Date().toISOString().slice(0, 10), description: 'Rent', is_opening_balance: false },
        { id: 'tx_ob', date: new Date().toISOString().slice(0, 10), description: 'OB', is_opening_balance: true },
      ],
      lines: [
        { id: 'l1', transaction_id: 'tx_1', category_id: 'expense_1', entry_type: 'debit', amount: 80, currency: 'USD' },
        { id: 'l2', transaction_id: 'tx_2', category_id: 'expense_2', entry_type: 'debit', amount: 1000, currency: 'USD' },
        { id: 'l3', transaction_id: 'tx_ob', category_id: 'expense_1', entry_type: 'debit', amount: 200, currency: 'USD' },
      ],
    });
    useCurrencyStore.setState({
      currencies: [{ code: 'USD', is_default: true }],
      defaultCurrency: { code: 'USD' },
    });
  });

  it('aggregates expense totals for the current month', () => {
    const { result } = renderHook(() => useMetrics());
    expect(result.current.expenses.USD).toBe(1080);
  });

  it('excludes opening balance transactions from expenses', () => {
    const { result } = renderHook(() => useMetrics());
    expect(result.current.expenses.USD).toBe(1080);
  });
});
