import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import type { RowDataPacket } from "@/lib/db";
import type { DbPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import type { User } from "@/lib/types";
import { generateSigla } from "@/lib/sigla";

const VALID_STATUS = ["aguardando", "execucao", "concluida", "cancelada"];

// Garante que o usuário do mobile exista em "tecnicos" (com matrícula) da regional dele,
// para aparecer nos filtros/seleções do desktop.
async function ensureTecnico(pool: DbPool, user: User) {
  const [byMatricula] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM tecnicos WHERE regional = ? AND matricula = ? LIMIT 1`,
    [user.regional, user.matricula]
  );
  if (byMatricula.length > 0) return;

  // Técnico antigo cadastrado só pelo nome: completa com a matrícula.
  const [byNome] = await pool.query<RowDataPacket[]>(
    `SELECT id FROM tecnicos WHERE regional = ? AND nome = ? AND matricula = '' LIMIT 1`,
    [user.regional, user.nome]
  );
  if (byNome.length > 0) {
    await pool.query(`UPDATE tecnicos SET matricula = ? WHERE id = ?`, [user.matricula, byNome[0].id]);
    return;
  }
  try {
    await pool.query(`INSERT INTO tecnicos (nome, matricula, regional) VALUES (?, ?, ?)`, [
      user.nome,
      user.matricula,
      user.regional,
    ]);
  } catch (err: any) {
    // Já existe outro técnico com esse nome+regional (com outra matrícula): não bloqueia o cadastro.
    if (err.code !== "ER_DUP_ENTRY") throw err;
  }
}

export async function GET(req: NextRequest) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const pool = getPool();
  // ?mine=1 (mobile): só as atividades da matrícula logada.
  const mine = req.nextUrl.searchParams.get("mine") === "1";
  const [rows] = mine
    ? await pool.query<RowDataPacket[]>(
        "SELECT * FROM atividades WHERE regional = ? AND matricula_tecnico = ? ORDER BY id DESC",
        [user.regional, user.matricula]
      )
    : await pool.query<RowDataPacket[]>(
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
  const { numero_evento, atividade, nome_armario, descricao } = body;
  const mine = req.nextUrl.searchParams.get("mine") === "1";

  if (!atividade || !nome_armario) {
    return NextResponse.json(
      { error: "Atividade e nome do armário são obrigatórios." },
      { status: 400 }
    );
  }

  const pool = getPool();

  let nome_tecnico: string = body.nome_tecnico || "";
  let matricula_tecnico = "";
  if (mine) {
    // Mobile: a atividade é sempre do usuário logado, que passa a constar como técnico.
    nome_tecnico = user.nome;
    matricula_tecnico = user.matricula;
    await ensureTecnico(pool, user);
  } else if (nome_tecnico) {
    const [tec] = await pool.query<RowDataPacket[]>(
      `SELECT matricula FROM tecnicos WHERE regional = ? AND nome = ? LIMIT 1`,
      [user.regional, nome_tecnico]
    );
    matricula_tecnico = (tec[0]?.matricula as string) || "";
  }

  // Status inicial: o kanban sempre cria em "aguardando"; o mobile (sem kanban) escolhe.
  const initialStatus: string =
    mine && VALID_STATUS.includes(body.status) ? body.status : "aguardando";
  const conclusao =
    initialStatus === "concluida" ? (body.conclusao === "parcial" ? "parcial" : "total") : null;
  const motivo = mine && typeof body.motivo === "string" ? body.motivo : null;

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
    `INSERT INTO atividades (numero_evento, atividade, nome_armario, descricao, nome_tecnico, matricula_tecnico, status, conclusao, motivo, regional, sigla, started_at, concluded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${initialStatus === "execucao" ? "NOW()" : "NULL"}, ${
       initialStatus === "concluida" || initialStatus === "cancelada" ? "NOW()" : "NULL"
     })`,
    [
      numero_evento || "",
      atividade,
      nome_armario,
      descricao || "",
      nome_tecnico,
      matricula_tecnico,
      initialStatus,
      conclusao,
      motivo,
      user.regional,
      sigla,
    ]
  );
  const insertId = (result as any).insertId;
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM atividades WHERE id = ?",
    [insertId]
  );
  return NextResponse.json(rows[0], { status: 201 });
}
