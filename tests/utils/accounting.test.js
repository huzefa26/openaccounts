import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import useCategoryStore from '../../src/store/categoryStore';
import useTransactionStore from '../../src/store/transactionStore';

vi.mock('../../src/db/categories', () => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../../src/db/transactions', () => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));

vi.mock('../../src/db/transactionLines', () => ({
  getAll: vi.fn(),
  getById: vi.fn(),
  getByTransactionId: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deleteByTransactionId: vi.fn(),
}));

vi.mock('../../src/db/currencies', () => ({
  getAll: vi.fn(),
  getDefault: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  del: vi.fn(),
}));

import { handleOpeningBalance } from '../../src/utils/accounting';
import * as dbCategories from '../../src/db/categories';
import * as dbTransactions from '../../src/db/transactions';
import * as dbLines from '../../src/db/transactionLines';

function setupStores(categories, transactions, lines) {
  useCategoryStore.setState({ categories, loading: false, initialized: true });
  useTransactionStore.setState({ transactions, lines, loading: false, initialized: true });
}

describe('handleOpeningBalance', () => {
  beforeEach(async () => {
    await resetDB();
    await initDB();
    vi.clearAllMocks();
    useCategoryStore.setState({ categories: [] });
    useTransactionStore.setState({ transactions: [], lines: [] });
  });

  it('sets opening balance for a debit-normal category', async () => {
    const expenseCat = { id: 'cat_1', name: 'Office Supplies', type: 'expense', opening_balance: 0, is_system: false };
    const obeCat = { id: 'base_opening_balance_equity', name: 'Opening Balance Equity', type: 'equity', is_system: true };
    setupStores([expenseCat, obeCat], [], []);
    dbTransactions.create.mockResolvedValue({ id: 'new_tx' });
    dbLines.create.mockResolvedValue({});

    await handleOpeningBalance(expenseCat, 500, { code: 'USD' });

    expect(dbTransactions.create).toHaveBeenCalled();
    const createCall = dbTransactions.create.mock.calls[0][0];
    expect(createCall.is_opening_balance).toBe(true);
  });

  it('deletes opening balance transaction when new balance is 0', async () => {
    const expenseCat = { id: 'cat_2', name: 'Office Supplies', type: 'expense', opening_balance: 500 };
    const obTx = { id: 'ob_tx', is_opening_balance: true, opening_balance_category_id: 'cat_2' };
    setupStores([expenseCat], [obTx], []);
    dbLines.getAll.mockResolvedValue([]);
    dbLines.deleteByTransactionId.mockResolvedValue();

    await handleOpeningBalance(expenseCat, 0, { code: 'USD' });

    expect(dbTransactions.del).toHaveBeenCalledWith('ob_tx');
  });

  it('creates OBE category if missing', async () => {
    const expenseCat = { id: 'cat_3', name: 'Office Supplies', type: 'expense', opening_balance: 0, is_system: false };
    setupStores([expenseCat], [], []);
    dbTransactions.create.mockResolvedValue({ id: 'new_tx' });
    dbLines.create.mockResolvedValue({});

    await handleOpeningBalance(expenseCat, 300, { code: 'USD' });

    const db = await initDB();
    const created = await db.get('categories', 'base_opening_balance_equity');
    expect(created).toBeDefined();
    expect(created.is_system).toBe(true);
  });
});
