import { create } from 'zustand';
import * as googleAuth from '../sync/googleAuth';
import useToastStore from './toastStore';

const useAuthStore = create((set) => {
  const session = googleAuth.getStoredSession();

  return {
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    tokenExpiry: session?.tokenExpiry || null,
    isSignedIn: Boolean(session),
    loading: false,
    booting: Boolean(session),
    error: null,
    dbInitialized: false,

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
          booting: false,
          error: null,
        });
        useToastStore.getState().addToast({
          message: `Signed in as ${result.user.email}.`,
          type: 'success',
          duration: 3000,
        });
      } catch (err) {
        set({
          loading: false,
          booting: false,
          error: err.message,
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
        booting: false,
        dbInitialized: false,
        error: null,
      });
      useToastStore.getState().clearAll();
      useToastStore.getState().addToast({
        message: 'Signed out.',
        type: 'info',
        duration: 3000,
      });
    },

    verifySession: async () => {
      try {
        await googleAuth.verifySession();
        set({ booting: false });
      } catch {
        googleAuth.clearStorage();
        set({
          user: null,
          accessToken: null,
          tokenExpiry: null,
          isSignedIn: false,
          booting: false,
          error: null,
        });
      }
    },

    setDbInitialized: () => set({ dbInitialized: true }),

    clearError: () => set({ error: null }),
  };
});

export default useAuthStore;
