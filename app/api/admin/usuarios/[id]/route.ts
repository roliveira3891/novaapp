import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { hashPassword } from "@/lib/password";
import { REGIONAIS } from "@/lib/regionais";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.isAdmin) return NextResponse.json({ error: "Acesso negado." }, { status: 403 });

  const id = Number(params.id);
  const body = await req.json();
  const matricula = (body.matricula || "").trim();
  const nome = (body.nome || "").trim();
  const regional = (body.regional || "").trim();
  const senha: string = body.senha || "";

  if (!matricula || !nome || !regional) {
    return NextResponse.json({ error: "Matrícula, nome e regional são obrigatórios." }, { status: 400 });
  }
  if (!(REGIONAIS as readonly string[]).includes(regional)) {
    return NextResponse.json({ error: "Regional inválida." }, { status: 400 });
  }
  if (senha && senha.length < 4) {
    return NextResponse.json({ error: "A senha deve ter ao menos 4 caracteres." }, { status: 400 });
  }

  const pool = getPool();
  const [found] = await pool.query<RowDataPacket[]>(
    "SELECT id, matricula, nome, regional FROM usuarios WHERE id = ?",
    [id]
  );
  const current = found[0];
  if (!current) return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });

  try {
    if (senha) {
      const senha_hash = await hashPassword(senha);
      await pool.query(
        "UPDATE usuarios SET matricula = ?, nome = ?, regional = ?, senha_hash = ? WHERE id = ?",
        [matricula, nome, regional, senha_hash, id]
      );
    } else {
      await pool.query("UPDATE usuarios SET matricula = ?, nome = ?, regional = ? WHERE id = ?", [
        matricula,
        nome,
        regional,
        id,
      ]);
    }
  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
    }
    throw err;
  }

  // Mantém técnico e atividades (ligados pela matrícula) coerentes com o usuário editado.
  if (current.matricula !== matricula || current.nome !== nome) {
    await pool.query(
      "UPDATE tecnicos SET matricula = ?, nome = ? WHERE regional = ? AND matricula = ?",
      [matricula, nome, current.regional, current.matricula]
    );
    await pool.query(
      "UPDATE atividades SET matricula_tecnico = ?, nome_tecnico = ? WHERE regional = ? AND matricula_tecnico = ?",
      [matricula, nome, current.regional, current.matricula]
    );
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, matricula, nome, regional, avatar, criado_em FROM usuarios WHERE id = ?",
    [id]
  );
  return NextResponse.json(rows[0]);
}
