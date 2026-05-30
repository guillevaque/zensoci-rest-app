import React from "react";

type User = { name: string; role?: string };

type TopbarProps = {
  logoUrl?: string;
  onToggleMobile?: () => void;
  user?: User;
};

export default function Topbar({
  logoUrl = "/assets/Zensoci_LogoH.png",
  onToggleMobile,
  user,
}: TopbarProps) {
  return (
    <header
      className="w-full h-14 md:h-16 flex items-center justify-between px-3 md:px-5"
      style={{ background: '#3C6030', boxShadow: '0 2px 8px rgba(0,0,0,0.18)' }}
    >
      <div className="flex items-center gap-3">
        {onToggleMobile && (
          <button
            className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/10 transition-colors"
            style={{ background: 'transparent', color: 'white', padding: 0 }}
            onClick={onToggleMobile}
            aria-label="Abrir menú"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <a href="/" className="inline-flex items-center">
          <img
            src={logoUrl}
            alt="Zensoci"
            className="h-9 md:h-10 w-auto object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
          />
        </a>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{ background: 'rgba(255,255,255,0.12)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'rgba(255,255,255,0.25)', color: 'white' }}
          >
            {(user?.name ?? 'U')[0].toUpperCase()}
          </div>
          <span className="text-sm text-white/90 font-medium hidden sm:block">
            {user?.name ?? 'Usuario'}
          </span>
        </div>
      </div>
    </header>
  );
}
