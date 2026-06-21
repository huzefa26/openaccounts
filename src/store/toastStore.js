import { create } from 'zustand';
import { TOAST_DURATION_SUCCESS, MAX_VISIBLE_TOASTS } from '../constants/app';

const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const entry = {
      id,
      key: toast.key || null,
      message: toast.message,
      type: toast.type || 'info',
      duration: toast.type === 'error' ? undefined : (toast.duration || TOAST_DURATION_SUCCESS),
      action: toast.action || null,
    };

    set((state) => {
      let toasts = state.toasts;
      if (entry.key) {
        toasts = toasts.filter((t) => t.key !== entry.key);
      }
      const updated = [...toasts, entry];
      return { toasts: updated.length > MAX_VISIBLE_TOASTS ? updated.slice(-MAX_VISIBLE_TOASTS) : updated };
    });

    if (entry.type !== 'error' && entry.duration) {
      setTimeout(() => {
        const current = get().toasts;
        if (current.some((t) => t.id === id)) {
          get().removeToast(id);
        }
      }, entry.duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => set({ toasts: [] }),
}));

export default useToastStore;
