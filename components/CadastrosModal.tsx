"use client";

import { useState } from "react";
import type { Tecnico, Armario, TipoAtividade } from "@/lib/types";

type TabKey = "tecnicos" | "armarios" | "tipos-atividade";

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
  const [tab, setTab] = useState<TabKey>("tecnicos");

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "tecnicos", label: "Técnicos", count: tecnicos.length },
    { key: "armarios", label: "Armários", count: armarios.length },
    { key: "tipos-atividade", label: "Atividades", count: tiposAtividade.length },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">Cadastros</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="flex border-b border-gray-100 mb-4">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === t.key
                  ? "border-vivo-purple text-vivo-purple"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {tab === "tecnicos" && (
          <CadastroList
            key="tecnicos"
            table="tecnicos"
            items={tecnicos}
            placeholder="Nome do técnico"
            withMatricula
            onChanged={onChanged}
          />
        )}
        {tab === "armarios" && (
          <CadastroList
            key="armarios"
            table="armarios"
            items={armarios}
            placeholder="Nome do armário"
            onChanged={onChanged}
          />
        )}
        {tab === "tipos-atividade" && (
          <CadastroList
            key="tipos-atividade"
            table="tipos-atividade"
            items={tiposAtividade}
            placeholder="Nome da atividade"
            onChanged={onChanged}
          />
        )}
      </div>
    </div>
  );
}

function CadastroList({
  table,
  items,
  placeholder,
  withMatricula,
  onChanged,
}: {
 table: "tecnicos" | "armarios" | "tipos-atividade";
  items: { id: number; nome: string; sigla?: string; matricula?: string }[];
  placeholder: string;
  withMatricula?: boolean;
  onChanged: () => void;
}) {
  const [value, setValue] = useState("");
  const [matricula, setMatricula] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editMatricula, setEditMatricula] = useState("");

  const q = query.trim().toLowerCase();
  const visibleItems = q
    ? items.filter((i) => `${i.nome} ${i.matricula || ""} ${i.sigla || ""}`.toLowerCase().includes(q))
    : items;

  const startEdit = (item: { id: number; nome: string; matricula?: string }) => {
    setError("");
    setEditingId(item.id);
    setEditNome(item.nome);
    setEditMatricula(item.matricula || "");
  };

  const handleSaveEdit = async () => {
    const nome = editNome.trim();
    if (!nome) return;
    if (withMatricula && !editMatricula.trim()) {
      setError("Informe a matrícula.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/${table}/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, ...(withMatricula ? { matricula: editMatricula.trim() } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao salvar.");
        return;
      }
      setEditingId(null);
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const nome = value.trim();
    if (!nome) return;
    if (withMatricula && !matricula.trim()) {
      setError("Informe a matrícula.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, ...(withMatricula ? { matricula: matricula.trim() } : {}) }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao cadastrar.");
        return;
      }
      setValue("");
      setMatricula("");
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
      <form onSubmit={handleAdd} className="flex flex-col gap-2 mb-3">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple"
        />
        {withMatricula && (
          <input
            value={matricula}
            onChange={(e) => setMatricula(e.target.value)}
            placeholder="Matrícula"
            className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple"
          />
        )}
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-vivo-purple hover:bg-vivo-purpleDark text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-60"
        >
          Adicionar
        </button>
      </form>
      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar na lista..."
        className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple mb-2"
      />
      <ul className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-72 overflow-y-auto">
        {visibleItems.map((item) =>
          editingId === item.id ? (
            <li key={item.id} className="flex flex-col gap-2 px-3 py-2 bg-violet-50/40">
              <input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                autoFocus
                className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-vivo-purple bg-white"
              />
              {withMatricula && (
                <input
                  value={editMatricula}
                  onChange={(e) => setEditMatricula(e.target.value)}
                  placeholder="Matrícula"
                  className="w-full min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-vivo-purple bg-white"
                />
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setEditingId(null);
                    setError("");
                  }}
                  className="px-3 py-1 text-xs rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="px-3 py-1 text-xs rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium disabled:opacity-60"
                >
                  Salvar
                </button>
              </div>
            </li>
          ) : (
            <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
              <span className="text-gray-700 truncate flex items-center gap-2">
                {item.sigla && (
                  <span className="shrink-0 text-[11px] font-bold text-vivo-purple bg-vivo-purple/10 rounded px-1.5 py-0.5">
                    {item.sigla}
                  </span>
                )}
                {item.nome}
                {withMatricula && (
                  <span className="shrink-0 text-xs text-gray-400">
                    {item.matricula ? `Mat. ${item.matricula}` : "sem matrícula"}
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => startEdit(item)}
                  className="text-gray-400 hover:text-vivo-purple"
                  title="Editar"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-gray-400 hover:text-red-500"
                  title="Excluir"
                >
                  <TrashIcon />
                </button>
              </span>
            </li>
          )
        )}
        {visibleItems.length === 0 && (
          <li className="px-3 py-4 text-xs text-gray-400 text-center">
            {items.length === 0 ? "Nenhum cadastrado" : "Nenhum resultado"}
          </li>
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

function PencilIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
