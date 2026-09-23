import { Pool, types } from "pg";
import { generateSigla } from "./sigla";

// Mantém timestamps/datas como string (formato "YYYY-MM-DD HH:MM:SS"), igual ao
// comportamento antigo do mysql2 com dateStrings:true, para não quebrar o código
// que já espera strings (lib/format.ts, cálculos de tempo decorrido, etc).
types.setTypeParser(1114, (v) => v); // timestamp without time zone
types.setTypeParser(1082, (v) => v); // date

export type RowDataPacket = Record<string, any>;

declare global {
  // eslint-disable-next-line no-var
  var __novaPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __novaSchemaReady: Promise<void> | undefined;
  // eslint-disable-next-line no-var
  var __novaDbClient: DbClient | undefined;
}

type QueryResultTuple<T> = [T, any];

class DbClient {
  constructor(private pool: Pool) {}

  async query<T = any>(sql: string, params: any[] = []): Promise<QueryResultTuple<T>> {
    let i = 0;
    const text = sql.replace(/\?/g, () => `$${++i}`);
    const isSelect = /^\s*select/i.test(text);
    const isInsert = /^\s*insert\s+into/i.test(text);
    const finalText = isInsert && !/returning/i.test(text) ? `${text} RETURNING id` : text;

    try {
      const res = await this.pool.query(finalText, params);
      if (isSelect) {
        return [res.rows as T, res.fields];
      }
      if (isInsert) {
        const insertId = res.rows[0]?.id;
        return [{ insertId, affectedRows: res.rowCount } as any as T, res.fields];
      }
      return [{ affectedRows: res.rowCount } as any as T, res.fields];
    } catch (err: any) {
      if (err.code === "23505") err.code = "ER_DUP_ENTRY";
      throw err;
    }
  }
}

export function getPool(): DbClient {
  if (!global.__novaPool) {
    global.__novaPool = new Pool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      max: 10,
    });
  }
  if (!global.__novaDbClient) {
    global.__novaDbClient = new DbClient(global.__novaPool);
  }
  return global.__novaDbClient;
}

async function safeAlter(pool: DbClient, sql: string) {
  try {
    await pool.query(sql);
  } catch {
    // Ignora se a alteração já foi aplicada anteriormente (índice/coluna já existe ou não existe mais)
  }
}

