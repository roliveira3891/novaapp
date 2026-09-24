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
    const matricula = (body.matricula || "").trim();
    if (table === "tecnicos" && !matricula) {
      return NextResponse.json({ error: "Matrícula é obrigatória." }, { status: 400 });
    }
    const pool = getPool();
    try {
      let insertId: number;
      if (table === "tecnicos") {
        const [dup] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM tecnicos WHERE regional = ? AND matricula = ? LIMIT 1`,
          [user.regional, matricula]
        );
        if (dup.length > 0) {
          return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
        }
        const [result] = await pool.query(
          `INSERT INTO tecnicos (nome, matricula, regional) VALUES (?, ?, ?)`,
          [nome, matricula, user.regional]
        );
        insertId = (result as any).insertId;
        // Atividades antigas deste técnico (cadastradas só pelo nome) passam a ter a matrícula.
        await pool.query(
          `UPDATE atividades SET matricula_tecnico = ? WHERE regional = ? AND nome_tecnico = ? AND matricula_tecnico = ''`,
          [matricula, user.regional, nome]
        );
      } else if (table === "tipos_atividade") {
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

  async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    await ensureSchema();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    const id = Number(params.id);
    const body = await req.json();
    const nome = (body.nome || "").trim();
    if (!nome) {
      return NextResponse.json({ error: "Nome é obrigatório." }, { status: 400 });
    }
    const matricula = (body.matricula || "").trim();
    if (table === "tecnicos" && !matricula) {
      return NextResponse.json({ error: "Matrícula é obrigatória." }, { status: 400 });
    }

    const pool = getPool();
    const [found] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM ${table} WHERE id = ? AND regional = ?`,
      [id, user.regional]
    );
    const current = found[0];
    if (!current) {
      return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
    }

    try {
      if (table === "tecnicos") {
        const [dup] = await pool.query<RowDataPacket[]>(
          `SELECT id FROM tecnicos WHERE regional = ? AND matricula = ? AND id <> ? LIMIT 1`,
          [user.regional, matricula, id]
        );
        if (dup.length > 0) {
          return NextResponse.json({ error: "Matrícula já cadastrada." }, { status: 409 });
        }
        await pool.query(`UPDATE tecnicos SET nome = ?, matricula = ? WHERE id = ?`, [nome, matricula, id]);
        // As atividades guardam o nome como texto: acompanha a alteração.
        await pool.query(
          `UPDATE atividades SET nome_tecnico = ?, matricula_tecnico = ? WHERE regional = ? AND nome_tecnico = ?`,
          [nome, matricula, user.regional, current.nome]
        );
      } else if (table === "armarios") {
        await pool.query(`UPDATE armarios SET nome = ? WHERE id = ?`, [nome, id]);
        await pool.query(`UPDATE atividades SET nome_armario = ? WHERE regional = ? AND nome_armario = ?`, [
          nome,
          user.regional,
          current.nome,
        ]);
      } else {
        // A sigla é mantida: os números das atividades já emitidas não mudam.
        await pool.query(`UPDATE tipos_atividade SET nome = ? WHERE id = ?`, [nome, id]);
        await pool.query(`UPDATE atividades SET atividade = ? WHERE regional = ? AND atividade = ?`, [
          nome,
          user.regional,
          current.nome,
        ]);
      }
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        return NextResponse.json({ error: "Já cadastrado." }, { status: 409 });
      }
      throw err;
    }

    const [rows] = await pool.query<RowDataPacket[]>(`SELECT * FROM ${table} WHERE id = ?`, [id]);
    return NextResponse.json(rows[0]);
  }

  return { DELETE, PATCH };
}
