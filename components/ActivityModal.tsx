"use client";

import { useState } from "react";
import type { Activity, ActivityInput, Tecnico, Armario, TipoAtividade } from "@/lib/types";
import { formatActivityNumber } from "@/lib/format";

export default function ActivityModal({
  activity,
  tecnicos,
  armarios,
  tiposAtividade,
  onClose,
  onSave,
  onOpenCadastros,
}: {
  activity: Activity | null;
  tecnicos: Tecnico[];
  armarios: Armario[];
  tiposAtividade: TipoAtividade[];
  onClose: () => void;
  onSave: (data: ActivityInput) => Promise<void>;
  onOpenCadastros: () => void;
}) {
  const [form, setForm] = useState<ActivityInput>({
    numero_evento: activity?.numero_evento || "",
    atividade: activity?.atividade || "",
    nome_armario: activity?.nome_armario || "",
    descricao: activity?.descricao || "",
    nome_tecnico: activity?.nome_tecnico || "",
  });
  const [saving, setSaving] = useState(false);

  const set =
    (key: keyof ActivityInput) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">
            {activity ? `Editar atividade ${formatActivityNumber(activity.id, activity.sigla)}` : "Nova atividade"}
          </h3>
          <button
            type="button"
            onClick={onOpenCadastros}
            className="text-xs text-vivo-purple hover:text-vivo-purpleDark font-medium"
          >
            + Cadastrar técnico/armário/atividade
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Nome do técnico">
            <select required value={form.nome_tecnico} onChange={set("nome_tecnico")} className="input">
              <option value="" disabled>
                {tecnicos.length ? "Selecione o técnico" : "Nenhum técnico cadastrado"}
              </option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Número do evento">
            <input
              value={form.numero_evento}
              onChange={set("numero_evento")}
              className="input"
              placeholder="Ex: EV-1023"
            />
          </Field>
          <Field label="Atividade">
            <select required value={form.atividade} onChange={set("atividade")} className="input">
              <option value="" disabled>
                {tiposAtividade.length ? "Selecione a atividade" : "Nenhuma atividade cadastrada"}
              </option>
              {tiposAtividade.map((t) => (
                <option key={t.id} value={t.nome}>
                  {t.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nome do armário">
            <select required value={form.nome_armario} onChange={set("nome_armario")} className="input">
              <option value="" disabled>
                {armarios.length ? "Selecione o armário" : "Nenhum armário cadastrado"}
              </option>
              {armarios.map((a) => (
                <option key={a.id} value={a.nome}>
                  {a.nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descrição">
            <textarea
              value={form.descricao}
              onChange={set("descricao")}
              className="input min-h-[80px] resize-none"
              placeholder="Detalhes da atividade..."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium disabled:opacity-60"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus {
          border-color: #8b3fd8;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 mb-1 block">{label}</span>
      {children}
    </label>
  );
}
