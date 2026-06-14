import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import MobileTopBar from './MobileTopBar';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <MobileTopBar />
      <main className="pt-14 pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
