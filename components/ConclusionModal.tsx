"use client";

import { useState } from "react";
import type { Activity } from "@/lib/types";

export type ConclusionChoice = "total" | "parcial" | "cancelada";

export default function ConclusionModal({
  activity,
  onClose,
  onConfirm,
}: {
  activity: Activity;
  onClose: () => void;
  onConfirm: (choice: ConclusionChoice, motivo: string) => Promise<void>;
}) {
  const [choice, setChoice] = useState<ConclusionChoice>("total");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    try {
      await onConfirm(choice, motivo);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[60] px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-gray-800">Concluir atividade</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <Option
            label="Totalmente concluída"
            checked={choice === "total"}
            onSelect={() => setChoice("total")}
          />
          <Option
            label="Concluída parcialmente"
            checked={choice === "parcial"}
            onSelect={() => setChoice("parcial")}
          />
          <Option
            label="Cancelada"
            checked={choice === "cancelada"}
            onSelect={() => setChoice("cancelada")}
          />
        </div>

        <label className="block mb-4">
          <span className="text-xs text-gray-500 mb-1 block">Ofensor / motivo da não conclusão</span>
          <textarea
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Informe o motivo..."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-vivo-purple min-h-[70px] resize-none"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium disabled:opacity-60"
          >
            {saving ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Option({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex items-center gap-2 w-full text-left text-sm text-gray-700"
    >
      <span
        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
          checked ? "border-vivo-purple" : "border-gray-300"
        }`}
      >
        {checked && <span className="w-2 h-2 rounded-full bg-vivo-purple" />}
      </span>
      {label}
    </button>
  );
}
