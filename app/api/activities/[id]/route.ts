import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

async function getActivity(id: number) {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM atividades WHERE id = ?",
    [id]
  );
  return rows[0] || null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const id = Number(params.id);
  const body = await req.json();
  const pool = getPool();

  const current = await getActivity(id);
  if (!current || current.regional !== user.regional) {
    return NextResponse.json({ error: "Atividade não encontrada." }, { status: 404 });
  }

  const fields: string[] = [];
  const values: any[] = [];

  // Edição de campos de texto
  for (const key of ["numero_evento", "atividade", "nome_armario", "descricao", "nome_tecnico", "motivo"]) {
    if (typeof body[key] === "string") {
      fields.push(`${key} = ?`);
      values.push(body[key]);
    }
  }

  // Trocou o técnico: acompanha a matrícula do técnico cadastrado.
  if (typeof body.nome_tecnico === "string") {
    const [tec] = await pool.query<RowDataPacket[]>(
      `SELECT matricula FROM tecnicos WHERE regional = ? AND nome = ? LIMIT 1`,
      [user.regional, body.nome_tecnico]
    );
    fields.push("matricula_tecnico = ?");
    values.push((tec[0]?.matricula as string) || "");
  }

  // Mudança de status (drag & drop no kanban)
  if (typeof body.status === "string" && body.status !== current.status) {
    const newStatus = body.status as string;

    if (current.status === "execucao" && newStatus !== "execucao") {
      // Saindo de "em execução": consolida o tempo decorrido
      const startedAt = current.started_at ? new Date(current.started_at as string) : null;
      const elapsed = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;
      fields.push("tempo_execucao_segundos = ?", "started_at = NULL");
      values.push((current.tempo_execucao_segundos as number) + Math.max(0, elapsed));
    }

    if (newStatus === "execucao" && current.status !== "execucao") {
      fields.push("started_at = NOW()");
    }

    if (newStatus === "concluida") {
      fields.push("concluded_at = NOW()");
      if (typeof body.conclusao === "string") {
        fields.push("conclusao = ?");
        values.push(body.conclusao);
      } else {
        fields.push("conclusao = ?");
        values.push("total");
      }
    }

    if (newStatus === "cancelada") {
      fields.push("concluded_at = NOW()");
    }

    if (newStatus === "aguardando") {
      fields.push("concluded_at = NULL", "conclusao = NULL");
    }

    fields.push("status = ?");
    values.push(newStatus);
  } else if (typeof body.conclusao === "string") {
    fields.push("conclusao = ?");
    values.push(body.conclusao);
  }

  if (fields.length === 0) {
    return NextResponse.json(current);
  }

  values.push(id);
  await pool.query(`UPDATE atividades SET ${fields.join(", ")} WHERE id = ?`, values);

  const updated = await getActivity(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const id = Number(params.id);
  const pool = getPool();

  const current = await getActivity(id);
  if (!current || current.regional !== user.regional) {
    return NextResponse.json({ error: "Atividade não encontrada." }, { status: 404 });
  }

  // Nunca exclui de fato: marca como excluída para manter rastreabilidade no histórico.
  const fields = ["status = 'excluida'", "deleted_at = NOW()", "deleted_by = ?"];
  const values: any[] = [user.nome];

  if (current.status === "execucao") {
    const startedAt = current.started_at ? new Date(current.started_at as string) : null;
    const elapsed = startedAt ? Math.floor((Date.now() - startedAt.getTime()) / 1000) : 0;
    fields.push("tempo_execucao_segundos = ?", "started_at = NULL");
    values.push((current.tempo_execucao_segundos as number) + Math.max(0, elapsed));
  }

  values.push(id);
  await pool.query(`UPDATE atividades SET ${fields.join(", ")} WHERE id = ?`, values);

  const updated = await getActivity(id);
  return NextResponse.json(updated);
}
