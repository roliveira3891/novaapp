"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import AvatarPicker from "./AvatarPicker";
import { REGIONAIS } from "@/lib/regionais";

export default function ProfileModal({
  user,
  onClose,
  onUpdated,
}: {
  user: User;
  onClose: () => void;
  onUpdated: (user: User) => void;
}) {
  const [avatar, setAvatar] = useState(user.avatar);
  const [nome, setNome] = useState(user.nome);
  const [regional, setRegional] = useState(user.regional);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar, nome, regional }),
      });
      const updated = await res.json();
      onUpdated(updated);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">Meu perfil</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="mb-5">
          <span className="text-xs text-gray-500 mb-2 block">Avatar</span>
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-gray-500 mb-1 block">Matrícula</span>
            <input
              value={user.matricula}
              disabled
              className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-500"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 mb-1 block">Nome completo</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple"
            />
          </label>
          <label className="block">
            <span className="text-xs text-gray-500 mb-1 block">Regional</span>
            <select
              value={regional}
              onChange={(e) => setRegional(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple"
            >
              {REGIONAIS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
