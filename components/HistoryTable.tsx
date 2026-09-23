"use client";

import { useEffect, useMemo, useState } from "react";
import type { Activity } from "@/lib/types";
import { formatActivityNumber, formatDateTime } from "@/lib/format";
import Timer from "./Timer";

const PAGE_SIZE = 10;

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  aguardando: { label: "Aguardando tratativa", className: "bg-violet-50 text-vivo-purple" },
  execucao: { label: "Em execução", className: "bg-blue-50 text-blue-600" },
  concluida: { label: "Totalmente concluída", className: "bg-emerald-50 text-emerald-600" },
  cancelada: { label: "Cancelada", className: "bg-red-50 text-red-600" },
  excluida: { label: "Excluída", className: "bg-gray-100 text-gray-600" },
};

export default function HistoryTable({
  activities,
  clockOffsetMs = 0,
  onView,
}: {
  activities: Activity[];
  clockOffsetMs?: number;
  onView?: (a: Activity) => void;
}) {
  const handleExport = () => {
    window.open("/api/activities/export", "_blank");
  };

  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(activities.length / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return activities.slice(start, start + PAGE_SIZE);
  }, [activities, page]);

  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClockIcon />
          <h2 className="font-semibold text-vivo-purpleDark">Histórico de atividades</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-vivo-purple hover:bg-vivo-purpleDark text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          <ExcelIcon /> Exportar Excel
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs border-b border-gray-100">
              <th className="py-2 pr-4 font-medium">Nº da atividade</th>
              <th className="py-2 pr-4 font-medium">Nome do técnico</th>
              <th className="py-2 pr-4 font-medium">Data de criação</th>
              <th className="py-2 pr-4 font-medium">Data de conclusão</th>
              <th className="py-2 pr-4 font-medium">Nome do armário</th>
              <th className="py-2 pr-4 font-medium">Descrição da atividade</th>
              <th className="py-2 pr-4 font-medium">Tempo em execução</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Excluído por</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((a) => {
              const conclusaoParcial = a.status === "concluida" && a.conclusao === "parcial";
              const statusInfo = conclusaoParcial
                ? { label: "Concluída parcialmente", className: "bg-amber-50 text-amber-600" }
                : STATUS_STYLE[a.status];
              return (
                <tr key={a.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2.5 pr-4 font-semibold text-vivo-purpleDark">
                    {onView ? (
                      <button
                        type="button"
                        onClick={() => onView(a)}
                        className="hover:underline underline-offset-2"
                        title="Ver detalhes da atividade"
                      >
                        {formatActivityNumber(a.id, a.sigla)}
                      </button>
                    ) : (
                      formatActivityNumber(a.id, a.sigla)
                    )}
                  </td>
                  <td className="py-2.5 pr-4 text-gray-700">{a.nome_tecnico || "—"}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{formatDateTime(a.data_criacao)}</td>
                  <td className="py-2.5 pr-4 text-gray-500">{formatDateTime(a.concluded_at)}</td>
                  <td className="py-2.5 pr-4 text-gray-700">{a.nome_armario}</td>
                  <td className="py-2.5 pr-4 text-gray-700">{a.atividade}</td>
                  <td className="py-2.5 pr-4 text-gray-700 font-mono">
                    <Timer
                      startedAt={a.started_at}
                      baseSeconds={a.tempo_execucao_segundos}
                      running={a.status === "execucao"}
                      clockOffsetMs={clockOffsetMs}
                    />
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.className}`}
                    >
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-gray-500">
                    {a.status === "excluida" ? (
                      <span title={a.deleted_at ? formatDateTime(a.deleted_at) : undefined}>
                        {a.deleted_by || "—"}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
            {activities.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center text-gray-400 py-8 text-xs">
                  Nenhuma atividade registrada
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {activities.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
          <span>
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, activities.length)} de{" "}
            {activities.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
              title="Página anterior"
            >
              <ChevronLeftIcon />
            </button>
            <span className="px-2 font-medium text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
              title="Próxima página"
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B2A86" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}
function ExcelIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="m9 13 6 6M15 13l-6 6" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
