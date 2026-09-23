import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { createSessionToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: NextRequest) {
  await ensureSchema();
  const body = await req.json();
  const matricula = (body.matricula || "").trim();
  const nome = (body.nome || "").trim();
  const regional = (body.regional || "").trim();
  const senha = body.senha || "";
  const avatar = (body.avatar || "a1").trim();

  if (!matricula || !nome || !regional || !senha) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }
  if (senha.length < 4) {
    return NextResponse.json({ error: "A senha deve ter ao menos 4 caracteres." }, { status: 400 });
  }

  const pool = getPool();
  const senha_hash = await hashPassword(senha);

  try {
    const [result] = await pool.query(
      "INSERT INTO usuarios (matricula, nome, regional, senha_hash, avatar) VALUES (?, ?, ?, ?, ?)",
      [matricula, nome, regional, senha_hash, avatar]
    );
    const insertId = (result as any).insertId;

    const token = await createSessionToken({ id: insertId, matricula });
    const res = NextResponse.json({ id: insertId, matricula, nome, regional, avatar }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
    }
    throw err;
  }
}
