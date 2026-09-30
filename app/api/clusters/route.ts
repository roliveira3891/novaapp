import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { normalizeCluster } from "@/lib/clusters";
import { REGIONAIS } from "@/lib/regionais";

// Lista os clusters de uma regional (?regional=X; padrão: a do usuário logado).
// Sem login só para a tela de registro, que precisa listar antes de existir sessão.
export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await getCurrentUser();
  const regional = (req.nextUrl.searchParams.get("regional") || user?.regional || "").trim();
  if (!regional) return NextResponse.json([]);
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT id, nome, regional FROM clusters WHERE regional = ? ORDER BY nome ASC",
    [regional]
  );
  return NextResponse.json(rows);
}

// Cria um cluster na regional do usuário (ou devolve o existente, se o nome já estiver cadastrado).
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!(REGIONAIS as readonly string[]).includes(user.regional)) {
    return NextResponse.json({ error: "Regional inválida." }, { status: 400 });
  }
  const body = await req.json();
  const nome = normalizeCluster(body.nome);
  if (!nome) return NextResponse.json({ error: "Informe o nome do cluster." }, { status: 400 });

  const pool = getPool();
  try {
    await pool.query("INSERT INTO clusters (nome, regional) VALUES (?, ?)", [nome, user.regional]);
  } catch (err: any) {
    if (err.code !== "ER_DUP_ENTRY") throw err;
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, nome, regional FROM clusters WHERE regional = ? AND nome = ?",
    [user.regional, nome]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
