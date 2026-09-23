"use client";

import type { Activity } from "@/lib/types";
import { formatActivityNumber, formatDateTime } from "@/lib/format";
import Timer from "./Timer";

export default function ActivityCard({
  activity,
  innerRef,
  draggableProps,
  dragHandleProps,
  onEdit,
  onView,
  onDelete,
  onRequestConclude,
  clockOffsetMs = 0,
}: {
  activity: Activity;
  innerRef?: (el: HTMLElement | null) => void;
  draggableProps?: any;
  dragHandleProps?: any;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
  onRequestConclude: () => void;
  clockOffsetMs?: number;
}) {
  return (
    <div
      ref={innerRef}
      {...draggableProps}
      className="bg-white rounded-xl shadow-card mb-3 border border-gray-100 flex overflow-hidden hover:shadow-md transition-shadow"
    >
      <div
        {...dragHandleProps}
        className="flex flex-col items-center justify-center gap-[3px] px-1.5 cursor-grab active:cursor-grabbing shrink-0 bg-gray-50/60"
      >
        <GripDots />
      </div>

      <div className="p-3.5 pl-2.5 flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={onView}
            className="font-semibold text-vivo-purpleDark text-sm hover:underline underline-offset-2 text-left"
            title="Ver detalhes da atividade"
          >
            {formatActivityNumber(activity.id, activity.sigla)}
          </button>
          <div className="flex items-center gap-2 shrink-0">
            {activity.status === "concluida" && (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                  activity.conclusao === "parcial"
                    ? "bg-amber-50 text-amber-600"
                    : "bg-emerald-50 text-emerald-600"
                }`}
              >
                <CheckDotIcon />
                {activity.conclusao === "parcial" ? "Concluída parcialmente" : "Totalmente concluída"}
              </span>
            )}
            <button onClick={onEdit} className="text-gray-400 hover:text-vivo-purple transition-colors" title="Editar">
              <PencilIcon />
            </button>
            <button onClick={onDelete} className="text-gray-400 hover:text-red-500 transition-colors" title="Excluir">
              <TrashIcon />
            </button>
          </div>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1 text-xs">
            <Row label="Nome do técnico" value={activity.nome_tecnico || "—"} />
            <Row label="Data de criação" value={formatDateTime(activity.data_criacao)} />
            <Row label="Nome do armário" value={activity.nome_armario} />
            <Row label="Descrição da atividade" value={activity.atividade} />
            <Row
              label="Tempo em execução"
              value={
                <Timer
                  startedAt={activity.started_at}
                  baseSeconds={activity.tempo_execucao_segundos}
                  running={activity.status === "execucao"}
                  clockOffsetMs={clockOffsetMs}
                />
              }
              mono
            />
          </div>

          {activity.status === "execucao" && (
            <div className="flex flex-col items-end gap-2 pt-0.5 shrink-0">
              <span className="flex items-center gap-1 bg-vivo-purple/10 text-vivo-purpleDark font-bold text-xs px-2.5 py-1.5 rounded-lg font-mono tabular-nums whitespace-nowrap">
                <ClockIcon />
                <Timer
                  startedAt={activity.started_at}
                  baseSeconds={activity.tempo_execucao_segundos}
                  running
                  clockOffsetMs={clockOffsetMs}
                />
              </span>
              <button
                onClick={onRequestConclude}
                className="flex items-center gap-1 bg-vivo-purple hover:bg-vivo-purpleDark text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shadow-sm whitespace-nowrap"
              >
                Concluir
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex gap-1 text-gray-600">
      <span className="text-gray-400 shrink-0">{label}:</span>
      <span className={`text-gray-700 font-medium truncate ${mono ? "font-mono tabular-nums" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function GripDots() {
  return (
    <svg width="8" height="18" viewBox="0 0 8 18" fill="#C9C2D6">
      <circle cx="2" cy="2" r="1.4" />
      <circle cx="6" cy="2" r="1.4" />
      <circle cx="2" cy="9" r="1.4" />
      <circle cx="6" cy="9" r="1.4" />
      <circle cx="2" cy="16" r="1.4" />
      <circle cx="6" cy="16" r="1.4" />
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
function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function CheckDotIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
}
