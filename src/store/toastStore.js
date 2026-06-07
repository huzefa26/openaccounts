import { create } from 'zustand';

const useToastStore = create((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = crypto.randomUUID();
    const entry = {
      id,
      message: toast.message,
      type: toast.type || 'info',
      duration: toast.type === 'error' ? undefined : (toast.duration || 3000),
      action: toast.action || null,
    };

    set((state) => {
      const updated = [...state.toasts, entry];
      return { toasts: updated.length > 3 ? updated.slice(-3) : updated };
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
