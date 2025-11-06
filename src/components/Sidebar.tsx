// src/components/Sidebar.tsx
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const links = [
    { to: "/pos", label: "POS" },
    { to: "/mesas", label: "Gestión de Mesas" },
    { to: "/inventario", label: "Inventario" },
    { to: "/reportes", label: "Reportes" },
  ];

  return (
    <aside className="fixed top-0 left-0 h-full w-56 bg-white border-r shadow-sm z-50 flex flex-col">
      <div className="p-4 font-semibold text-lg border-b text-center text-orange-600">
        🍽️ Zensoci POS
      </div>
      <nav className="flex-1 p-2">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded mb-1 ${
                isActive
                  ? "bg-orange-500 text-white font-medium"
                  : "text-gray-700 hover:bg-orange-100"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
