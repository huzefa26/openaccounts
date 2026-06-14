import { useState, useEffect, useRef } from 'react';
import useAuthStore from '../../store/authStore';
import useSyncStore from '../../store/syncStore';

export default function AvatarWithSync({ size = 'md' }) {
  const { user } = useAuthStore();
  const { status } = useSyncStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const prevStatus = useRef(status);

  // Show success badge briefly when sync completes
  useEffect(() => {
    if (status === 'syncing') {
      setShowSuccess(false);
      prevStatus.current = status;
      return;
    }
    if (prevStatus.current === 'syncing' && status === 'idle') {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
    prevStatus.current = status;
  }, [status]);

  const lg = size === 'md';

  return (
    <div className="relative inline-block">
      <img
        src={user.picture}
        alt=""
        referrerPolicy="no-referrer"
        className={`${lg ? 'size-8' : 'size-6'} rounded-full border border-border hover:ring-2 hover:ring-accent/30 transition-all duration-base`}
      />
      {/* Spinning ring shown during sync */}
      {status === 'syncing' && (
        <div
          className={`absolute inset-0 rounded-full ${lg ? 'border-2' : 'border'} border-t-warning border-border/50 animate-spin`}
          aria-hidden="true"
        />
      )}
      {/* Error badge persists until next sync */}
      {status === 'error' && (
        <div
          className={`absolute ${lg ? '-top-1 -right-1 size-4' : '-top-0.5 -right-0.5 size-3'} rounded-full bg-warning flex items-center justify-center`}
          title="Sync failed"
        >
          <span className={`${lg ? 'text-xs' : 'text-[7px]'} font-bold text-accent leading-none`}>!</span>
        </div>
      )}
      {/* Success badge auto-dismisses after 3s */}
      {showSuccess && (
        <div
          className={`absolute ${lg ? '-top-1 -right-1 size-4' : '-top-0.5 -right-0.5 size-3'} rounded-full bg-warning flex items-center justify-center`}
          title="Sync complete"
        >
          <svg
            className={`${lg ? 'size-2.5' : 'size-1.5'} text-accent`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </div>
  );
}
