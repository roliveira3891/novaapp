import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT id, matricula, nome, regional, avatar, criado_em FROM usuarios ORDER BY nome ASC"
  );
  return NextResponse.json(rows);
}
