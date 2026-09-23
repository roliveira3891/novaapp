import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { generateSigla } from "@/lib/sigla";

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
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const body = await req.json();
  const { numero_evento, atividade, nome_armario, descricao, nome_tecnico } = body;

  if (!atividade || !nome_armario) {
    return NextResponse.json(
      { error: "Atividade e nome do armário são obrigatórios." },
      { status: 400 }
    );
  }

  const pool = getPool();

  const [tipoRows] = await pool.query<RowDataPacket[]>(
    `SELECT sigla FROM tipos_atividade WHERE regional = ? AND nome = ? LIMIT 1`,
    [user.regional, atividade]
  );
  let sigla = tipoRows[0]?.sigla as string | undefined;
  if (!sigla) {
    // Atividade digitada fora do cadastro (fallback): gera uma sigla própria para não repetir.
    const [usedRows] = await pool.query<RowDataPacket[]>(
      `SELECT sigla FROM tipos_atividade WHERE regional = ?
       UNION SELECT sigla FROM atividades WHERE regional = ?`,
      [user.regional, user.regional]
    );
    const taken = new Set<string>(
      (usedRows as { sigla: string }[]).map((r) => r.sigla).filter((s) => s && s.length === 3)
    );
    sigla = generateSigla(atividade, taken);
  }

  const [result] = await pool.query(
    `INSERT INTO atividades (numero_evento, atividade, nome_armario, descricao, nome_tecnico, status, regional, sigla)
     VALUES (?, ?, ?, ?, ?, 'aguardando', ?, ?)`,
    [numero_evento || "", atividade, nome_armario, descricao || "", nome_tecnico || "", user.regional, sigla]
  );
  const insertId = (result as any).insertId;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM atividades WHERE id = ?",
    [insertId]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
