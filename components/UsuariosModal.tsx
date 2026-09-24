"use client";

import { useEffect, useState } from "react";
import { REGIONAIS } from "@/lib/regionais";
import Avatar from "./Avatar";

interface UsuarioRow {
  id: number;
  matricula: string;
  nome: string;
  regional: string;
  avatar: string;
}

export default function UsuariosModal({ onClose }: { onClose: () => void }) {
  const [users, setUsers] = useState<UsuarioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ matricula: "", nome: "", regional: "", senha: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/usuarios");
      if (res.ok) setUsers(await res.json());
      setLoading(false);
    })();
  }, []);

  const startEdit = (u: UsuarioRow) => {
    setEditingId(u.id);
    setForm({ matricula: u.matricula, nome: u.nome, regional: u.regional, senha: "" });
    setError("");
    setNotice("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/usuarios/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Erro ao salvar.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)));
      setNotice(form.senha ? `Dados e senha de ${data.nome} atualizados.` : `Dados de ${data.nome} atualizados.`);
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const q = query.trim().toLowerCase();
  const visible = q
    ? users.filter((u) => `${u.nome} ${u.matricula} ${u.regional}`.toLowerCase().includes(q))
    : users;

  const input =
    "w-full min-w-0 border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-vivo-purple bg-white";

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">Relação de usuários</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <p className="text-xs text-gray-400 mb-3">
          Edite matrícula, nome e regional, ou defina uma nova senha (deixe em branco para manter a atual).
        </p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome, matrícula ou regional..."
          className={`${input} mb-3 py-2`}
        />
        {notice && <p className="text-xs text-emerald-600 mb-2">{notice}</p>}

        <ul className="border border-gray-100 rounded-lg divide-y divide-gray-100 overflow-y-auto">
          {loading && <li className="px-3 py-4 text-xs text-gray-400 text-center">Carregando...</li>}
          {!loading && visible.length === 0 && (
            <li className="px-3 py-4 text-xs text-gray-400 text-center">Nenhum usuário encontrado</li>
          )}
          {visible.map((u) =>
            editingId === u.id ? (
              <li key={u.id} className="p-3 bg-violet-50/40 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[11px] text-gray-500">Matrícula</span>
                    <input
                      value={form.matricula}
                      onChange={(e) => setForm((f) => ({ ...f, matricula: e.target.value }))}
                      className={input}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-500">Nome</span>
                    <input
                      value={form.nome}
                      onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      className={input}
                    />
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-500">Regional</span>
                    <select
                      value={form.regional}
                      onChange={(e) => setForm((f) => ({ ...f, regional: e.target.value }))}
                      className={input}
                    >
                      {REGIONAIS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] text-gray-500">Nova senha (opcional)</span>
                    <input
                      type="text"
                      value={form.senha}
                      onChange={(e) => setForm((f) => ({ ...f, senha: e.target.value }))}
                      placeholder="Mín. 4 caracteres"
                      autoComplete="off"
                      className={input}
                    />
                  </label>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-xs rounded-lg text-gray-600 hover:bg-gray-100"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="px-3 py-1.5 text-xs rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar"}
                  </button>
                </div>
              </li>
            ) : (
              <li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
                <Avatar id={u.avatar} size={32} />
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="text-sm font-medium text-gray-700 truncate">{u.nome}</p>
                  <p className="text-xs text-gray-400 truncate">
                    Mat. {u.matricula} &middot; {u.regional}
                  </p>
                </div>
                <button
                  onClick={() => startEdit(u)}
                  className="text-xs text-vivo-purple hover:text-vivo-purpleDark font-medium shrink-0"
                >
                  Editar
                </button>
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
}
