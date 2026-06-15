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

  createTransaction: async ({ transaction, lines }, { notify = true } = {}) => {
    const tx = await dbTransactions.create(transaction);
    const createdLines = await Promise.all(
      lines.map((line) => dbLines.create({ ...line, transaction_id: tx.id })),
    );
    const payload = { transaction: tx, lines: createdLines };
    set((state) => ({
      transactions: [...state.transactions, tx],
      lines: [...state.lines, ...createdLines],
    }));

    if (notify) {
      set({ lastSavedTransaction: payload });
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
            const { transaction, lines } = state.lastSavedTransaction || {};
            if (transaction && lines) {
              await dbLines.deleteByTransactionId(transaction.id);
              await dbTransactions.del(transaction.id, { suppressSync: true });
              const { default: useSyncStore } = await import('./syncStore');
              useSyncStore.getState().decrementAndMaybeCancel();
              set((s) => ({
                transactions: s.transactions.filter((t) => t.id !== transaction.id),
                lines: s.lines.filter((l) => l.transaction_id !== transaction.id),
                lastSavedTransaction: null,
                undoRestoreState: {
                  date: transaction.date,
                  description: transaction.description,
                  notes: transaction.notes || '',
                  fromRows: lines
                    .filter((l) => l.entry_type === 'credit')
                    .map((l) => ({ id: crypto.randomUUID(), categoryId: l.category_id, currency: l.currency, amount: String(l.amount) })),
                  toRows: lines
                    .filter((l) => l.entry_type === 'debit')
                    .map((l) => ({ id: crypto.randomUUID(), categoryId: l.category_id, currency: l.currency, amount: String(l.amount) })),
                },
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
    }

    return payload;
  },

  updateTransaction: async (id, { transaction, lines }, { notify = true } = {}) => {
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
    if (notify) {
      useToastStore.getState().addToast({
        message: 'Transaction updated.',
        type: 'success',
        duration: 3000,
      });
    }
    return { transaction: tx, lines: updatedLines };
  },

  deleteTransaction: async (id, { notify = true } = {}) => {
    await dbLines.deleteByTransactionId(id);
    await dbTransactions.del(id);
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
      lines: state.lines.filter((l) => l.transaction_id !== id),
    }));
    if (notify) {
      useToastStore.getState().addToast({
        message: 'Transaction deleted.',
        type: 'success',
        duration: 3000,
      });
    }
  },

  formRestoreState: null,

  saveFormRestoreState: (data) => set({ formRestoreState: data }),

  markFormRestored: () => set({ formRestoreState: null }),

  undoRestoreState: null,

  clearUndoRestoreState: () => set({ undoRestoreState: null }),
}));

export default useTransactionStore;
