import { create } from 'zustand';
import * as dbTransactions from '../db/transactions';
import * as dbLines from '../db/transactionLines';
import useToastStore from './toastStore';

const useTransactionStore = create((set, get) => ({
  transactions: [],
  lines: [],
  loading: false,
  error: null,
  initialized: false,
  lastSavedTransaction: null,

  invalidateCache: () => set({ initialized: false, transactions: [], lines: [] }),

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
    const payload = { transaction: tx, lines: createdLines };
    set((state) => ({
      transactions: [...state.transactions, tx],
      lines: [...state.lines, ...createdLines],
      lastSavedTransaction: payload,
    }));
    const toastId = crypto.randomUUID();
    useToastStore.getState().addToast({
      id: toastId,
      message: 'Transaction saved.',
      type: 'success',
      duration: 5000,
      action: {
        label: 'Undo',
        onClick: async () => {
          const state = get();
          if (state.lastSavedTransaction) {
            await dbLines.deleteByTransactionId(state.lastSavedTransaction.transaction.id);
            await dbTransactions.del(state.lastSavedTransaction.transaction.id);
            set((s) => ({
              transactions: s.transactions.filter((t) => t.id !== state.lastSavedTransaction.transaction.id),
              lines: s.lines.filter((l) => l.transaction_id !== state.lastSavedTransaction.transaction.id),
              lastSavedTransaction: null,
            }));
          }
        },
      },
    });
    setTimeout(() => {
      const state = get();
      if (state.lastSavedTransaction?.transaction?.id === tx.id) {
        set({ lastSavedTransaction: null });
      }
    }, 5000);
    return payload;
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
    useToastStore.getState().addToast({
      message: 'Transaction updated.',
      type: 'success',
      duration: 3000,
    });
    return { transaction: tx, lines: updatedLines };
  },

  deleteTransaction: async (id, { suppressToast = false } = {}) => {
    await dbLines.deleteByTransactionId(id);
    await dbTransactions.del(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      lines: state.lines.filter((l) => l.transaction_id !== id),
    }));
    if (!suppressToast) {
      useToastStore.getState().addToast({
        message: 'Transaction deleted.',
        type: 'success',
        duration: 3000,
      });
    }
  },

  clearLastSavedTransaction: () => set({ lastSavedTransaction: null }),

  formRestoreState: null,

  saveFormRestoreState: (data) => set({ formRestoreState: data }),

  markFormRestored: () => set({ formRestoreState: null }),
}));

export default useTransactionStore;
