import { baseCoa } from '../constants/baseCoa';

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export async function seedFirstRun(db) {
  const now = new Date().toISOString();

  const baseIds = {};
  for (const cat of baseCoa) {
    baseIds[cat.name] = `base_${slugify(cat.name)}`;
  }

  const tx = db.transaction(['categories', 'currencies', 'settings'], 'readwrite');

  const catStore = tx.objectStore('categories');
  for (const cat of baseCoa) {
    await catStore.add({
      id: baseIds[cat.name],
      name: cat.name,
      type: cat.type,
      parent_id: cat.parent ? baseIds[cat.parent] : null,
      description: '',
      opening_balance: 0,
      is_system: Boolean(cat.is_system),
      created_at: now,
      updated_at: now,
    });
  }

  const curStore = tx.objectStore('currencies');
  await curStore.put({
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    is_default: true,
    created_at: now,
    updated_at: now,
  });

  const setStore = tx.objectStore('settings');
  await setStore.put({
    key: 'theme',
    value: JSON.stringify('light'),
    updated_at: now,
  });

  await tx.done;
}
