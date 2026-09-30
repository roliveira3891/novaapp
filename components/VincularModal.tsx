"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";

interface Pendentes {
  tecnicos: { id: number; nome: string; matricula: string }[];
  armarios: { id: number; nome: string }[];
  tipos: { id: number; nome: string }[];
  atividades: { id: number; numero_evento: string; atividade: string; nome_armario: string; nome_tecnico: string }[];
}

type Group = keyof Pendentes;

const GROUPS: { key: Group; label: string }[] = [
  { key: "armarios", label: "Armários" },
  { key: "tipos", label: "Tipos de atividade" },
  { key: "tecnicos", label: "Técnicos" },
  { key: "atividades", label: "Atividades" },
];

// Registros criados antes do cluster existir: cada usuário puxa para o seu cluster o que é dele.
export default function VincularModal({
  user,
  onClose,
  onChanged,
}: {
  user: User;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<Pendentes | null>(null);
  const [selected, setSelected] = useState<Record<Group, Set<number>>>({
    armarios: new Set(),
    tipos: new Set(),
    tecnicos: new Set(),
    atividades: new Set(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const load = async () => {
    const res = await fetch("/api/clusters/pendentes");
    if (res.ok) setData(await res.json());
  };
  useEffect(() => {
    load();
  }, []);

  const label = (g: Group, item: any): string => {
    if (g === "tecnicos") return `${item.nome}${item.matricula ? ` (${item.matricula})` : ""}`;
    if (g === "atividades") {
      return [item.atividade, item.nome_armario, item.nome_tecnico, item.numero_evento && `Evento ${item.numero_evento}`]
        .filter(Boolean)
        .join(" · ");
    }
    return item.nome;
  };

  const toggle = (g: Group, id: number) =>
    setSelected((prev) => {
      const next = new Set(prev[g]);
      next.has(id) ? next.delete(id) : next.add(id);
      return { ...prev, [g]: next };
    });

  const toggleAll = (g: Group) =>
    setSelected((prev) => {
      const all = data![g];
      const next = prev[g].size === all.length ? new Set<number>() : new Set<number>(all.map((i) => i.id));
      return { ...prev, [g]: next };
    });

  const total = Object.values(selected).reduce((n, s) => n + s.size, 0);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/clusters/vincular", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          armarios: [...selected.armarios],
          tipos: [...selected.tipos],
          tecnicos: [...selected.tecnicos],
          atividades: [...selected.atividades],
        }),
      });
      const r = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(r.error || "Erro ao vincular.");
        return;
      }
      setDone(
        `Vinculado ao cluster ${user.cluster}: ${r.armarios} armário(s), ${r.tipos} tipo(s) de atividade, ${r.tecnicos} técnico(s), ${r.atividades} atividade(s).`
      );
      setSelected({ armarios: new Set(), tipos: new Set(), tecnicos: new Set(), atividades: new Set() });
      await load();
      onChanged();
    } finally {
      setSaving(false);
    }
  };

  const empty = data && GROUPS.every((g) => data[g.key].length === 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[70] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-5 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">Registros sem cluster</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          Marque o que pertence ao seu cluster <strong>{user.cluster || "(escolha um cluster primeiro)"}</strong>. Ao
          vincular um armário, as atividades dele vão junto.
        </p>

        {done && <p className="text-xs text-emerald-600 mb-2">{done}</p>}
        {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

        <div className="overflow-y-auto flex-1 space-y-4 pr-1">
          {!data && <p className="text-xs text-gray-400 text-center py-6">Carregando...</p>}
          {empty && <p className="text-xs text-gray-400 text-center py-6">Nenhum registro sem cluster na sua regional.</p>}
          {data &&
            GROUPS.filter((g) => data[g.key].length > 0).map((g) => (
              <section key={g.key}>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-medium text-gray-700">
                    {g.label} ({data[g.key].length})
                  </h4>
                  <button onClick={() => toggleAll(g.key)} className="text-xs text-vivo-purple font-medium">
                    {selected[g.key].size === data[g.key].length ? "Desmarcar todos" : "Marcar todos"}
                  </button>
                </div>
                <ul className="border border-gray-100 rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
                  {(data[g.key] as any[]).map((item) => (
                    <li key={item.id}>
                      <label className="flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={selected[g.key].has(item.id)}
                          onChange={() => toggle(g.key, item.id)}
                        />
                        <span className="truncate">{label(g.key, item)}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100">
            Fechar
          </button>
          <button
            onClick={save}
            disabled={saving || total === 0 || !user.cluster}
            className="px-4 py-2 text-sm rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium disabled:opacity-50"
          >
            {saving ? "Vinculando..." : `Vincular ao meu cluster (${total})`}
          </button>
        </div>
      </div>
    </div>
  );
}
