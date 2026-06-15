import { dbPromise } from './index';

async function maybeScheduleSync(suppressSync) {
  if (suppressSync) return;
  const { default: useSyncStore } = await import('../store/syncStore');
  useSyncStore.setState((s) => ({ pendingChangeCount: s.pendingChangeCount + 1 }));
  useSyncStore.getState().schedulePendingSync();
}

export async function getAll() {
  const db = await dbPromise;
  return db.getAll('categories');
}

export async function getById(id) {
  const db = await dbPromise;
  return db.get('categories', id);
}

async function assertUniqueName(db, name, excludeId) {
  const all = await db.getAll('categories');
  const normalized = name.trim().toLowerCase();
  const conflict = all.find(
    (c) => c.name.trim().toLowerCase() === normalized && c.id !== excludeId,
  );
  if (conflict) {
    throw new Error('A category with this name already exists.');
  }
}

export async function create(data, { suppressSync = false } = {}) {
  const db = await dbPromise;
  await assertUniqueName(db, data.name);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const record = { ...data, id, created_at: now, updated_at: now };
  await db.add('categories', record);
  await maybeScheduleSync(suppressSync);
  return record;
}

export async function update(id, data, { suppressSync = false } = {}) {
  const db = await dbPromise;
  const existing = await db.get('categories', id);
  if (!existing) throw new Error('Category not found');
  if (existing.is_system) throw new Error('System categories cannot be edited');
  if (data.name && data.name.trim().toLowerCase() !== existing.name.trim().toLowerCase()) {
    await assertUniqueName(db, data.name, id);
  }
  const updated = { ...existing, ...data, id, updated_at: new Date().toISOString() };
  await db.put('categories', updated);
  await maybeScheduleSync(suppressSync);
  return updated;
}

export async function del(id, { suppressSync = false } = {}) {
  const db = await dbPromise;
  const existing = await db.get('categories', id);
  if (existing?.is_system) throw new Error('System categories cannot be deleted');
  await db.delete('categories', id);
  await maybeScheduleSync(suppressSync);
}
