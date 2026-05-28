import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { openDB, closeDB } from './db';
import { StorageService } from './storage';
import type { Account } from '../types/storage';

let db: IDBDatabase;
let storage: StorageService;

beforeEach(async () => {
  db = await openDB();
  storage = new StorageService(db);
});

afterEach(() => {
  closeDB(db);
});

describe('StorageService — Accounts', () => {
  const baseAccount = {
    name: 'Test Account',
    type: 'asset' as const,
    currency: 'USD',
    category: null,
    isPredefined: false,
    archived: false,
  };

  it('creates and retrieves an account', async () => {
    const created = await storage.createAccount(baseAccount);
    expect(created.id).toBeGreaterThan(0);
    expect(created.name).toBe('Test Account');
    expect(created.createdAt).toBeDefined();
    expect(created.updatedAt).toBe(created.createdAt);

    const retrieved = await storage.getAccount(created.id!);
    expect(retrieved).toEqual(created);
  });

  it('returns undefined for non-existent account', async () => {
    const result = await storage.getAccount(9999);
    expect(result).toBeUndefined();
  });

  it('lists all accounts', async () => {
    await storage.createAccount(baseAccount);
    await storage.createAccount({ ...baseAccount, name: 'Account 2' });
    const all = await storage.getAllAccounts();
    expect(all.length).toBeGreaterThanOrEqual(2);
  });

  it('updates an account partially', async () => {
    const created = await storage.createAccount(baseAccount);
    await storage.updateAccount(created.id!, { name: 'Updated Name' });
    const updated = await storage.getAccount(created.id!);
    expect(updated!.name).toBe('Updated Name');
    expect(updated!.currency).toBe('USD');
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    );
  });

  it('throws when updating non-existent account', async () => {
    await expect(
      storage.updateAccount(9999, { name: 'Nope' }),
    ).rejects.toThrow('Account 9999 not found');
  });

  it('deletes an account', async () => {
    const created = await storage.createAccount(baseAccount);
    await storage.deleteAccount(created.id!);
    const retrieved = await storage.getAccount(created.id!);
    expect(retrieved).toBeUndefined();
  });

  it('prevents deletion of account with children', async () => {
    const parent = await storage.createAccount(baseAccount);
    await storage.createAccount({
      ...baseAccount,
      name: 'Child',
      parentId: parent.id,
    });
    await expect(storage.deleteAccount(parent.id!)).rejects.toThrow(
      'Cannot delete account with child accounts',
    );
  });

  it('prevents deletion of account used in transactions', async () => {
    const acct1 = await storage.createAccount(baseAccount);
    const acct2 = await storage.createAccount({
      ...baseAccount,
      name: 'Income',
      type: 'income',
    });
    await storage.createTransaction({
      date: '2026-01-01',
      description: 'test',
      splits: [
        { accountId: acct1.id!, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: acct2.id!, amount: 100, type: 'credit', currency: 'USD' },
      ],
    });
    await expect(storage.deleteAccount(acct1.id!)).rejects.toThrow(
      'Cannot delete account used in transactions',
    );
  });
});

