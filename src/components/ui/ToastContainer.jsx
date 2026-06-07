import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import useToastStore from '../../store/toastStore';
import Toast from './Toast';

export default function ToastContainer() {
  const { toasts, removeToast, clearAll } = useToastStore();
  const location = useLocation();

  useEffect(() => {
    clearAll();
  }, [location.pathname]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 max-md:left-4 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <Toast toast={t} onDismiss={removeToast} />
        </div>
      ))}
    </div>
  );
}
