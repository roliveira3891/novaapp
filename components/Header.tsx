"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/types";
import Avatar from "./Avatar";

export default function Header({
  user,
  onOpenCadastros,
  onOpenUsuarios,
  onOpenProfile,
}: {
  user: User;
  onOpenCadastros: () => void;
  onOpenUsuarios: () => void;
  onOpenProfile: () => void;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());
  const [menuOpen, setMenuOpen] = useState(false);
  const [gearOpen, setGearOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const dateStr = now.toLocaleDateString("pt-BR");
  const timeStr = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <header className="bg-gradient-to-r from-[#4A1F6F] to-[#6B2FA5] text-white px-6 py-3.5 flex items-center justify-between shadow-[0_2px_8px_rgba(74,31,111,0.25)]">
      <div className="flex items-center gap-4">
        <div className="bg-white rounded-md px-2 py-1.5 flex items-center shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/vivo-logo.png" alt="NOVA" className="h-6 w-auto" />
        </div>
        <div className="w-px h-7 bg-white/25" />
        <div className="leading-tight">
          <p className="text-[17px] font-semibold">Controle operacional &ndash; {user.regional}</p>
          <p className="text-[11px] text-white/60">Network Operations and Visibility Automation</p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <PinIcon />
          <div className="leading-tight text-xs">
            <div className="font-medium">Regional</div>
            <div className="text-white/70">{user.regional}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CalendarIcon />
          <div className="leading-tight text-xs">
            <div className="font-medium">{dateStr}</div>
            <div className="text-white/70">{timeStr}</div>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setGearOpen((v) => !v)}
            title="Configurações"
            className="hover:opacity-80 transition-opacity"
          >
            <GearIcon />
          </button>
          {gearOpen && (
            <div
              className="absolute right-0 top-9 z-20 bg-white text-gray-700 rounded-xl shadow-lg border border-gray-100 w-64 py-2 text-sm"
              onMouseLeave={() => setGearOpen(false)}
            >
              <button
                onClick={() => {
                  setGearOpen(false);
                  onOpenCadastros();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-50"
              >
                Cadastro de técnicos, armários e atividades
              </button>
              {user.isAdmin && (
                <button
                  onClick={() => {
                    setGearOpen(false);
                    onOpenUsuarios();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-gray-50"
                >
                  Relação de usuários
                </button>
              )}
            </div>
          )}
        </div>
        <div className="relative">
          <BellIcon />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#5B2A86]" />
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-1.5 hover:opacity-90 transition-opacity"
          >
            <Avatar id={user.avatar} size={32} ring />
            <ChevronIcon />
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 top-11 z-20 bg-white text-gray-700 rounded-xl shadow-lg border border-gray-100 w-56 py-2 text-sm"
              onMouseLeave={() => setMenuOpen(false)}
            >
              <div className="flex items-center gap-2.5 px-3.5 py-2 border-b border-gray-100 mb-1">
                <Avatar id={user.avatar} size={36} />
                <div className="leading-tight min-w-0">
                  <p className="font-semibold truncate">{user.nome}</p>
                  <p className="text-xs text-gray-400">
                    Mat. {user.matricula} &middot; {user.regional}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2"
              >
                <UserIcon dark /> Meu perfil
              </button>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <LogoutIcon /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function PinIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.7 21a2 2 0 0 1-3.4 0" />
    </svg>
  );
}
function UserIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={dark ? "#6b7280" : "white"} strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}
function GearIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
