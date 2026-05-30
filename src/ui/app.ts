import { StorageService } from '../lib/storage';
import { Router } from './router';
import type { PageResult } from './router';
import { CategoriesPageHtml, mountCategoriesPage } from './pages/categories';
import { LedgerHtml, mountLedgerPage } from './pages/ledger';
import { TransactionFormHtml, mountTransactionForm } from './components/transaction-form';
import { RecentEntriesHtml } from './components/recent-entries';
import type { Account, Transaction } from '../types/storage';

function fmt(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export class App {
  private storage: StorageService;
  private router: Router;

  constructor(container: HTMLElement, storage: StorageService) {
    this.storage = storage;
    this.router = new Router(container, {
      home: () => this.homePage(),
      ledger: () => this.ledgerPage(),
      categories: () => this.categoriesPage(),
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
    const metrics = this.computeMetrics(transactions, accountMap);

    return {
      html: `
        <div class="page-content home-page">
          <div class="home-layout">
            <div class="home-peek">
              <div class="metrics-grid">
                <article class="metric-card">
                  <div class="metric-label">Net Worth</div>
                  <div class="metric-value">$${fmt(metrics.netWorth)}</div>
                </article>
                <article class="metric-card">
                  <div class="metric-label">This Month Income</div>
                  <div class="metric-value income">$${fmt(metrics.monthlyIncome)}</div>
                </article>
                <article class="metric-card">
                  <div class="metric-label">This Month Expenses</div>
                  <div class="metric-value expense">$${fmt(metrics.monthlyExpenses)}</div>
                </article>
                <article class="metric-card">
                  <div class="metric-label">Net Savings</div>
                  <div class="metric-value ${metrics.netSavings >= 0 ? 'income' : 'expense'}">$${fmt(metrics.netSavings)}</div>
                </article>
              </div>

              <section>
                <header class="hstack justify-between items-center" style="margin-bottom: var(--space-3);">
                  <span class="form-label" style="margin-bottom:0;">Recent Entries</span>
                  <a href="#ledger" class="button outline small">View full ledger &rarr;</a>
                </header>
                ${RecentEntriesHtml(transactions, accountMap)}
              </section>
            </div>

            <div class="home-form-col">
              ${TransactionFormHtml(accounts)}
            </div>
          </div>
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

  private computeMetrics(
    transactions: Transaction[],
    accountMap: Map<number, Account>,
  ): { netWorth: number; monthlyIncome: number; monthlyExpenses: number; netSavings: number } {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const currentMonth = `${year}-${month}`;

    let totalIncome = 0;
    let totalExpenses = 0;
    let monthlyIncome = 0;
    let monthlyExpenses = 0;

    for (const tx of transactions) {
      const inCurrentMonth = tx.date.startsWith(currentMonth);
      for (const split of tx.splits) {
        const account = accountMap.get(split.accountId);
        if (account?.type === 'income' && split.type === 'credit') {
          totalIncome += split.amount;
          if (inCurrentMonth) monthlyIncome += split.amount;
        } else if (account?.type === 'expense' && split.type === 'debit') {
          totalExpenses += split.amount;
          if (inCurrentMonth) monthlyExpenses += split.amount;
        }
      }
    }

    return {
      netWorth: totalIncome - totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      netSavings: monthlyIncome - monthlyExpenses,
    };
  }

  private async ledgerPage(): Promise<PageResult> {
    const accounts = await this.storage.getAllAccounts();
    const transactions = await this.storage.getAllTransactions();
    const accountMap = new Map(accounts.map((a) => [a.id!, a]));
    return {
      html: LedgerHtml(transactions, accountMap),
      mount: (el) => mountLedgerPage(el, transactions, accountMap),
    };
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

  private async profilePage(): Promise<PageResult> {
    return {
      html: `<div class="page-content"><section><h2>Profile</h2><p>Coming soon.</p></section></div>`,
    };
  }
}

