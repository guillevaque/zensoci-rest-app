import React from "react";
import { NavLink } from "react-router-dom";
import { MdOutlineInventory2, MdTableBar } from "react-icons/md";
import { TbReportAnalytics } from "react-icons/tb";
import { FaGears } from "react-icons/fa6";

type SidebarProps = {
  onNavigate?: () => void; // ← lo llamaremos al hacer click en un link (útil para cerrar drawer móvil)
};

const linkBase =
  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors";
const linkInactive = "text-gray-700 hover:bg-orange-50";
const linkActive = "bg-orange-600 text-white hover:bg-orange-600";

const Item = ({
  to,
  icon,
  children,
  onClick,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `${linkBase} ${isActive ? linkActive : linkInactive}`
    }
    end
  >
    {icon}
    <span>{children}</span>
  </NavLink>
);

export default function Sidebar({ onNavigate }: SidebarProps) {
  const handleNav = () => onNavigate?.();

  return (
    <aside className="hidden md:flex fixed left-0 top-14 h-[calc(100vh-56px)] w-60 bg-white border-r z-40">
      <nav className="w-full p-3 space-y-1">
        <Item to="/pos" onClick={handleNav} icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18v4H3V4zm0 6h10v10H3V10zm12 0h6v6h-6v-6z"/></svg>}>POS</Item>
        <Item to="/mesas" onClick={handleNav} icon={<MdTableBar />}>Gestión de Mesas</Item>
        <Item to="/inventario" onClick={handleNav} icon={<MdOutlineInventory2 />}>Inventario</Item>
        <Item to="/reportes" onClick={handleNav} icon={<TbReportAnalytics />}>Reportes</Item>
        <Item to="/ajustes" onClick={handleNav} icon={<FaGears />}>Ajustes</Item>
              <Item to="/menu" onClick={handleNav} icon={<MdOutlineInventory2 />}>Gestión de Menú</Item>
      </nav>
    </aside>
  );
}
