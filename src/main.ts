import '@knadh/oat/oat.min.css';
import '@knadh/oat/oat.min.js';
import './ui/theme.css';
import { openDB } from './lib/db';
import { StorageService } from './lib/storage';
import { App } from './ui/app';

// Mobile nav toggle
document.addEventListener('click', (e) => {
  const toggle = (e.target as HTMLElement).closest('[data-nav-toggle]');
  if (toggle) {
    document.body.toggleAttribute('data-nav-open');
    return;
  }

  if (
    document.body.hasAttribute('data-nav-open') &&
    window.matchMedia('(max-width: 768px)').matches &&
    !(e.target as HTMLElement).closest('[data-nav-links]') &&
    !(e.target as HTMLElement).closest('[data-nav-toggle]')
  ) {
    document.body.removeAttribute('data-nav-open');
  }
});

// Close nav on link click on mobile
document.addEventListener('click', (e) => {
  const link = (e.target as HTMLElement).closest('a[data-nav]');
  if (link && window.matchMedia('(max-width: 768px)').matches) {
    document.body.removeAttribute('data-nav-open');
  }
});

async function main(): Promise<void> {
  const el = document.getElementById('app');
  if (!el) throw new Error('#app element not found');

  const db = await openDB();
  const storage = new StorageService(db);
  const app = new App(el, storage);
  app.start();
}

main();
