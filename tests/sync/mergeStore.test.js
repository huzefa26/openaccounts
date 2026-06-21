import { describe, it, expect, beforeEach } from 'vitest';
import { initDB, resetDB } from '../../src/db/index';
import { seedFirstRun } from '../../src/db/seed';
import { vi } from 'vitest';
import { buildCategory } from '../helpers/factories';

vi.mock('../../src/sync/googleDrive', () => ({
  findFile: vi.fn(),
  readFile: vi.fn(),
  createFile: vi.fn(),
  updateFile: vi.fn(),
}));

import { sync } from '../../src/sync/syncEngine';
import * as googleDrive from '../../src/sync/googleDrive';

async function seedBase() {
  const db = await initDB();
  await seedFirstRun(db);
  return db;
}

function putCategory(db, cat) {
  return db.put('categories', cat);
}

describe('sync merge', () => {
  beforeEach(async () => {
    await resetDB();
    vi.clearAllMocks();
  });

  it('keeps local record when remote has none', async () => {
    const db = await seedBase();
    const cat = buildCategory({ id: 'cat_local', name: 'Local Cat' });
    await putCategory(db, cat);

    googleDrive.findFile.mockResolvedValue(null);
    googleDrive.createFile.mockResolvedValue({ id: 'new_file' });

    const result = await sync(null);

    expect(result.lastSynced).toBeDefined();
    const uploaded = googleDrive.createFile.mock.calls[0][0];
    expect(uploaded.categories.find((c) => c.id === 'cat_local')).toBeDefined();
  }, 15000);

  it('imports remote record when local has none and remote is newer than lastSyncedAt', async () => {
    await seedBase();
    const remoteCat = buildCategory({ id: 'cat_remote_1', name: 'Remote Category', updated_at: '2026-06-20T12:00:00.000Z' });

    googleDrive.findFile.mockResolvedValue({ id: 'file_1', modifiedTime: '2026-06-20T12:00:00.000Z' });
    googleDrive.readFile.mockResolvedValue({
      version: 2,
      exported_at: '2026-06-20T12:00:00.000Z',
      categories: [remoteCat],
      transactions: [],
      transaction_lines: [],
      currencies: [],
      settings: [],
    });
    googleDrive.updateFile.mockResolvedValue({ id: 'file_1' });

    await sync('2026-06-01T00:00:00.000Z');

    const allCats = await (await initDB()).getAll('categories');
    expect(allCats.find((c) => c.id === 'cat_remote_1')).toBeDefined();
  }, 15000);

  it('rejects remote record older than lastSyncedAt', async () => {
    await seedBase();
    const remoteCat = buildCategory({ id: 'cat_remote_2', name: 'Old Remote', updated_at: '2026-05-01T12:00:00.000Z' });

    googleDrive.findFile.mockResolvedValue({ id: 'file_2', modifiedTime: '2026-05-01T12:00:00.000Z' });
    googleDrive.readFile.mockResolvedValue({
      version: 2,
      exported_at: '2026-05-01T12:00:00.000Z',
      categories: [remoteCat],
      transactions: [],
      transaction_lines: [],
      currencies: [],
      settings: [],
    });
    googleDrive.updateFile.mockResolvedValue({ id: 'file_2' });

    await sync('2026-06-15T00:00:00.000Z');

    const allCats = await (await initDB()).getAll('categories');
    expect(allCats.find((c) => c.id === 'cat_remote_2')).toBeUndefined();
  }, 15000);

  it('keeps local version when local is newer', async () => {
    const db = await seedBase();
    const localCat = buildCategory({ id: 'cat_conflict', name: 'Local Version', updated_at: '2026-06-20T12:00:00.000Z' });
    await putCategory(db, localCat);
    const remoteCat = { ...localCat, name: 'Remote Renamed', updated_at: '2026-06-19T12:00:00.000Z' };

    googleDrive.findFile.mockResolvedValue({ id: 'file_3', modifiedTime: '2026-06-20T12:00:00.000Z' });
    googleDrive.readFile.mockResolvedValue({
      version: 2,
      exported_at: '2026-06-20T12:00:00.000Z',
      categories: [remoteCat],
      transactions: [],
      transaction_lines: [],
      currencies: [],
      settings: [],
    });
    googleDrive.updateFile.mockResolvedValue({ id: 'file_3' });

    await sync('2026-06-15T00:00:00.000Z');

    const uploaded = googleDrive.updateFile.mock.calls[0][1];
    const mergedCat = uploaded.categories.find((c) => c.id === 'cat_conflict');
    expect(mergedCat.name).toBe('Local Version');
  }, 15000);

  it('accepts remote version when remote is newer', async () => {
    const db = await seedBase();
    const localCat = buildCategory({ id: 'cat_conflict', name: 'Local Version', updated_at: '2026-06-19T12:00:00.000Z' });
    await putCategory(db, localCat);
    const remoteCat = { ...localCat, name: 'Remote Renamed', updated_at: '2026-06-20T12:00:00.000Z' };

    googleDrive.findFile.mockResolvedValue({ id: 'file_4', modifiedTime: '2026-06-20T12:00:00.000Z' });
    googleDrive.readFile.mockResolvedValue({
      version: 2,
      exported_at: '2026-06-20T12:00:00.000Z',
      categories: [remoteCat],
      transactions: [],
      transaction_lines: [],
      currencies: [],
      settings: [],
    });
    googleDrive.updateFile.mockResolvedValue({ id: 'file_4' });

    await sync('2026-06-15T00:00:00.000Z');

    const db2 = await initDB();
    const mergedCat = await db2.get('categories', 'cat_conflict');
    expect(mergedCat.name).toBe('Remote Renamed');
  }, 15000);

  it('handles empty remote data gracefully', async () => {
    await seedBase();

    googleDrive.findFile.mockResolvedValue(null);
    googleDrive.createFile.mockResolvedValue({ id: 'new_file' });

    const result = await sync(null);

    expect(result.lastSynced).toBeDefined();
  }, 15000);
});
