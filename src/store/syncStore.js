import { create } from 'zustand';
import * as dbSettings from '../db/settings';
import { sync as runSyncEngine } from '../sync/syncEngine';
import useTransactionStore from './transactionStore';
import useCategoryStore from './categoryStore';
import useCurrencyStore from './currencyStore';
import useToastStore from './toastStore';

const useSyncStore = create((set, get) => ({
  status: 'idle',
  lastSynced: null,
  error: null,
  pendingChangeCount: 0,
  pendingSyncTimer: null,

  loadLastSynced: async () => {
    try {
      const ts = await dbSettings.get('last_synced_at');
      if (ts) set({ lastSynced: ts });
    } catch {
      // non-fatal
    }
  },

  schedulePendingSync: () => {
    const { pendingSyncTimer } = get();
    if (pendingSyncTimer) clearTimeout(pendingSyncTimer);

    const timer = setTimeout(async () => {
      await get().runSync();

      if (get().pendingSyncTimer === timer) {
        set(({ status, pendingChangeCount }) => ({
          pendingSyncTimer: null,
          pendingChangeCount: status === 'idle' ? 0 : pendingChangeCount,
        }));
      }
    }, 30000);

    set({ pendingSyncTimer: timer });
  },

  runSync: async () => {
    set({ status: 'syncing', error: null });
    try {
      const { lastSynced } = await runSyncEngine(get().lastSynced);

      useTransactionStore.getState().invalidateCache();
      useCategoryStore.getState().invalidateCache();
      useCurrencyStore.getState().invalidateCache();

      await Promise.all([
        useTransactionStore.getState().fetchAll(),
        useCategoryStore.getState().fetchAll(),
        useCurrencyStore.getState().fetchAll(),
      ]);

      set({ status: 'idle', lastSynced, error: null });
      useToastStore.getState().addToast({
        message: 'Sync complete.',
        type: 'success',
        duration: 3000,
      });
    } catch (err) {
      set({ status: 'error', error: err.message });
      useToastStore.getState().addToast({
        message: 'Sync failed. Try again.',
        type: 'error',
        duration: 5000,
      });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useSyncStore;
