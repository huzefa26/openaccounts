import { create } from 'zustand';
import * as dbTransactions from '../db/transactions';
import * as dbLines from '../db/transactionLines';

const useTransactionStore = create((set, get) => ({
  transactions: [],
  lines: [],
  loading: false,
  error: null,
  initialized: false,

  fetchAll: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      const [transactions, lines] = await Promise.all([
        dbTransactions.getAll(),
        dbLines.getAll(),
      ]);
      set({ transactions, lines, loading: false, initialized: true });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getLinesByTransactionId: (transactionId) => {
    return get().lines.filter((l) => l.transaction_id === transactionId);
  },

  createTransaction: async ({ transaction, lines }) => {
    const tx = await dbTransactions.create(transaction);
    const createdLines = await Promise.all(
      lines.map((line) => dbLines.create({ ...line, transaction_id: tx.id })),
    );
    set((state) => ({
      transactions: [...state.transactions, tx],
      lines: [...state.lines, ...createdLines],
    }));
    return { transaction: tx, lines: createdLines };
  },

  updateTransaction: async (id, { transaction, lines }) => {
    const tx = await dbTransactions.update(id, transaction);
    await dbLines.deleteByTransactionId(id);
    const updatedLines = await Promise.all(
      lines.map((line) => dbLines.create({ ...line, transaction_id: id })),
    );
    set((state) => ({
      transactions: state.transactions.map((t) => (t.id === id ? tx : t)),
      lines: [
        ...state.lines.filter((l) => l.transaction_id !== id),
        ...updatedLines,
      ],
    }));
    return { transaction: tx, lines: updatedLines };
  },

  deleteTransaction: async (id) => {
    await dbLines.deleteByTransactionId(id);
    await dbTransactions.del(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      lines: state.lines.filter((l) => l.transaction_id !== id),
    }));
  },
}));

export default useTransactionStore;
