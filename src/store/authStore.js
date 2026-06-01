import { create } from 'zustand';

const useAuthStore = create(() => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null,
  isSignedIn: false,
}));

export default useAuthStore;