async function backfillSiglas(pool: DbClient) {
  const [regionaisRows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT regional FROM tipos_atividade
     UNION SELECT DISTINCT regional FROM atividades`
  );

  for (const { regional } of regionaisRows as { regional: string }[]) {
    const [tipos] = await pool.query<RowDataPacket[]>(
      `SELECT id, nome, sigla FROM tipos_atividade WHERE regional = ? ORDER BY id ASC`,
      [regional]
    );
    const taken = new Set<string>(
      (tipos as { sigla: string }[]).map((t) => t.sigla).filter((s) => s && s.length === 3)
    );

    for (const tipo of tipos as { id: number; nome: string; sigla: string }[]) {
      if (tipo.sigla && tipo.sigla.length === 3) continue;
      const sigla = generateSigla(tipo.nome, taken);
      taken.add(sigla);
      await pool.query(`UPDATE tipos_atividade SET sigla = ? WHERE id = ?`, [sigla, tipo.id]);
    }

    // Atividades já criadas sem sigla: tenta casar pelo nome do tipo cadastrado;
    // se não achar (texto livre de antes do cadastro por tipo), gera uma sigla própria.
    const [tiposAtuais] = await pool.query<RowDataPacket[]>(
      `SELECT nome, sigla FROM tipos_atividade WHERE regional = ?`,
      [regional]
    );
    const siglaPorNome = new Map<string, string>(
      (tiposAtuais as { nome: string; sigla: string }[]).map((t) => [t.nome.trim().toLowerCase(), t.sigla])
    );

    const [semSigla] = await pool.query<RowDataPacket[]>(
      `SELECT id, atividade FROM atividades WHERE regional = ? AND (sigla = '' OR sigla IS NULL)`,
      [regional]
    );
    for (const a of semSigla as { id: number; atividade: string }[]) {
      let sigla = siglaPorNome.get((a.atividade || "").trim().toLowerCase());
      if (!sigla) {
        sigla = generateSigla(a.atividade || "ATV", taken);
        taken.add(sigla);
      }
      await pool.query(`UPDATE atividades SET sigla = ? WHERE id = ?`, [sigla, a.id]);
    }
  }
}

async function createSchema() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS atividades (
      id SERIAL PRIMARY KEY,
      numero_evento VARCHAR(50) NOT NULL DEFAULT '',
      data_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      atividade VARCHAR(255) NOT NULL DEFAULT '',
      nome_armario VARCHAR(100) NOT NULL DEFAULT '',
      descricao TEXT,
      nome_tecnico VARCHAR(120) NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'aguardando'
        CHECK (status IN ('aguardando','execucao','concluida','cancelada','excluida')),
      conclusao VARCHAR(10) NULL CHECK (conclusao IN ('total','parcial')),
      started_at TIMESTAMP NULL,
      tempo_execucao_segundos INT NOT NULL DEFAULT 0,
      concluded_at TIMESTAMP NULL,
      motivo TEXT NULL,
      regional VARCHAR(60) NOT NULL DEFAULT '',
      deleted_at TIMESTAMP NULL,
      deleted_by VARCHAR(120) NULL,
      sigla CHAR(3) NOT NULL DEFAULT ''
    );
  `);

  await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS motivo TEXT NULL;`);
  await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS regional VARCHAR(60) NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP NULL;`);
  await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(120) NULL;`);
  await pool.query(`ALTER TABLE atividades ADD COLUMN IF NOT EXISTS sigla CHAR(3) NOT NULL DEFAULT '';`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tecnicos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      regional VARCHAR(60) NOT NULL DEFAULT ''
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS armarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100) NOT NULL,
      regional VARCHAR(60) NOT NULL DEFAULT ''
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tipos_atividade (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(150) NOT NULL,
      regional VARCHAR(60) NOT NULL DEFAULT '',
      sigla CHAR(3) NOT NULL DEFAULT ''
    );
  `);

  await pool.query(`ALTER TABLE tipos_atividade ADD COLUMN IF NOT EXISTS sigla CHAR(3) NOT NULL DEFAULT '';`);

  await pool.query(`ALTER TABLE tecnicos ADD COLUMN IF NOT EXISTS regional VARCHAR(60) NOT NULL DEFAULT '';`);
  await pool.query(`ALTER TABLE armarios ADD COLUMN IF NOT EXISTS regional VARCHAR(60) NOT NULL DEFAULT '';`);

  // Registros antigos, criados antes do vínculo por regional, migrados para CENTRO OESTE
  await pool.query(`UPDATE tecnicos SET regional = 'CENTRO OESTE' WHERE regional = '';`);
  await pool.query(`UPDATE armarios SET regional = 'CENTRO OESTE' WHERE regional = '';`);

  await safeAlter(pool, `ALTER TABLE tecnicos ADD CONSTRAINT uniq_tecnico_regional UNIQUE (nome, regional);`);
  await safeAlter(pool, `ALTER TABLE armarios ADD CONSTRAINT uniq_armario_regional UNIQUE (nome, regional);`);
  await safeAlter(
    pool,
    `ALTER TABLE tipos_atividade ADD CONSTRAINT uniq_tipo_atividade_regional UNIQUE (nome, regional);`
  );

  await backfillSiglas(pool);

  await safeAlter(
    pool,
    `ALTER TABLE tipos_atividade ADD CONSTRAINT uniq_tipo_atividade_sigla UNIQUE (sigla, regional);`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      matricula VARCHAR(30) NOT NULL UNIQUE,
      nome VARCHAR(120) NOT NULL,
      regional VARCHAR(60) NOT NULL DEFAULT '',
      senha_hash VARCHAR(255) NOT NULL,
      avatar VARCHAR(20) NOT NULL DEFAULT 'a1',
      criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function ensureSchema(): Promise<void> {
  if (!global.__novaSchemaReady) {
    global.__novaSchemaReady = createSchema();
  }
  return global.__novaSchemaReady;
}
