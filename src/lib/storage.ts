import type {
  Account,
  Transaction,
  Currency,
  TransactionFilters,
} from '../types/storage';
import {
  STORE_ACCOUNTS,
  STORE_TRANSACTIONS,
  STORE_CURRENCIES,
} from '../types/storage';

export class StorageService {
  constructor(private db: IDBDatabase) {}

  // --- Generic helpers ---

  private request<T>(req: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // --- Accounts ---

  async createAccount(
    data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Account> {
    const now = new Date().toISOString();
    const record: Omit<Account, 'id'> = { ...data, createdAt: now, updatedAt: now };
    const store = this.db
      .transaction(STORE_ACCOUNTS, 'readwrite')
      .objectStore(STORE_ACCOUNTS);
    const id = await this.request<IDBValidKey>(store.add(record));
    return { ...record, id: id as number };
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const store = this.db
      .transaction(STORE_ACCOUNTS, 'readonly')
      .objectStore(STORE_ACCOUNTS);
    return this.request<Account | undefined>(store.get(id));
  }

  async getAllAccounts(): Promise<Account[]> {
    const store = this.db
      .transaction(STORE_ACCOUNTS, 'readonly')
      .objectStore(STORE_ACCOUNTS);
    const result = await this.request<Account[]>(store.getAll());
    return result ?? [];
  }

  async updateAccount(
    id: number,
    data: Partial<Omit<Account, 'id' | 'createdAt'>>,
  ): Promise<void> {
    const store = this.db
      .transaction(STORE_ACCOUNTS, 'readwrite')
      .objectStore(STORE_ACCOUNTS);
    const existing = await this.request<Account | undefined>(store.get(id));
    if (!existing) throw new Error(`Account ${id} not found`);
    const updated: Account = {
      ...existing,
      ...data,
      id: existing.id!,
      updatedAt: new Date().toISOString(),
    };
    await this.request(store.put(updated));
  }

  async deleteAccount(id: number): Promise<void> {
    const accounts = await this.getAllAccounts();
    if (accounts.some((a) => a.parentId === id)) {
      throw new Error('Cannot delete account with child accounts');
    }

    const txStore = this.db
      .transaction(STORE_TRANSACTIONS, 'readonly')
      .objectStore(STORE_TRANSACTIONS);
    const allTxs = await this.request<Transaction[]>(txStore.getAll());
    if (allTxs?.some((tx) => tx.splits.some((s) => s.accountId === id))) {
      throw new Error('Cannot delete account used in transactions');
    }

    const store = this.db
      .transaction(STORE_ACCOUNTS, 'readwrite')
      .objectStore(STORE_ACCOUNTS);
    await this.request(store.delete(id));
  }

  // --- Transactions ---

  async createTransaction(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Transaction> {
    this.validateTransaction(data);

    const accounts = await this.getAllAccounts();
    const accountIds = new Set(accounts.map((a) => a.id));
    for (const split of data.splits) {
      if (!accountIds.has(split.accountId)) {
        throw new Error(`Account ${split.accountId} does not exist`);
      }
    }

    const now = new Date().toISOString();
    const record: Omit<Transaction, 'id'> = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const store = this.db
      .transaction(STORE_TRANSACTIONS, 'readwrite')
      .objectStore(STORE_TRANSACTIONS);
    const id = await this.request<IDBValidKey>(store.add(record));
    return { ...record, id: id as number };
  }

  async getTransaction(id: number): Promise<Transaction | undefined> {
    const store = this.db
      .transaction(STORE_TRANSACTIONS, 'readonly')
      .objectStore(STORE_TRANSACTIONS);
    return this.request<Transaction | undefined>(store.get(id));
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const store = this.db
      .transaction(STORE_TRANSACTIONS, 'readonly')
      .objectStore(STORE_TRANSACTIONS);
    const result = await this.request<Transaction[]>(store.getAll());
    return result ?? [];
  }

  async queryTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const store = this.db
      .transaction(STORE_TRANSACTIONS, 'readonly')
      .objectStore(STORE_TRANSACTIONS);

    let results: Transaction[];

    if (filters?.startDate || filters?.endDate) {
      const index = store.index('date');
      const lower = filters.startDate ?? '';
      const upper = filters.endDate ?? '\uffff';
      const range = IDBKeyRange.bound(lower, upper);
      results = (await this.request<Transaction[]>(index.getAll(range))) ?? [];
    } else {
      results = (await this.request<Transaction[]>(store.getAll())) ?? [];
    }

    if (filters?.accountIds && filters.accountIds.length > 0) {
      const ids = new Set(filters.accountIds);
      results = results.filter((tx) =>
        tx.splits.some((s) => ids.has(s.accountId)),
      );
    }

    if (filters?.type) {
      results = results.filter((tx) =>
        tx.splits.some((s) => s.type === filters.type),
      );
    }

    return results;
  }

  async updateTransaction(
    id: number,
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    this.validateTransaction(data);

    const store = this.db
      .transaction(STORE_TRANSACTIONS, 'readwrite')
      .objectStore(STORE_TRANSACTIONS);
    const existing = await this.request<Transaction | undefined>(store.get(id));
    if (!existing) throw new Error(`Transaction ${id} not found`);

    const updated: Transaction = {
      ...data,
      id: existing.id!,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await this.request(store.put(updated));
  }

  async deleteTransaction(id: number): Promise<void> {
    const store = this.db
      .transaction(STORE_TRANSACTIONS, 'readwrite')
      .objectStore(STORE_TRANSACTIONS);
    await this.request(store.delete(id));
  }

  private validateTransaction(
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>,
  ): void {
    if (data.splits.length < 2) {
      throw new Error('Transaction must have at least 2 splits');
    }
    if (data.splits.some((s) => s.amount <= 0)) {
      throw new Error('All split amounts must be positive');
    }

    const debitSum = data.splits
      .filter((s) => s.type === 'debit')
      .reduce((sum, s) => sum + s.amount, 0);
    const creditSum = data.splits
      .filter((s) => s.type === 'credit')
      .reduce((sum, s) => sum + s.amount, 0);
    if (debitSum !== creditSum) {
      throw new Error('Total debits must equal total credits');
    }
  }

  // --- Currencies ---

  async getCurrencies(): Promise<Currency[]> {
    const store = this.db
      .transaction(STORE_CURRENCIES, 'readonly')
      .objectStore(STORE_CURRENCIES);
    const result = await this.request<Currency[]>(store.getAll());
    return result ?? [];
  }

  async setCurrencies(currencies: Currency[]): Promise<void> {
    const store = this.db
      .transaction(STORE_CURRENCIES, 'readwrite')
      .objectStore(STORE_CURRENCIES);
    await this.request(store.clear());
    for (const c of currencies) {
      await this.request(store.add(c));
    }
  }

  // --- Maintenance ---

  async clearAll(): Promise<void> {
    const tx = this.db.transaction(
      [STORE_ACCOUNTS, STORE_TRANSACTIONS, STORE_CURRENCIES],
      'readwrite',
    );
    tx.objectStore(STORE_ACCOUNTS).clear();
    tx.objectStore(STORE_TRANSACTIONS).clear();
    tx.objectStore(STORE_CURRENCIES).clear();
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
