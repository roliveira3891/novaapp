"use client";

import { useState } from "react";
import type { Tecnico, Armario, TipoAtividade } from "@/lib/types";

export default function CadastrosModal({
  tecnicos,
  armarios,
  tiposAtividade,
  onClose,
  onChanged,
}: {
  tecnicos: Tecnico[];
  armarios: Armario[];
  tiposAtividade: TipoAtividade[];
  onClose: () => void;
  onChanged: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">Cadastros</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-w-0">
          <CadastroList
            title="Técnicos"
            table="tecnicos"
            items={tecnicos}
            placeholder="Nome do técnico"
            onChanged={onChanged}
          />
          <CadastroList
            title="Armários"
            table="armarios"
            items={armarios}
            placeholder="Nome do armário"
            onChanged={onChanged}
          />
          <CadastroList
            title="Atividades"
            table="tipos-atividade"
            items={tiposAtividade}
            placeholder="Nome da atividade"
            onChanged={onChanged}
          />
        </div>
      </div>
    </div>
  );
}

function CadastroList({
  title,
  table,
  items,
  placeholder,
  onChanged,
}: {
  title: string;
  table: "tecnicos" | "armarios" | "tipos-atividade";
  items: { id: number; nome: string; sigla?: string }[];
  placeholder: string;
  onChanged: () => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = value.trim();
    if (!nome) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao cadastrar.");
        return;
      }
      setValue("");
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/${table}/${id}`, { method: "DELETE" });
    onChanged();
  };

  return (
    <div className="min-w-0">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">{title}</h4>
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple"
        />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-vivo-purple hover:bg-vivo-purpleDark text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <ul className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
            <span className="text-gray-700 truncate flex items-center gap-2">
              {item.sigla && (
                <span className="shrink-0 text-[11px] font-bold text-vivo-purple bg-vivo-purple/10 rounded px-1.5 py-0.5">
                  {item.sigla}
                </span>
              )}
              {item.nome}
            </span>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-gray-400 hover:text-red-500"
              title="Excluir"
            >
              <TrashIcon />
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-4 text-xs text-gray-400 text-center">Nenhum cadastrado</li>
        )}
      </ul>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  );
}
