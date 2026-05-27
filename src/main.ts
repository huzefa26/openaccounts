import '@knadh/oat/oat.min.css';
import '@knadh/oat/oat.min.js';

const app = document.getElementById('app');
if (!app) throw new Error('#app element not found');

app.innerHTML = `
  <h1>OpenAccounts</h1>
  <p>Your personal accounting app.</p>
`;
