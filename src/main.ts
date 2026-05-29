import '@knadh/oat/oat.min.css';
import '@knadh/oat/oat.min.js';
import './ui/theme.css';
import { openDB } from './lib/db';
import { StorageService } from './lib/storage';
import { App } from './ui/app';

async function main(): Promise<void> {
  const el = document.getElementById('app');
  if (!el) throw new Error('#app element not found');

  const db = await openDB();
  const storage = new StorageService(db);
  const app = new App(el, storage);
  app.start();
}

main();
