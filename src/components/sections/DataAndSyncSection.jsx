import useAuthStore from '../../store/authStore';
import useSyncStore from '../../store/syncStore';
import Button from '../ui/Button';

export default function DataAndSyncSection({ onExport, exporting, onReset }) {
  const authStore = useAuthStore();
  const syncStore = useSyncStore();

  return (
    <div className="border border-border rounded-lg p-5">
      <h2 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Data & Sync</h2>
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm text-text-secondary mb-2">
            Download a complete JSON backup of all your data.
          </p>
          <Button onClick={onExport} disabled={exporting}>
            {exporting ? 'Exporting...' : 'Export Data'}
          </Button>
        </div>
        <hr className="border-border" />
        <div>
          <p className="text-sm text-text-secondary mb-2">
            Sync your data with Google Drive for backup across devices.
          </p>
          {authStore.isSignedIn ? (
            <Button
              onClick={() => syncStore.syncNow()}
              disabled={syncStore.status === 'syncing'}
            >
              {syncStore.status === 'syncing' ? 'Syncing...' : 'Sync with Google Drive'}
            </Button>
          ) : (
            <Button variant="ghost" disabled>
              Sign in to enable sync
            </Button>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
            <span className="text-xs text-text-tertiary">Status:</span>
            <span className="text-xs text-text-secondary">
              {syncStore.status === 'syncing'
                ? 'Syncing...'
                : syncStore.status === 'error'
                  ? 'Sync failed'
                  : authStore.isSignedIn
                    ? 'Ready'
                    : 'Not signed in'}
            </span>
            <span className="text-xs text-text-tertiary">Last synced:</span>
            <span className="text-xs text-text-secondary font-numeric">
              {syncStore.lastSynced
                ? new Date(syncStore.lastSynced).toLocaleString()
                : authStore.isSignedIn ? 'Never' : '\u2014'}
            </span>
          </div>
          {syncStore.error && (
            <p className="text-xs text-expense mt-1">{syncStore.error}</p>
          )}
        </div>
        <hr className="border-border" />
        <div>
          <p className="text-xs font-semibold text-expense uppercase tracking-wider mb-2">Danger Zone</p>
          <p className="text-sm text-text-secondary mb-2">
            This will permanently delete all your data, including your Google Drive backup.
          </p>
          <Button variant="danger" onClick={onReset}>
            Reset App
          </Button>
        </div>
      </div>
    </div>
  );
}
