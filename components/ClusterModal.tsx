"use client";

import { useEffect, useState } from "react";
import type { User } from "@/lib/types";
import ClusterSelect from "./ClusterSelect";
import VincularModal from "./VincularModal";

// Escolha do cluster do usuário (aparece sozinho enquanto ele não tiver um) e acesso
// ao vínculo dos registros antigos que ainda estão sem cluster.
export default function ClusterModal({
  user,
  onClose,
  onUpdated,
  onChanged,
}: {
  user: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
  onChanged: () => void;
}) {
  const [cluster, setCluster] = useState(user.cluster);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [pendentes, setPendentes] = useState(0);
  const [vincular, setVincular] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/clusters/pendentes");
      if (!res.ok) return;
      const d = await res.json();
      setPendentes(d.tecnicos.length + d.armarios.length + d.tipos.length + d.atividades.length);
    })();
  }, [user.cluster]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cluster }),
      });
      const updated = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(updated.error || "Erro ao salvar.");
        return;
      }
      onUpdated(updated);
      onChanged();
      // Com cluster novo e registros antigos pendentes, já abre o vínculo.
      if (updated.cluster && pendentes > 0) setVincular(true);
      else onClose();
    } finally {
      setSaving(false);
    }
  };

  if (vincular) {
    return (
      <VincularModal
        user={{ ...user, cluster }}
        onClose={onClose}
        onChanged={onChanged}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[65] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">Seu cluster</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          Regional <strong>{user.regional}</strong>. Armários, técnicos e atividades passam a ser exibidos por cluster.
        </p>

        <ClusterSelect regional={user.regional} value={cluster} onChange={setCluster} allowCreate />
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}

        {user.cluster && pendentes > 0 && (
          <button
            onClick={() => setVincular(true)}
            className="mt-4 w-full text-left text-sm rounded-lg bg-amber-50 text-amber-700 px-3 py-2"
          >
            {pendentes} registro(s) da regional sem cluster. <span className="underline">Vincular ao meu cluster</span>
          </button>
        )}

        <div className="flex justify-end gap-2 pt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100">
            {user.cluster ? "Cancelar" : "Agora não"}
          </button>
          <button
            onClick={save}
            disabled={saving || cluster === user.cluster}
            className="px-4 py-2 text-sm rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
