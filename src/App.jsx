import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useSyncStore from './store/syncStore';
import AppShell from './components/layout/AppShell';
import SignInScreen from './pages/SignInScreen';
import AppInit from './components/layout/AppInit';
import Home from './pages/Home';
import Ledger from './pages/Ledger';
import Analytics from './pages/Analytics';
import Categories from './pages/Categories';
import Profile from './pages/Profile';
import ToastContainer from './components/ui/ToastContainer';

function useSyncOnHide() {
  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        const { pendingChangeCount, syncNow } = useSyncStore.getState();
        if (pendingChangeCount > 0) syncNow();
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-text-secondary">Verifying session...</p>
      </div>
    </div>
  );
}

export default function App() {
  const { isSignedIn, booting, dbInitialized, verifySession, setDbInitialized } = useAuthStore();

  useSyncOnHide();

  useEffect(() => {
    if (booting) {
      verifySession();
    }
  }, [booting, verifySession]);

  if (booting) return <LoadingScreen />;

  if (!isSignedIn) return <SignInScreen />;

  if (!dbInitialized) return <AppInit onComplete={setDbInitialized} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="ledger" element={<Ledger />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="categories" element={<Categories />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}
