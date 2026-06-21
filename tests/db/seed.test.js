import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import { seedFirstRun } from '../../src/db/seed';

describe('seed', () => {
  beforeEach(async () => {
    await resetDB();
  });

  it('seedFirstRun creates categories, currencies, and settings', async () => {
    const db = await initDB();
    await seedFirstRun(db);

    const categories = await db.getAll('categories');
    expect(categories.length).toBe(22);

    const currencies = await db.getAll('currencies');
    expect(currencies.length).toBe(8);

    const settings = await db.getAll('settings');
    expect(settings.length).toBe(2);
  });
});
