import { describe, it, expect, beforeEach, vi } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import { seedFirstRun } from '../../src/db/seed';
import useCategoryStore from '../../src/store/categoryStore';

vi.mock('../../src/db/categories', () => {
  const actual = vi.importActual('../../src/db/categories');
  return actual;
});

describe('categoryStore', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await resetDB();
    await initDB();
    useCategoryStore.setState({ categories: [], loading: false, error: null, initialized: false });
  });

  it('fetchAll loads categories from the database', async () => {
    const db = await initDB();
    await seedFirstRun(db);

    await useCategoryStore.getState().fetchAll();
    const state = useCategoryStore.getState();
    expect(state.categories.length).toBe(22);
    expect(state.initialized).toBe(true);
  });

  it('fetchAll is a no-op when already initialized', async () => {
    useCategoryStore.setState({ initialized: true, categories: ['stub'] });

    await useCategoryStore.getState().fetchAll();
    expect(useCategoryStore.getState().categories).toEqual(['stub']);
  });

  it('invalidateCache resets initialized flag', () => {
    useCategoryStore.setState({ initialized: true, categories: ['a'] });
    useCategoryStore.getState().invalidateCache();
    expect(useCategoryStore.getState().initialized).toBe(false);
    expect(useCategoryStore.getState().categories).toEqual([]);
  });
});
