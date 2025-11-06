// src/ui/Layout.tsx
import { Outlet } from "react-router-dom";
import { useState } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoUrl = "/assets/Zensoci_LogoH.png";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed inset-x-0 top-0 z-50">
        <Topbar logoUrl={logoUrl} onToggleMobile={() => setMobileOpen(true)} />
      </div>

      <Sidebar onNavigate={() => setMobileOpen(false)} />

      <div className="pt-14 md:ml-60">
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
