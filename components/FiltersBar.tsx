"use client";

import { useEffect, useRef, useState } from "react";

export const PERIODO_OPTIONS = [
  "Todos",
  "Hoje",
  "Últimos 7 dias",
  "Últimos 30 dias",
  "Este mês",
  "Personalizado",
] as const;
export type PeriodoOption = (typeof PERIODO_OPTIONS)[number];

export function FiltersBar({
  tecnicos,
  armarios,
  tecnico,
  armario,
  periodo,
  dataInicio,
  dataFim,
  search,
  onTecnicoChange,
  onArmarioChange,
  onPeriodoChange,
  onDataInicioChange,
  onDataFimChange,
  onSearchChange,
}: {
  tecnicos: string[];
  armarios: string[];
  tecnico: string;
  armario: string;
  periodo: string;
  dataInicio?: string;
  dataFim?: string;
  search: string;
  onTecnicoChange: (v: string) => void;
  onArmarioChange: (v: string) => void;
  onPeriodoChange: (v: string) => void;
  onDataInicioChange?: (v: string) => void;
  onDataFimChange?: (v: string) => void;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div className="bg-white rounded-2xl shadow-card px-4 py-2.5 flex flex-col gap-0.5">
        <span className="text-[11px] text-gray-500">Período</span>
        <div className="flex items-center gap-2">
          <CalendarIcon />
          <select
            value={periodo}
            onChange={(e) => onPeriodoChange(e.target.value)}
            className="w-full outline-none text-sm text-gray-700 bg-transparent"
          >
            {PERIODO_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        {periodo === "Personalizado" && (
          <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-gray-100">
            <input
              type="date"
              value={dataInicio || ""}
              onChange={(e) => onDataInicioChange && onDataInicioChange(e.target.value)}
              className="w-full outline-none text-xs text-gray-700 bg-transparent"
              aria-label="Data inicial"
            />
            <span className="text-gray-300 text-xs">até</span>
            <input
              type="date"
              value={dataFim || ""}
              onChange={(e) => onDataFimChange && onDataFimChange(e.target.value)}
              className="w-full outline-none text-xs text-gray-700 bg-transparent"
              aria-label="Data final"
            />
          </div>
        )}
      </div>
      <SearchableSelect
        label="Nome do técnico"
        icon={<UserIcon />}
        value={tecnico}
        onChange={onTecnicoChange}
        options={["Todos", ...tecnicos]}
      />
      <SearchableSelect
        label="Nome do armário"
        icon={<BoxIcon />}
        value={armario}
        onChange={onArmarioChange}
        options={["Todos", ...armarios]}
      />
      <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-2">
        <SearchIcon />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por nº, atividade, armário ou técnico..."
          className="w-full outline-none text-sm placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

function SearchableSelect({
  label,
  icon,
  value,
  onChange,
  options,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const filtered = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()));

  const selectOption = (o: string) => {
    onChange(o);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative bg-white rounded-2xl shadow-card px-4 py-2.5 flex flex-col gap-0.5">
      <span className="text-[11px] text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        {icon}
        <input
          value={open ? query : value}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          placeholder={open ? "Buscar..." : undefined}
          className="w-full outline-none text-sm text-gray-700 bg-transparent placeholder:text-gray-400"
        />
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-gray-100 max-h-56 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-xs text-gray-400">Nenhum resultado</div>
          )}
          {filtered.map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => selectOption(o)}
              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-violet-50 ${
                o === value ? "text-vivo-purple font-medium" : "text-gray-700"
              }`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5B2A86" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5B2A86" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5B2A86" strokeWidth="2">
      <rect x="3" y="7" width="18" height="13" rx="1" />
      <path d="M3 11h18M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}
