import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import SubHeader from './SubHeader';

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--zs-paper)' }}>
      <Sidebar onNavigate={() => setMobileOpen(false)} />
      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-[220px]">
        <SubHeader onToggleMobile={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-[22px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
