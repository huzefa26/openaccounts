import { StorageService } from '../lib/storage';
import { AccountsPage } from './accounts';

export async function App(
  el: HTMLElement,
  storage: StorageService,
): Promise<void> {
  const accounts = await storage.getAllAccounts();
  el.innerHTML = AccountsPage(accounts);
}
