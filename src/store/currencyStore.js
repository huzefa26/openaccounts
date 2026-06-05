import { create } from 'zustand';
import * as db from '../db/currencies';

const useCurrencyStore = create((set, get) => ({
  currencies: [],
  defaultCurrency: null,
  loading: false,
  error: null,
  initialized: false,

  invalidateCache: () => set({ initialized: false, currencies: [], defaultCurrency: null }),

  fetchAll: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      const currencies = await db.getAll();
      const defaultCurrency = currencies.find((c) => c.is_default) || null;
      set({ currencies, defaultCurrency, loading: false, initialized: true });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  addCurrency: async (data) => {
    const currency = await db.create(data);
    set((state) => ({ currencies: [...state.currencies, currency] }));
    return currency;
  },

  removeCurrency: async (code) => {
    const state = get();
    if (state.defaultCurrency?.code === code) {
      throw new Error('Cannot delete the default currency');
    }
    await db.del(code);
    set((state) => ({
      currencies: state.currencies.filter((c) => c.code !== code),
    }));
  },

  setDefaultCurrency: async (code) => {
    const state = get();
    const currentDefault = state.defaultCurrency;
    if (currentDefault) {
      await db.update(currentDefault.code, { is_default: false });
    }
    const updated = await db.update(code, { is_default: true });
    set((state) => ({
      currencies: state.currencies.map((c) =>
        c.code === code ? updated : { ...c, is_default: false },
      ),
      defaultCurrency: updated,
    }));
  },
}));

export default useCurrencyStore;
