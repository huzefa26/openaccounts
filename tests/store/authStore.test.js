import { describe, it, expect, beforeEach, vi } from 'vitest';
import useAuthStore from '../../src/store/authStore';

vi.mock('../../src/sync/googleAuth', () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  verifySession: vi.fn(),
  getStoredSession: vi.fn(() => null),
  clearStorage: vi.fn(),
}));

import * as googleAuth from '../../src/sync/googleAuth';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      tokenExpiry: null,
      isSignedIn: false,
      loading: false,
      booting: false,
      error: null,
      authError: null,
      dbInitialized: false,
    });
    vi.clearAllMocks();
  });

  it('signIn succeeds and sets user state', async () => {
    googleAuth.signIn.mockResolvedValue({
      user: { email: 'test@example.com', name: 'Test' },
      accessToken: 'token',
      tokenExpiry: 9999999999999,
    });

    await useAuthStore.getState().signIn();

    const state = useAuthStore.getState();
    expect(state.isSignedIn).toBe(true);
    expect(state.user.email).toBe('test@example.com');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.authError).toBeNull();
  });

  it('signIn with ACCESS_DENIED sets authError', async () => {
    googleAuth.signIn.mockRejectedValue(new Error('ACCESS_DENIED'));

    await useAuthStore.getState().signIn();

    const state = useAuthStore.getState();
    expect(state.isSignedIn).toBe(false);
    expect(state.authError).toBe('Google permissions are required to use OpenAccounts.');
    expect(state.error).toBeNull();
  });

  it('signIn with generic error sets error', async () => {
    googleAuth.signIn.mockRejectedValue(new Error('Network failure'));

    await useAuthStore.getState().signIn();

    const state = useAuthStore.getState();
    expect(state.isSignedIn).toBe(false);
    expect(state.error).toBe('Network failure');
    expect(state.authError).toBeNull();
  });

  it('signOut clears user state', async () => {
    useAuthStore.setState({ user: { email: 'test@example.com' }, isSignedIn: true });

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.isSignedIn).toBe(false);
    expect(state.user).toBeNull();
  });
});
