import { create } from 'zustand';
import * as db from '../db/categories';

const useCategoryStore = create((set, get) => ({
  categories: [],
  loading: false,
  error: null,
  initialized: false,

  fetchAll: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      const categories = await db.getAll();
      set({ categories, loading: false, initialized: true });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createCategory: async (data) => {
    const category = await db.create(data);
    set((state) => ({ categories: [...state.categories, category] }));
    return category;
  },

  updateCategory: async (id, data) => {
    const updated = await db.update(id, data);
    set((state) => ({
      categories: state.categories.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },

  deleteCategory: async (id) => {
    await db.del(id);
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }));
  },
}));

export default useCategoryStore;
