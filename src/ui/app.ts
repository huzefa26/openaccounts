import { StorageService } from '../lib/storage';
import { Router } from './router';
import type { PageResult } from './router';
import { CategoriesPageHtml, mountCategoriesPage } from './pages/categories';
import { LedgerHtml } from './pages/ledger';
import { TransactionFormHtml, mountTransactionForm } from './components/transaction-form';
import { RecentEntriesHtml } from './components/recent-entries';

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

    return {
      html: `
        <div class="page-content">
          <h2>Home</h2>
          ${TransactionFormHtml(accounts)}
          <div class="stats-grid">
            <article class="card"><h3>Today</h3><p class="text-light">$0.00</p></article>
            <article class="card"><h3>This Month</h3><p class="text-light">$0.00</p></article>
            <article class="card"><h3>Avg / Day</h3><p class="text-light">$0.00</p></article>
          </div>
          <section>
            <header class="hstack justify-between items-center">
              <h3>Recent Entries</h3>
              <a href="#ledger" class="button outline small">View full ledger &rarr;</a>
            </header>
            ${RecentEntriesHtml(transactions, accountMap)}
          </section>
        </div>`,
      mount: (el) => {
        mountTransactionForm(el, accounts, async (data) => {
          await this.storage.createTransaction({
            date: data.date,
            description: data.description,
            splits: data.splits.map((s) => ({ ...s, currency: '' })),
          });
          // Re-render the home page to show updated ledger
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
    return {
      html: `<h2>Ledger</h2>${LedgerHtml(transactions, accountMap)}`,
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

