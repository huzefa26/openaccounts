import 'fake-indexeddb/auto';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});
