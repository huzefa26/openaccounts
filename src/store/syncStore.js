import { create } from 'zustand';
import * as dbSettings from '../db/settings';
import { registerOnChange } from '../db/sync';
import { sync as runSyncEngine } from '../sync/syncEngine';
import { isInsufficientScopeError } from '../sync/googleDrive';
import { reAuthorizeDrive } from '../sync/googleAuth';
import useTransactionStore from './transactionStore';
import useCategoryStore from './categoryStore';
import useCurrencyStore from './currencyStore';
import useToastStore from './toastStore';
import { SYNC_DEBOUNCE_MS, TOAST_DURATION_SUCCESS, TOAST_DURATION_ERROR } from '../constants/app';

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
    }, SYNC_DEBOUNCE_MS);

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
        duration: TOAST_DURATION_SUCCESS,
      });
    } catch (err) {
      set({ status: 'error', error: err.message });
      if (isInsufficientScopeError(err)) {
        useToastStore.getState().addToast({
          message: 'Drive access was lost. Your local data is safe — re-authorise to resume syncing.',
          type: 'error',
          action: {
            label: 'Re-authorise',
            onClick: async () => {
              try {
                await reAuthorizeDrive();
                get().syncNow();
              } catch {
                // re-authorization failed — user can tap again from the same toast
              }
            },
          },
        });
      } else {
        useToastStore.getState().addToast({
          message: 'Sync failed. Try again.',
          type: 'error',
          duration: TOAST_DURATION_ERROR,
        });
      }
    }
  },

  decrementAndMaybeCancel: () => {
    const { pendingChangeCount, pendingSyncTimer } = get();
    const newCount = Math.max(0, pendingChangeCount - 1);

    if (newCount === 0) {
      if (pendingSyncTimer) clearTimeout(pendingSyncTimer);
      set({ pendingChangeCount: 0, pendingSyncTimer: null });
      return;
    }

    if (pendingSyncTimer) clearTimeout(pendingSyncTimer);

    const timer = setTimeout(async () => {
      await get().runSync();

      if (get().pendingSyncTimer === timer) {
        set(({ status, pendingChangeCount }) => ({
          pendingSyncTimer: null,
          pendingChangeCount: status === 'idle' ? 0 : pendingChangeCount,
        }));
      }
    }, SYNC_DEBOUNCE_MS);

    set({ pendingChangeCount: newCount, pendingSyncTimer: timer });
  },

  syncNow: async () => {
    if (get().status === 'syncing') return;

    const { pendingSyncTimer } = get();
    if (pendingSyncTimer) clearTimeout(pendingSyncTimer);

    set({ pendingChangeCount: 0, pendingSyncTimer: null });
    await get().runSync();
  },

  clearError: () => set({ error: null }),
}));

registerOnChange(() => {
  useSyncStore.setState((s) => ({ pendingChangeCount: s.pendingChangeCount + 1 }));
  useSyncStore.getState().schedulePendingSync();
});

export default useSyncStore;
