import seedAccounts from '../data/seed-accounts.json';
import type { Account } from '../types/storage';
import { STORE_ACCOUNTS } from '../types/storage';

export function insertSeedAccounts(tx: IDBTransaction): void {
  const store = tx.objectStore(STORE_ACCOUNTS);
  const now = new Date().toISOString();

  for (const acct of seedAccounts) {
    const record: Omit<Account, 'id'> = {
      name: acct.name,
      type: acct.type as Account['type'],
      currency: acct.currency ?? '',
      category: acct.category ?? null,
      isPredefined: true,
      archived: false,
      parentId: null,
      createdAt: now,
      updatedAt: now,
    };
    store.add(record);
  }
}
