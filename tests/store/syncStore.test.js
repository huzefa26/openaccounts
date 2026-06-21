import { describe, it, expect, beforeEach, vi } from 'vitest';
import useSyncStore from '../../src/store/syncStore';

vi.mock('../../src/sync/syncEngine', () => ({
  sync: vi.fn(),
}));

vi.mock('../../src/sync/googleDrive', () => ({
  isInsufficientScopeError: vi.fn(),
}));

vi.mock('../../src/sync/googleAuth', () => ({
  reAuthorizeDrive: vi.fn(),
}));

import { sync as runSyncEngine } from '../../src/sync/syncEngine';
import { isInsufficientScopeError } from '../../src/sync/googleDrive';

describe('syncStore', () => {
  beforeEach(() => {
    useSyncStore.setState({
      status: 'idle',
      lastSynced: null,
      error: null,
      pendingChangeCount: 0,
      pendingSyncTimer: null,
    });
    vi.clearAllMocks();
  });

  it('runSync succeeds and sets idle status', async () => {
    runSyncEngine.mockResolvedValue({ lastSynced: '2026-06-22T00:00:00.000Z' });

    await useSyncStore.getState().runSync();

    const state = useSyncStore.getState();
    expect(state.status).toBe('idle');
    expect(state.lastSynced).toBe('2026-06-22T00:00:00.000Z');
    expect(state.error).toBeNull();
  });

  it('runSync with insufficient scope shows scope-loss toast', async () => {
    const scopeError = new Error('Drive API error (403): ...');
    scopeError.code = 'INSUFFICIENT_SCOPE';
    runSyncEngine.mockRejectedValue(scopeError);
    isInsufficientScopeError.mockReturnValue(true);

    await useSyncStore.getState().runSync();

    const state = useSyncStore.getState();
    expect(state.status).toBe('error');

    const toasts = (await import('../../src/store/toastStore')).default.getState().toasts;
    const scopeToast = toasts.find((t) => t.key === 'drive-access-lost');
    expect(scopeToast).toBeDefined();
    expect(scopeToast.action.label).toBe('Re-authorise');
  });

  it('runSync with generic error shows sync-failed toast', async () => {
    runSyncEngine.mockRejectedValue(new Error('Network error'));
    isInsufficientScopeError.mockReturnValue(false);

    await useSyncStore.getState().runSync();

    const state = useSyncStore.getState();
    expect(state.status).toBe('error');

    const toasts = (await import('../../src/store/toastStore')).default.getState().toasts;
    const failToast = toasts.find((t) => t.key === 'sync-failed');
    expect(failToast).toBeDefined();
  });
});
