"use client";

import { useEffect, useState } from "react";
import type { Cluster } from "@/lib/types";

const NEW = "__novo__";

// Lista suspensa dos clusters de uma regional. Com `allowCreate` (só para a regional do próprio
// usuário logado) também permite cadastrar um cluster novo.
export default function ClusterSelect({
  regional,
  value,
  onChange,
  allowCreate = false,
  className = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple bg-white",
}: {
  regional: string;
  value: string;
  onChange: (cluster: string) => void;
  allowCreate?: boolean;
  className?: string;
}) {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [novo, setNovo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      const res = await fetch(`/api/clusters?regional=${encodeURIComponent(regional)}`);
      if (!cancelled && res.ok) setClusters(await res.json());
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [regional]);

  const handleAdd = async () => {
    setError("");
    const res = await fetch("/api/clusters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: novo }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Erro ao criar cluster.");
      return;
    }
    setClusters((prev) => (prev.some((c) => c.nome === data.nome) ? prev : [...prev, data]));
    onChange(data.nome);
    setNovo("");
    setAdding(false);
  };

  return (
    <div>
      <select
        value={adding ? NEW : value}
        onChange={(e) => {
          if (e.target.value === NEW) {
            setAdding(true);
          } else {
            setAdding(false);
            onChange(e.target.value);
          }
        }}
        className={className}
      >
        <option value="">{loading ? "Carregando..." : "Sem cluster"}</option>
        {clusters.map((c) => (
          <option key={c.id} value={c.nome}>
            {c.nome}
          </option>
        ))}
        {allowCreate && <option value={NEW}>+ Novo cluster...</option>}
      </select>
      {adding && (
        <div className="flex gap-2 mt-2">
          <input
            autoFocus
            value={novo}
            onChange={(e) => setNovo(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && novo.trim() && handleAdd()}
            placeholder="Nome do novo cluster"
            className={className}
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!novo.trim()}
            className="px-3 text-sm rounded-lg bg-vivo-purple text-white font-medium disabled:opacity-50 shrink-0"
          >
            Adicionar
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
