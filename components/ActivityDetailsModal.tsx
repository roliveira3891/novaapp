"use client";

import type { Activity } from "@/lib/types";
import { formatActivityNumber, formatDateTime, formatSeconds } from "@/lib/format";

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  aguardando: { label: "Aguardando tratativa", className: "bg-violet-50 text-vivo-purple" },
  execucao: { label: "Em execução", className: "bg-blue-50 text-blue-600" },
  concluida: { label: "Totalmente concluída", className: "bg-emerald-50 text-emerald-600" },
  cancelada: { label: "Cancelada", className: "bg-red-50 text-red-600" },
  excluida: { label: "Excluída", className: "bg-gray-100 text-gray-600" },
};

export default function ActivityDetailsModal({
  activity,
  clockOffsetMs = 0,
  onClose,
  onEdit,
}: {
  activity: Activity;
  clockOffsetMs?: number;
  onClose: () => void;
  onEdit?: () => void;
}) {
  const conclusaoParcial = activity.status === "concluida" && activity.conclusao === "parcial";
  const statusInfo = conclusaoParcial
    ? { label: "Concluída parcialmente", className: "bg-amber-50 text-amber-600" }
    : STATUS_STYLE[activity.status];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-vivo-purpleDark">
            Atividade {formatActivityNumber(activity.id, activity.sigla)}
          </h3>
          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.className}`}>
            {statusInfo.label}
          </span>
        </div>

        <div className="space-y-3 text-sm">
          <Field label="Nome do técnico" value={activity.nome_tecnico || "—"} />
          <Field label="Número do evento" value={activity.numero_evento || "—"} />
          <Field label="Atividade" value={activity.atividade || "—"} />
          <Field label="Nome do armário" value={activity.nome_armario || "—"} />
          <Field label="Descrição" value={activity.descricao || "—"} multiline />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Data de criação" value={formatDateTime(activity.data_criacao)} />
            <Field label="Data de conclusão" value={formatDateTime(activity.concluded_at)} />
          </div>
          <Field label="Tempo em execução" value={formatSeconds(activity.tempo_execucao_segundos)} />
          {activity.motivo && <Field label="Motivo" value={activity.motivo} multiline />}
          {activity.status === "excluida" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Excluído por" value={activity.deleted_by || "—"} />
              <Field label="Excluído em" value={formatDateTime(activity.deleted_at)} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-gray-600 hover:bg-gray-100"
          >
            Fechar
          </button>
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="px-4 py-2 text-sm rounded-lg bg-vivo-purple hover:bg-vivo-purpleDark text-white font-medium"
            >
              Editar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div>
      <span className="text-xs text-gray-400 block mb-0.5">{label}</span>
      <span className={`text-gray-700 font-medium ${multiline ? "block whitespace-pre-wrap" : ""}`}>{value}</span>
    </div>
  );
}
