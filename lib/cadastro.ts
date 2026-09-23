import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { generateSigla } from "@/lib/sigla";

export function cadastroHandlers(table: "tecnicos" | "armarios" | "tipos_atividade") {
  async function GET() {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const pool = getPool();
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM ${table} WHERE regional = ? ORDER BY nome ASC`,
      [user.regional]
    );
    return NextResponse.json(rows);
  }

  async function POST(req: NextRequest) {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const body = await req.json();
    const nome = (body.nome || "").trim();
    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }
    const pool = getPool();
    try {
      let insertId: number;
      if (table === "tipos_atividade") {
        const [existing] = await pool.query<RowDataPacket[]>(
          `SELECT sigla FROM tipos_atividade WHERE regional = ?`,
          [user.regional]
        );
        const taken = new Set<string>(
          (existing as { sigla: string }[]).map((r) => r.sigla).filter((s) => s && s.length === 3)
        );
        const sigla = generateSigla(nome, taken);
        const [result] = await pool.query(
          `INSERT INTO tipos_atividade (nome, regional, sigla) VALUES (?, ?, ?)`,
          [nome, user.regional, sigla]
        );
        insertId = (result as any).insertId;
      } else {
        const [result] = await pool.query(
          `INSERT INTO ${table} (nome, regional) VALUES (?, ?)`,
          [nome, user.regional]
        );
        insertId = (result as any).insertId;
      }
      const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT * FROM ${table} WHERE id = ?`,
        [insertId]
      );
      return NextResponse.json(rows[0], { status: 201 });
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        return NextResponse.json({ error: "Já cadastrado." }, { status: 409 });
      }
      throw err;
    }
  }

  return { GET, POST };
}

export function cadastroItemHandlers(table: "tecnicos" | "armarios" | "tipos_atividade") {
  async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const pool = getPool();
    await pool.query(`DELETE FROM ${table} WHERE id = ? AND regional = ?`, [
      Number(params.id),
      user.regional,
    ]);
    return NextResponse.json({ ok: true });
  }
  return { DELETE };
}
