import { useAuth } from "../auth/AuthContext";
import { useState } from "react";

const brandGreen = "#3C6030";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header style={{ background: brandGreen }} className="w-full">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          {/* LOGO */}
          <img src="/logo-zensoci.png" alt="Zensoci" className="h-10 w-auto ml-3" />
          <span className="font-semibold tracking-wide">Restaurante Vegano</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-xl px-3 py-2 bg-white/10 hover:bg-white/20 transition text-sm"
          >
            {user ? user.name : "Invitado"}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-xl shadow-lg overflow-hidden">
              {user && user.role === "admin" && (
                <a href="/admin/usuarios" className="block px-4 py-3 hover:bg-gray-100 text-sm">
                  Administrador
                </a>
              )}
              {user ? (
                <button onClick={logout} className="w-full text-left px-4 py-3 hover:bg-gray-100 text-sm">
                  Cerrar sesión
                </button>
              ) : (
                <a href="/login" className="block px-4 py-3 hover:bg-gray-100 text-sm">
                  Iniciar sesión
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
