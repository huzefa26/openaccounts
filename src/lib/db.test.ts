import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDB, closeDB } from './db';

let db: IDBDatabase;

beforeEach(async () => {
  db = await openDB();
});

afterEach(() => {
  closeDB(db);
});

describe('openDB', () => {
  it('creates the database with expected stores', () => {
    expect(db.objectStoreNames).toContain('accounts');
    expect(db.objectStoreNames).toContain('transactions');
    expect(db.objectStoreNames).toContain('currencies');
  });

  it('seeds predefined accounts on first creation', async () => {
    const tx = db.transaction('accounts', 'readonly');
    const store = tx.objectStore('accounts');
    const all = await new Promise<any[]>((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    expect(all.length).toBeGreaterThan(0);
    expect(all[0].isPredefined).toBe(true);
    expect(all[0].parentId).toBeNull();
    expect(all[0].archived).toBe(false);
    expect(all[0].createdAt).toBeDefined();
    expect(all[0].updatedAt).toBeDefined();
  });
});
