import { create } from 'zustand';
import * as db from '../db/settings';

const useSettingsStore = create((set, get) => ({
  settings: {},
  loading: false,
  error: null,
  initialized: false,

  fetchAll: async () => {
    if (get().initialized) return;
    set({ loading: true, error: null });
    try {
      const records = await db.getAll();
      const settings = {};
      for (const record of records) {
        settings[record.key] = JSON.parse(record.value);
      }
      set({ settings, loading: false, initialized: true });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getSetting: (key) => {
    return get().settings[key];
  },

  setSetting: async (key, value) => {
    await db.set(key, value);
    set((state) => ({
      settings: { ...state.settings, [key]: value },
    }));
  },
}));

export default useSettingsStore;
