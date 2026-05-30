import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import SubHeader from './SubHeader';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F4F7F4' }}>
      <Sidebar onNavigate={() => setMobileOpen(false)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 md:ml-[210px]">
        <SubHeader onToggleMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
