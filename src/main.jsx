import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initDB } from './db/index';
import './index.css';

(function initTheme() {
  const theme = localStorage.getItem('oa_theme');
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
})();

async function start() {
  await initDB();

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

start();
