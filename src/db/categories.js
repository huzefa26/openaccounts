import { dbPromise } from './index';

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('categories');
}

export async function getById(id) {
  const db = await dbPromise;
  return db.get('categories', id);
}

export async function getByType(type) {
  const db = await dbPromise;
  return db.getAllFromIndex('categories', 'type', type);
}

export async function create(data) {
  const db = await dbPromise;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, created_at: now, updated_at: now };
  await db.add('categories', record);
  return record;
}

export async function update(id, data) {
  const db = await dbPromise;
  const existing = await db.get('categories', id);
  if (!existing) throw new Error('Category not found');
  if (existing.is_system) throw new Error('System categories cannot be edited');
  const updated = { ...existing, ...data, id, updated_at: new Date().toISOString() };
  await db.put('categories', updated);
  return updated;
}

export async function del(id) {
  const db = await dbPromise;
  const existing = await db.get('categories', id);
  if (existing?.is_system) throw new Error('System categories cannot be deleted');
  await db.delete('categories', id);
}
