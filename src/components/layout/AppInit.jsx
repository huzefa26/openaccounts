import { useEffect, useState, useCallback } from 'react';
import { initDB } from '../../db/index';
import { seedFirstRun } from '../../db/seed';
import { STORE_NAMES, buildSnapshot, populateFromSnapshot } from '../../db/snapshot';
import { findFile, readFile, createFile, isInsufficientScopeError } from '../../sync/googleDrive';
import { reAuthorizeDrive } from '../../sync/googleAuth';
import * as dbSettings from '../../db/settings';
import { APP_INIT_TIMEOUT_MS, APP_INIT_COMPLETE_DELAY_MS } from '../../constants/app';

const STEPS = {
  checking: 'Checking Google Drive...',
  downloading: 'Downloading your data...',
  settingUp: 'Setting up your account...',
  connecting: 'Connecting to Google Drive...',
  done: 'All set!',
  error: 'Couldn\'t reach Google Drive. Please check your connection and try again.',
};

async function buildPushSnapshot(db) {
  const data = {};

  for (const storeName of STORE_NAMES) {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    data[storeName] = await store.getAll();
  }

  const snapshot = buildSnapshot(data);
  await createFile(snapshot);
}

export default function AppInit({ onComplete }) {
  const [status, setStatus] = useState(STEPS.checking);
  const [error, setError] = useState(null);
  const [driveScopeDenied, setDriveScopeDenied] = useState(false);
  const [granting, setGranting] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const run = useCallback(async () => {
    setError(null);
    setDriveScopeDenied(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), APP_INIT_TIMEOUT_MS);

    try {
      const db = await initDB();

      setStatus(STEPS.checking);
      const file = await findFile({ signal: controller.signal });

      if (file) {
        setStatus(STEPS.downloading);
        const data = await readFile(file.id, { signal: controller.signal });
        await populateFromSnapshot(db, data);
      } else {
        setStatus(STEPS.settingUp);
        await seedFirstRun(db);

        setStatus(STEPS.connecting);
        await buildPushSnapshot(db);
      }

      clearTimeout(timeout);
      await dbSettings.set('last_synced_at', new Date().toISOString());
      await dbSettings.set('app_version', '2');
      setStatus(STEPS.done);
      setTimeout(() => onComplete(), APP_INIT_COMPLETE_DELAY_MS);
    } catch (err) {
      clearTimeout(timeout);
      if (isInsufficientScopeError(err)) {
        setDriveScopeDenied(true);
      } else if (err.name === 'AbortError') {
        setError(STEPS.error);
      } else {
        setError(err.message);
      }
    }
  }, [onComplete]);

  useEffect(() => {
    run();
  }, [run, retryKey]);

  async function handleGrantAccess() {
    setGranting(true);
    try {
      await reAuthorizeDrive();
      setDriveScopeDenied(false);
      setRetryKey((k) => k + 1);
    } catch {
      // user denied consent or closed popup — stay on grant access screen
    } finally {
      setGranting(false);
    }
  }

  if (driveScopeDenied) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-sm text-text-primary mb-4">
            OpenAccounts needs access to your Google Drive to save your data.
            It can only access files it creates — nothing else in your Drive
            is visible to this app.
          </p>
          <button
            type="button"
            onClick={handleGrantAccess}
            disabled={granting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors duration-base"
          >
            {granting ? 'Granting...' : 'Grant Access'}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-sm text-expense mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-text-on-accent rounded-md hover:bg-accent-hover transition-colors duration-base"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-text-secondary">{status}</p>
      </div>
    </div>
  );
}
