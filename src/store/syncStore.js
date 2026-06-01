import { create } from 'zustand';
import * as dbSettings from '../db/settings';
import { sync as runSyncEngine } from '../sync/syncEngine';

const useSyncStore = create((set) => ({
  status: 'idle',
  lastSynced: null,
  error: null,

  loadLastSynced: async () => {
    try {
      const ts = await dbSettings.get('last_synced_at');
      if (ts) set({ lastSynced: ts });
    } catch {
      // non-fatal
    }
  },

  runSync: async () => {
    set({ status: 'syncing', error: null });
    try {
      const { lastSynced } = await runSyncEngine();
      set({ status: 'idle', lastSynced, error: null });
    } catch (err) {
      set({ status: 'error', error: err.message });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useSyncStore;
