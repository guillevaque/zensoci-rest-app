import React from "react";

type User = { name: string; role?: string }; // opcional si en algún lado pasas user

type TopbarProps = {
  logoUrl?: string;                 // ← opcional
  onToggleMobile?: () => void;      // ← opcional
  user?: User;                      // ← opcional (por si ya lo usas en otro sitio)
};

export default function Topbar({
  logoUrl = "/assets/Zensoci_LogoH.png",
  onToggleMobile,
  user,
}: TopbarProps) {
  return (
    // <header className="h-14 w-full bg-[#3C6030] text-white flex items-center justify-between px-3 md:px-5">
      <header className="w-full h-14 md:h-16 flex items-center justify-between px-2 md:px-4"
        style={{ background: '#3C6030' }}>
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded hover:bg-black/10"
            onClick={onToggleMobile}
            aria-label="Abrir menú"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" />
            </svg>
          </button>
        )}
        {/* <a href="/" className="inline-flex items-center">
          <img src={logoUrl} alt="Zensoci" className="h-10 w-auto ml-3" />
        </a> */}
        <a href="/" className="inline-flex items-center pl-2 md:pl-4">
      <img src={logoUrl} alt="Zensoci" className="h-12 w-auto ml-2 md:ml-4 object-contain" />
    </a>
      </div>

      {/* <div className="text-sm opacity-90 pr-1">
        {user ? user.name : "Usuario"}
      </div> */}
        <div className="text-sm opacity-90 pr-1">Usuario</div>
    </header>
  );
}
