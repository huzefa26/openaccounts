import { dbPromise } from './index';

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('transactions');
}

export async function getById(id) {
  const db = await dbPromise;
  return db.get('transactions', id);
}

export async function create(data) {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, created_at: now, updated_at: now };
  await db.add('transactions', record);
  return record;
}

export async function update(id, data) {
  const db = await dbPromise;
  const existing = await db.get('transactions', id);
  if (!existing) throw new Error('Transaction not found');
  const updated = { ...existing, ...data, id, updated_at: new Date().toISOString() };
  await db.put('transactions', updated);
  return updated;
}

export async function del(id) {
  const db = await dbPromise;
  await db.delete('transactions', id);
}
