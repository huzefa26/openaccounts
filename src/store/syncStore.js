import { create } from 'zustand';

const useSyncStore = create(() => ({
  status: 'idle',
  lastSynced: null,
  error: null,
}));

export default useSyncStore;
