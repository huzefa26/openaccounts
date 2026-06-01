import { useState, useEffect, useMemo } from 'react';
import useCurrencyStore from '../store/currencyStore';
import useSyncStore from '../store/syncStore';
import { exportAllData } from '../utils/export';
import { baseCurrencies } from '../constants/baseCurrencies';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

function HomeCurrencySection({ currencies, defaultCurrency, onSetDefault }) {
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState('');

  const activeCurrencies = useMemo(() => {
    return currencies.map((c) => ({ value: c.code, label: `${c.code} — ${c.name}` }));
  }, [currencies]);

  function handleSave() {
    if (selected && selected !== defaultCurrency?.code) {
      onSetDefault(selected);
    }
    setShowModal(false);
  }

  if (!defaultCurrency) return null;

  return (
    <>
      <div className="border border-border rounded-lg p-5">
        <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Home Currency</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-text-tertiary font-numeric">{defaultCurrency.symbol}</span>
            <div>
              <span className="text-sm font-numeric font-medium text-text-primary">{defaultCurrency.code}</span>
              <span className="text-sm text-text-secondary ml-2">{defaultCurrency.name}</span>
            </div>
          </div>
          <Button variant="ghost" onClick={() => { setSelected(defaultCurrency.code); setShowModal(true); }}>
            Change
          </Button>
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Change Home Currency">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="home-currency-select" className="text-sm font-medium text-text-primary">Currency</label>
            <select
              id="home-currency-select"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-accent focus:border-accent"
            >
              {activeCurrencies.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={selected === defaultCurrency.code}>Save</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

function CurrenciesSection({ currencies, onAdd, onRemove, defaultCurrency }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [deletingCode, setDeletingCode] = useState(null);

  const activeCodes = useMemo(() => new Set(currencies.map((c) => c.code)), [currencies]);

  const availableCurrencies = useMemo(() => {
    return baseCurrencies
      .filter((c) => !activeCodes.has(c.code))
      .filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) || c.name.toLowerCase().includes(search.toLowerCase()));
  }, [activeCodes, search]);

  function handleAdd(code) {
    const found = baseCurrencies.find((c) => c.code === code);
    if (found) {
      onAdd({ code: found.code, name: found.name, symbol: found.symbol });
    }
    setShowAddModal(false);
    setSearch('');
  }

  async function handleDelete(code) {
    try {
      await onRemove(code);
      setDeletingCode(null);
    } catch {
      // error handled by store
    }
  }

  return (
    <>
      <div className="border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Currencies</h2>
          <Button variant="ghost" onClick={() => setShowAddModal(true)}>Add Currency</Button>
        </div>

        {currencies.length === 0 ? (
          <p className="text-sm text-text-tertiary">No currencies added yet.</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-bg">
                  <th scope="col" className="py-2 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Code</th>
                  <th scope="col" className="py-2 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Name</th>
                  <th scope="col" className="py-2 px-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Symbol</th>
                  <th scope="col" className="py-2 px-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map((c) => {
                  const isDefault = c.code === defaultCurrency?.code;
                  const isDeleting = deletingCode === c.code;
                  return (
                    <tr key={c.code} className={`border-b border-border last:border-b-0 ${isDeleting ? 'bg-expense-bg' : ''} transition-colors duration-base`}>
                      <td className="py-2.5 px-3 text-sm font-numeric text-text-primary">{c.code}</td>
                      <td className="py-2.5 px-3 text-sm text-text-primary">{c.name}</td>
                      <td className="py-2.5 px-3 text-sm font-numeric text-text-secondary">{c.symbol}</td>
                      <td className="py-2.5 px-3 text-right">
                        {isDefault ? (
                          <span className="text-xs text-text-tertiary" title="Cannot remove the default currency">Default</span>
                        ) : isDeleting ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(c.code)}
                              className="px-2 py-1 text-xs font-medium bg-expense text-white rounded-md hover:opacity-90 transition-colors duration-base"
                            >
                              Delete
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCode(null)}
                              className="px-2 py-1 text-xs font-medium text-text-secondary hover:bg-surface rounded-md transition-colors duration-base"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeletingCode(c.code)}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-text-tertiary hover:text-expense hover:bg-expense-bg transition-colors duration-base"
                            aria-label={`Delete currency ${c.code}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setSearch(''); }} title="Add Currency">
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search currencies..."
            className="px-3 py-2 text-sm bg-surface border border-border rounded-md outline-none focus:ring-2 focus:ring-accent focus:border-accent"
          />
          <div className="max-h-60 overflow-y-auto border border-border rounded-md">
            {availableCurrencies.length === 0 ? (
              <p className="text-sm text-text-tertiary p-3">No currencies found.</p>
            ) : (
              availableCurrencies.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleAdd(c.code)}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left text-text-primary hover:bg-accent-light transition-colors duration-base border-b border-border last:border-b-0"
                >
                  <span className="font-numeric font-medium w-10">{c.code}</span>
                  <span className="flex-1">{c.name}</span>
                  <span className="text-text-tertiary font-numeric">{c.symbol}</span>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

export default function Profile() {
  const { currencies, defaultCurrency, loading, fetchAll, addCurrency, removeCurrency, setDefaultCurrency } = useCurrencyStore();
  const syncStore = useSyncStore();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function handleExport() {
    setExporting(true);
    try {
      await exportAllData();
    } catch (err) {
      console.error('Export failed:', err);
    }
    setExporting(false);
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-text-primary mb-6">Profile</h1>

      <div className="flex flex-col gap-6">
        <HomeCurrencySection
          currencies={currencies}
          defaultCurrency={defaultCurrency}
          onSetDefault={setDefaultCurrency}
        />

        <CurrenciesSection
          currencies={currencies}
          defaultCurrency={defaultCurrency}
          onAdd={addCurrency}
          onRemove={removeCurrency}
        />

        <div className="border border-border rounded-lg p-5">
          <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Data & Sync</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm text-text-secondary mb-2">
                Download a complete JSON backup of all your data.
              </p>
              <Button onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : 'Export Data'}
              </Button>
            </div>
            <hr className="border-border" />
            <div>
              <p className="text-sm text-text-secondary mb-2">
                Sync your data with Google Drive for backup across devices.
              </p>
              <Button variant="ghost" disabled>
                Sign in to enable sync
              </Button>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-text-tertiary">Status:</span>
                <span className="text-xs text-text-disabled">{syncStore.status === 'idle' ? 'Not synced' : syncStore.status}</span>
                <span className="text-xs text-text-tertiary">Last synced:</span>
                <span className="text-xs text-text-disabled">
                  {syncStore.lastSynced ? new Date(syncStore.lastSynced).toLocaleString() : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
