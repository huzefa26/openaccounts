import { StorageService } from '../lib/storage';
import { Router } from './router';
import type { PageResult } from './router';
import { CategoriesPageHtml, mountCategoriesPage } from './pages/categories';
import { LedgerHtml } from './pages/ledger';
import { TransactionFormHtml, mountTransactionForm } from './components/transaction-form';
import { RecentEntriesHtml } from './components/recent-entries';
import { MetricCardsHtml } from './components/metric-cards';
import { mountLedger } from './pages/ledger';
import { ProfilePageHtml } from './pages/profile';
import type { MetricTotals } from './components/metric-cards';
import type { Account, Transaction } from '../types/storage';

export class App {
  private storage: StorageService;
  private router: Router;

  constructor(container: HTMLElement, storage: StorageService) {
    this.storage = storage;
    this.router = new Router(container, {
      home: () => this.homePage(),
      ledger: () => this.ledgerPage(),
      categories: () => this.categoriesPage(),
      analytics: () => this.analyticsPage(),
      profile: () => this.profilePage(),
    });
  }

  start(): void {
    this.router.start();
  }

  private async homePage(): Promise<PageResult> {
    const accounts = await this.storage.getAllAccounts();
    const transactions = await this.storage.getAllTransactions();
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));
    const totals = computeMetrics(transactions, accountMap);

    return {
      html: `
        <div class="page-content">
          <div class="home-greeting">
            <h1>${greeting()}</h1>
            <p class="greeting-date">${todayFormatted()}</p>
          </div>

          ${MetricCardsHtml(totals)}

          <div class="section-heading"><h2>Quick Entry</h2></div>
          ${TransactionFormHtml(accounts)}

          <div class="section-heading">
            <h2>Recent Transactions</h2>
            <a href="#ledger" class="section-action">View all &rarr;</a>
          </div>
          ${RecentEntriesHtml(transactions, accountMap)}
        </div>`,
      mount: (el) => {
        mountTransactionForm(el, accounts, async (data) => {
          await this.storage.createTransaction({
            date: data.date,
            description: data.description,
            splits: data.splits.map((s) => ({ ...s, currency: '' })),
          });
          const result = await this.homePage();
          el.innerHTML = result.html;
          result.mount?.(el);
        });
      },
    };
  }

  private async ledgerPage(): Promise<PageResult> {
    const accounts = await this.storage.getAllAccounts();
    const transactions = await this.storage.getAllTransactions();
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));

    let filters = { search: '' };
    let page = 1;

    const render = (): { html: string; mount: (el: HTMLElement) => void } => {
      const html = `<div class="page-content"><h2>Ledger</h2>${LedgerHtml(transactions, accountMap, filters, page)}</div>`;
      return {
        html,
        mount: (el: HTMLElement) => {
          mountLedger(el, transactions, accountMap, async (newFilters, newPage) => {
            filters = newFilters;
            page = newPage;
            const result = await this.ledgerPage();
            el.innerHTML = result.html;
            result.mount?.(el);
          });
        },
      };
    };

    return render();
  }

  private async categoriesPage(): Promise<PageResult> {
    const accounts = await this.storage.getAllAccounts();
    return {
      html: CategoriesPageHtml(accounts),
      mount: (el) => {
        mountCategoriesPage(el, accounts, this.storage, async () => {
          const result = await this.categoriesPage();
          el.innerHTML = result.html;
          result.mount?.(el);
        });
      },
    };
  }

  private async analyticsPage(): Promise<PageResult> {
    return {
      html: `<div class="page-content"><section><h2>Analytics</h2><p>Coming soon.</p></section></div>`,
    };
  }

  private async profilePage(): Promise<PageResult> {
    return {
      html: ProfilePageHtml(),
    };
  }
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function todayFormatted(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function computeMetrics(
  transactions: Transaction[],
  accountMap: Map<number, Account>,
): MetricTotals {
  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const thisMonthTxs = transactions.filter((tx) => tx.date.startsWith(thisMonth));

  let income = 0;
  let expenses = 0;
  let incomeCount = 0;
  let expenseCount = 0;

  for (const tx of thisMonthTxs) {
    for (const split of tx.splits) {
      const acct = accountMap.get(split.accountId);
      if (split.type === 'credit' && acct?.type === 'income') {
        income += split.amount;
        incomeCount++;
      }
      if (split.type === 'debit' && acct?.type === 'expense') {
        expenses += split.amount;
        expenseCount++;
      }
    }
  }

  let totalCredits = 0;
  let totalDebits = 0;
  for (const tx of transactions) {
    for (const split of tx.splits) {
      if (split.type === 'credit') totalCredits += split.amount;
      else totalDebits += split.amount;
    }
  }

  return {
    netBalance: totalCredits - totalDebits,
    thisMonthIncome: income,
    thisMonthExpenses: expenses,
    incomeTxCount: incomeCount,
    expenseTxCount: expenseCount,
  };
}