describe('StorageService — Transactions', () => {
  let assetAcct: Account;
  let incomeAcct: Account;

  beforeEach(async () => {
    assetAcct = await storage.createAccount({
      name: 'Cash',
      type: 'asset',
      currency: 'USD',
      category: null,
      isPredefined: false,
      archived: false,
    });
    incomeAcct = await storage.createAccount({
      name: 'Income',
      type: 'income',
      currency: 'USD',
      category: null,
      isPredefined: false,
      archived: false,
    });
  });

  const baseTx = () => ({
    date: '2026-05-01',
    description: 'Test transaction',
    splits: [
      { accountId: 0, amount: 100, type: 'debit' as const, currency: 'USD' },
      { accountId: 0, amount: 100, type: 'credit' as const, currency: 'USD' },
    ],
  });

  it('creates and retrieves a transaction', async () => {
    const data = baseTx();
    data.splits[0].accountId = assetAcct.id!;
    data.splits[1].accountId = incomeAcct.id!;

    const created = await storage.createTransaction(data);
    expect(created.id).toBeGreaterThan(0);
    expect(created.description).toBe('Test transaction');

    const retrieved = await storage.getTransaction(created.id!);
    expect(retrieved).toEqual(created);
  });

  it('rejects unbalanced transaction', async () => {
    await expect(
      storage.createTransaction({
        date: '2026-01-01',
        description: 'unbalanced',
        splits: [
          { accountId: assetAcct.id!, amount: 100, type: 'debit', currency: 'USD' },
          { accountId: incomeAcct.id!, amount: 50, type: 'credit', currency: 'USD' },
        ],
      }),
    ).rejects.toThrow('Total debits must equal total credits');
  });

  it('rejects transaction with single split', async () => {
    await expect(
      storage.createTransaction({
        date: '2026-01-01',
        description: 'single',
        splits: [
          { accountId: assetAcct.id!, amount: 100, type: 'debit', currency: 'USD' },
        ],
      }),
    ).rejects.toThrow('Transaction must have at least 2 splits');
  });

  it('rejects transaction with zero amounts', async () => {
    await expect(
      storage.createTransaction({
        date: '2026-01-01',
        description: 'zero',
        splits: [
          { accountId: assetAcct.id!, amount: 0, type: 'debit', currency: 'USD' },
          { accountId: incomeAcct.id!, amount: 0, type: 'credit', currency: 'USD' },
        ],
      }),
    ).rejects.toThrow('All split amounts must be positive');
  });

  it('rejects transaction referencing non-existent account', async () => {
    await expect(
      storage.createTransaction({
        date: '2026-01-01',
        description: 'bad account',
        splits: [
          { accountId: 9999, amount: 100, type: 'debit', currency: 'USD' },
          { accountId: incomeAcct.id!, amount: 100, type: 'credit', currency: 'USD' },
        ],
      }),
    ).rejects.toThrow('Account 9999 does not exist');
  });

  it('updates a transaction', async () => {
    const tx = await storage.createTransaction({
      date: '2026-01-01',
      description: 'original',
      splits: [
        { accountId: assetAcct.id!, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: incomeAcct.id!, amount: 100, type: 'credit', currency: 'USD' },
      ],
    });

    await storage.updateTransaction(tx.id!, {
      date: '2026-01-02',
      description: 'updated',
      splits: [
        { accountId: assetAcct.id!, amount: 50, type: 'debit', currency: 'USD' },
        { accountId: incomeAcct.id!, amount: 50, type: 'credit', currency: 'USD' },
      ],
    });

    const updated = await storage.getTransaction(tx.id!);
    expect(updated!.description).toBe('updated');
    expect(updated!.date).toBe('2026-01-02');
    expect(updated!.createdAt).toBe(tx.createdAt);
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(tx.createdAt).getTime(),
    );
  });

  it('deletes a transaction', async () => {
    const tx = await storage.createTransaction({
      date: '2026-01-01',
      description: 'delete me',
      splits: [
        { accountId: assetAcct.id!, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: incomeAcct.id!, amount: 100, type: 'credit', currency: 'USD' },
      ],
    });
    await storage.deleteTransaction(tx.id!);
    const retrieved = await storage.getTransaction(tx.id!);
    expect(retrieved).toBeUndefined();
  });

  it('queries transactions by date range', async () => {
    for (const day of ['2026-01-01', '2026-02-01', '2026-03-01']) {
      await storage.createTransaction({
        date: day,
        description: `tx ${day}`,
        splits: [
          { accountId: assetAcct.id!, amount: 100, type: 'debit', currency: 'USD' },
          { accountId: incomeAcct.id!, amount: 100, type: 'credit', currency: 'USD' },
        ],
      });
    }

    const results = await storage.queryTransactions({
      startDate: '2026-01-15',
      endDate: '2026-02-28',
    });
    expect(results).toHaveLength(1);
    expect(results[0].date).toBe('2026-02-01');
  });

  it('queries transactions by account', async () => {
    const expenseAcct = await storage.createAccount({
      name: 'Expenses',
      type: 'expense',
      currency: 'USD',
      category: null,
      isPredefined: false,
      archived: false,
    });

    await storage.createTransaction({
      date: '2026-01-01',
      description: 'tx1',
      splits: [
        { accountId: assetAcct.id!, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: incomeAcct.id!, amount: 100, type: 'credit', currency: 'USD' },
      ],
    });
    await storage.createTransaction({
      date: '2026-01-02',
      description: 'tx2',
      splits: [
        { accountId: expenseAcct.id!, amount: 50, type: 'debit', currency: 'USD' },
        { accountId: assetAcct.id!, amount: 50, type: 'credit', currency: 'USD' },
      ],
    });

    const results = await storage.queryTransactions({
      accountIds: [expenseAcct.id!],
    });
    expect(results).toHaveLength(1);
    expect(results[0].description).toBe('tx2');
  });

  it('queries transactions by debit/credit type', async () => {
    await storage.createTransaction({
      date: '2026-01-01',
      description: 'tx1',
      splits: [
        { accountId: assetAcct.id!, amount: 100, type: 'debit', currency: 'USD' },
        { accountId: incomeAcct.id!, amount: 100, type: 'credit', currency: 'USD' },
      ],
    });

    const debits = await storage.queryTransactions({ type: 'debit' });
    expect(debits.length).toBeGreaterThanOrEqual(1);
  });
});

describe('StorageService — Currencies', () => {
  it('starts empty', async () => {
    const currencies = await storage.getCurrencies();
    expect(currencies).toEqual([]);
  });

  it('sets and retrieves currencies', async () => {
    const currencies = [
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
    ];
    await storage.setCurrencies(currencies);
    const retrieved = await storage.getCurrencies();
    expect(retrieved).toHaveLength(2);
    expect(retrieved.find((c) => c.code === 'USD')?.name).toBe('US Dollar');
  });

  it('replaces currencies on set', async () => {
    await storage.setCurrencies([
      { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
    ]);
    await storage.setCurrencies([
      { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
    ]);
    const retrieved = await storage.getCurrencies();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].code).toBe('EUR');
  });
});

describe('StorageService — clearAll', () => {
  it('clears all stores', async () => {
    await storage.createAccount({
      name: 'Test',
      type: 'asset',
      currency: 'USD',
      category: null,
      isPredefined: false,
      archived: false,
    });
    await storage.clearAll();
    const accounts = await storage.getAllAccounts();
    const currencies = await storage.getCurrencies();
    const transactions = await storage.getAllTransactions();
    expect(accounts).toEqual([]);
    expect(currencies).toEqual([]);
    expect(transactions).toEqual([]);
  });
});
