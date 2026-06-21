import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import { seedFirstRun } from '../../src/db/seed';
import { buildSnapshot, populateFromSnapshot } from '../../src/db/snapshot';
import { buildCategory, buildTransaction } from '../helpers/factories';

describe('snapshot', () => {
  beforeEach(async () => {
    await resetDB();
  });

  it('buildSnapshot wraps data with version and exported_at', () => {
    const data = { categories: [], transactions: [], transaction_lines: [], currencies: [], settings: [] };
    const snap = buildSnapshot(data);
    expect(snap.version).toBe(2);
    expect(snap.exported_at).toBeDefined();
    expect(snap.categories).toEqual([]);
  });

  it('populateFromSnapshot replaces all existing data', async () => {
    const db = await initDB();
    await seedFirstRun(db);

    const replacement = buildCategory({ id: 'cat_new', name: 'Replacement' });
    await populateFromSnapshot(db, {
      categories: [replacement],
      transactions: [],
      transaction_lines: [],
      currencies: [],
      settings: [],
    });

    const cats = await db.getAll('categories');
    expect(cats).toHaveLength(1);
    expect(cats[0].id).toBe('cat_new');
  });

  it('populateFromSnapshot skips empty stores without error', async () => {
    const db = await initDB();
    await seedFirstRun(db);

    await populateFromSnapshot(db, {
      categories: [],
      transactions: [],
      transaction_lines: [],
      currencies: [],
      settings: [],
    });

    const cats = await db.getAll('categories');
    expect(cats).toHaveLength(22);
  });

  it('snapshot round-trips losslessly', async () => {
    const db = await initDB();
    await seedFirstRun(db);
    const origCats = await db.getAll('categories');

    const data = { categories: origCats, transactions: [], transaction_lines: [], currencies: await db.getAll('currencies'), settings: await db.getAll('settings') };
    const snap = buildSnapshot(data);

    await populateFromSnapshot(db, snap);

    const restored = await db.getAll('categories');
    expect(restored).toEqual(origCats);
  });
});
