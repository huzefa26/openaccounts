import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import { seedFirstRun } from '../../src/db/seed';
import * as dbCategories from '../../src/db/categories';
import { buildCategory } from '../helpers/factories';

describe('categories db', () => {
  beforeEach(async () => {
    await resetDB();
    const db = await initDB();
    await seedFirstRun(db);
  });

  it('creates a category with generated id and timestamps', async () => {
    const cat = await dbCategories.create(buildCategory({ name: 'Custom Category' }));
    expect(cat.id).toBeDefined();
    expect(cat.created_at).toBeDefined();
    expect(cat.updated_at).toBeDefined();
    expect(cat.name).toBe('Custom Category');
  });

  it('rejects duplicate names case-insensitively', async () => {
    await dbCategories.create(buildCategory({ name: 'Custom Category' }));
    await expect(
      dbCategories.create(buildCategory({ name: 'custom category' }))
    ).rejects.toThrow('already exists');
  });

  it('rejects rename to a taken name', async () => {
    await dbCategories.create(buildCategory({ name: 'Custom Category' }));
    const cat2 = await dbCategories.create(buildCategory({ name: 'Another Category' }));
    await expect(
      dbCategories.update(cat2.id, { name: 'custom category' })
    ).rejects.toThrow('already exists');
  });

  it('prevents editing system categories', async () => {
    const all = await dbCategories.getAll();
    const sysCat = all.find((c) => c.is_system);
    await expect(
      dbCategories.update(sysCat.id, { name: 'Changed' })
    ).rejects.toThrow('cannot be edited');
  });

  it('prevents deleting system categories', async () => {
    const all = await dbCategories.getAll();
    const sysCat = all.find((c) => c.is_system);
    await expect(
      dbCategories.del(sysCat.id)
    ).rejects.toThrow('cannot be deleted');
  });
});
