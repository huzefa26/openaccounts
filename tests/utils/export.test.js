import { describe, it, expect, beforeEach, vi } from 'vitest';
import { exportAllData } from '../../src/utils/export';

vi.mock('../../src/db/categories', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../src/db/transactions', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../src/db/transactionLines', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../src/db/currencies', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../src/db/settings', () => ({
  getAll: vi.fn().mockResolvedValue([]),
}));

describe('exportAllData', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', { createObjectURL: vi.fn(() => 'blob:url'), revokeObjectURL: vi.fn() });
    const mockAnchor = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    vi.stubGlobal('document', {
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
      createElement: vi.fn(() => mockAnchor),
    });
    vi.stubGlobal('Blob', vi.fn(() => ({})));
  });

  it('builds a snapshot and triggers download', async () => {
    await exportAllData();

    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalled();
    expect(document.body.removeChild).toHaveBeenCalled();
  });
});
