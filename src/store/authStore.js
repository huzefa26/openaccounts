import { create } from 'zustand';
import * as googleAuth from '../sync/googleAuth';

const useAuthStore = create((set, get) => {
  const session = googleAuth.getStoredSession();

  return {
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    tokenExpiry: session?.tokenExpiry || null,
    isSignedIn: Boolean(session),
    loading: false,
    error: null,

    signIn: async () => {
      set({ loading: true, error: null });
      try {
        const result = await googleAuth.signIn();
        set({
          user: result.user,
          accessToken: result.accessToken,
          tokenExpiry: result.tokenExpiry,
          isSignedIn: true,
          loading: false,
          error: null,
        });
      } catch (err) {
        set({
          loading: false,
          error: err.message,
          user: null,
          accessToken: null,
          tokenExpiry: null,
          isSignedIn: false,
        });
      }
    },

    signOut: async () => {
      set({ loading: true });
      try {
        await googleAuth.signOut();
      } catch {
        // revoke errors are non-fatal; clear locally regardless
      }
      set({
        user: null,
        accessToken: null,
        tokenExpiry: null,
        isSignedIn: false,
        loading: false,
        error: null,
      });
    },

    clearError: () => set({ error: null }),
  };
});

export default useAuthStore;
