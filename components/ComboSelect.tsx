"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboOption {
  value: string;
  label: string;
}

// Select com busca para formulários: digitar filtra a lista, clicar escolhe.
export default function ComboSelect({
  value,
  onChange,
  options,
  placeholder,
  required,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ComboOption[];
  placeholder: string;
  required?: boolean;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  const choose = (o: ComboOption) => {
    onChange(o.value);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <input
        value={open ? query : selected?.label ?? value}
        required={required}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          setOpen(true);
          setQuery("");
        }}
        placeholder={open ? "Buscar..." : placeholder}
        autoComplete="off"
        className={className}
      />
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white rounded-xl shadow-lg border border-gray-100 max-h-52 overflow-y-auto py-1">
          {filtered.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">Nenhum resultado</div>}
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => choose(o)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-violet-50 ${
                o.value === value ? "text-vivo-purple font-medium" : "text-gray-700"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
