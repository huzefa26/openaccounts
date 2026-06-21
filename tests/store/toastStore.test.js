import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import useToastStore from '../../src/store/toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it('addToast appends a toast', () => {
    useToastStore.getState().addToast({ message: 'Hello', type: 'info' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe('Hello');
  });

  it('addToast with a key replaces an existing toast with the same key', () => {
    useToastStore.getState().addToast({ key: 'sync', message: 'First', type: 'error' });
    useToastStore.getState().addToast({ key: 'sync', message: 'Second', type: 'error' });
    expect(useToastStore.getState().toasts).toHaveLength(1);
    expect(useToastStore.getState().toasts[0].message).toBe('Second');
  });

  it('addToast with a new key appends alongside existing toasts', () => {
    useToastStore.getState().addToast({ key: 'a', message: 'A', type: 'info' });
    useToastStore.getState().addToast({ key: 'b', message: 'B', type: 'info' });
    expect(useToastStore.getState().toasts).toHaveLength(2);
  });

  it('removeToast removes the toast with the given id', () => {
    useToastStore.getState().addToast({ message: 'Test', type: 'info' });
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().removeToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('clearAll empties the queue', () => {
    useToastStore.getState().addToast({ message: 'A', type: 'info' });
    useToastStore.getState().addToast({ message: 'B', type: 'info' });
    useToastStore.getState().clearAll();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it('MAX_VISIBLE_TOASTS limits visible toasts', () => {
    for (let i = 0; i < 5; i++) {
      useToastStore.getState().addToast({ message: `Toast ${i}`, type: 'error' });
    }
    expect(useToastStore.getState().toasts.length).toBeLessThanOrEqual(3);
  });
});
