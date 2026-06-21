import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import useTransactionStore from '../../src/store/transactionStore';

vi.mock('../../src/db/transactions', () => {
  const actual = vi.importActual('../../src/db/transactions');
  return actual;
});

vi.mock('../../src/db/transactionLines', () => {
  const actual = vi.importActual('../../src/db/transactionLines');
  return actual;
});

describe('transactionStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDB();
    await initDB();
    useTransactionStore.setState({ transactions: [], lines: [], loading: false, error: null, initialized: false });
  });

  it('createTransaction adds to state and database', async () => {
    const result = await useTransactionStore.getState().createTransaction({
      transaction: { date: '2026-06-22', description: 'Test sale' },
      lines: [
        { entry_type: 'debit', category_id: 'cat_a', amount: 100, currency: 'USD' },
        { entry_type: 'credit', category_id: 'cat_b', amount: 100, currency: 'USD' },
      ],
    }, { notify: false });

    expect(result.transaction.id).toBeDefined();
    expect(result.transaction.description).toBe('Test sale');
    expect(result.lines).toHaveLength(2);

    const state = useTransactionStore.getState();
    expect(state.transactions).toHaveLength(1);
    expect(state.lines).toHaveLength(2);
  });

  it('deleteTransaction removes from state and database', async () => {
    const { transaction } = await useTransactionStore.getState().createTransaction({
      transaction: { date: '2026-06-22', description: 'To delete' },
      lines: [{ entry_type: 'debit', category_id: 'cat_a', amount: 50, currency: 'USD' }],
    }, { notify: false });

    await useTransactionStore.getState().deleteTransaction(transaction.id, { notify: false });

    const state = useTransactionStore.getState();
    expect(state.transactions).toHaveLength(0);
    expect(state.lines).toHaveLength(0);
  });
});
