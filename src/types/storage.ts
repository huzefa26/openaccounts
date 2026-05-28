export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';

export interface Account {
  id?: number;
  name: string;
  type: AccountType;
  currency: string;
  parentId?: number | null;
  category?: string | null;
  isPredefined: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Split {
  accountId: number;
  amount: number;
  type: 'debit' | 'credit';
  currency: string;
}

export interface Transaction {
  id?: number;
  date: string;
  description: string;
  splits: Split[];
  createdAt: string;
  updatedAt: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  accountIds?: number[];
  type?: 'debit' | 'credit';
}

export const DB_NAME = 'openaccounts';
export const DB_VERSION = 1;

export const STORE_ACCOUNTS = 'accounts';
export const STORE_TRANSACTIONS = 'transactions';
export const STORE_CURRENCIES = 'currencies';
