import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { formatActivityNumber, formatDateTime } from "@/lib/format";
import * as XLSX from "xlsx";

const STATUS_LABEL: Record<string, string> = {
  aguardando: "Aguardando tratativa",
  execucao: "Em execução",
  concluida: "Concluída",
  cancelada: "Cancelada",
  excluida: "Excluída",
};

function formatSeconds(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export async function GET() {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM atividades WHERE regional = ? ORDER BY id DESC",
    [user.regional]
  );

  const data = rows.map((r) => {
    let statusLabel = STATUS_LABEL[r.status as string] || r.status;
    if (r.status === "concluida") {
      statusLabel = r.conclusao === "parcial" ? "Concluída parcialmente" : "Totalmente concluída";
    }
    let segundos = r.tempo_execucao_segundos as number;
    if (r.status === "execucao" && r.started_at) {
      segundos += Math.floor((Date.now() - new Date(r.started_at as string).getTime()) / 1000);
    }
    return {
      "Nº da atividade": formatActivityNumber(r.id as number, r.sigla as string),
      "Nº do evento": r.numero_evento,
      "Nome do técnico": r.nome_tecnico,
      "Data de criação": formatDateTime(r.data_criacao as string | null),
      "Data de conclusão": formatDateTime(r.concluded_at as string | null),
      "Nome do armário": r.nome_armario,
      "Descrição da atividade": r.descricao,
      "Tempo em execução": formatSeconds(Math.max(0, segundos)),
      Status: statusLabel,
      "Excluído por": r.status === "excluida" ? r.deleted_by || "" : "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Atividades");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="historico-atividades.xlsx"`,
    },
  });
}
