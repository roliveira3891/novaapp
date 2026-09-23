import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  await ensureSchema();
  const body = await req.json();
  const matricula = (body.matricula || "").trim();
  const senha = body.senha || "";

  if (!matricula || !senha) {
    return NextResponse.json({ error: "Informe matrícula e senha." }, { status: 400 });
  }

  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM usuarios WHERE matricula = ?",
    [matricula]
  );
  const user = rows[0];

  if (!user || !(await verifyPassword(senha, user.senha_hash as string))) {
    return NextResponse.json({ error: "Matrícula ou senha inválidos." }, { status: 401 });
  }

  const token = await createSessionToken({ id: user.id as number, matricula: user.matricula as string });
  const res = NextResponse.json({
    id: user.id,
    matricula: user.matricula,
    nome: user.nome,
    regional: user.regional,
    avatar: user.avatar,
  });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
