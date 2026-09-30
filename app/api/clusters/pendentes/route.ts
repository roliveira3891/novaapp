import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

// Registros da regional ainda sem cluster, para o usuário escolher o que vincular ao cluster dele.
export async function GET() {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const pool = getPool();
  const q = async (sql: string) => (await pool.query<RowDataPacket[]>(sql, [user.regional]))[0];
  const [tecnicos, armarios, tipos, atividades] = await Promise.all([
    q("SELECT id, nome, matricula FROM tecnicos WHERE regional = ? AND cluster = '' ORDER BY nome ASC"),
    q("SELECT id, nome FROM armarios WHERE regional = ? AND cluster = '' ORDER BY nome ASC"),
    q("SELECT id, nome FROM tipos_atividade WHERE regional = ? AND cluster = '' ORDER BY nome ASC"),
    q(
      `SELECT id, numero_evento, atividade, nome_armario, nome_tecnico, status, sigla FROM atividades
       WHERE regional = ? AND cluster = '' ORDER BY id DESC`
    ),
  ]);
  return NextResponse.json({ tecnicos, armarios, tipos, atividades });
}
