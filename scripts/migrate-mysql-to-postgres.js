#!/usr/bin/env node
/**
 * Migra os dados do MySQL atual para o Postgres novo (servidor 201).
 *
 * Uso:
 *   1) Pare o app (pm2 stop novaapp) para não entrar dado novo no MySQL
 *      enquanto a migração roda.
 *   2) Rode com as credenciais de origem (MySQL) e destino (Postgres):
 *
 *      DB_HOST=SEU_IP_AQUI DB_PORT=3306 DB_USER=ne DB_PASSWORD=*** DB_NAME=nova \
 *      PG_HOST=SEU_IP_AQUI PG_PORT=5432 PG_USER=iluminar_user PG_PASSWORD=*** PG_NAME=novaapp \
 *      node scripts/migrate-mysql-to-postgres.js
 *
 *      (as variáveis DB_* já existem no seu .env.local; as PG_* são novas,
 *      só para esta migração)
 *
 *   3) Se quiser rodar de novo do zero (ex: testou e quer refazer), passe
 *      --force para truncar as tabelas do Postgres antes de reimportar.
 *
 * O script:
 *   - garante que o schema do Postgres existe (roda db/schema.postgres.sql);
 *   - copia tecnicos, armarios, tipos_atividade, usuarios, atividades
 *     preservando os IDs originais;
 *   - ajusta as sequences do Postgres para continuar a partir do maior ID
 *     migrado (senão o próximo INSERT depois da migração colide com IDs
 *     já existentes).
 *
 * Não apaga nada no MySQL. É só leitura lá.
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const { Pool } = require("pg");

const FORCE = process.argv.includes("--force");

const TABLES = [
  {
    name: "tecnicos",
    columns: ["id", "nome", "regional"],
  },
  {
    name: "armarios",
    columns: ["id", "nome", "regional"],
  },
  {
    name: "tipos_atividade",
    columns: ["id", "nome", "regional", "sigla"],
  },
  {
    name: "usuarios",
    columns: ["id", "matricula", "nome", "regional", "senha_hash", "avatar", "criado_em"],
  },
  {
    name: "atividades",
    columns: [
      "id",
      "numero_evento",
      "data_criacao",
      "atividade",
      "nome_armario",
      "descricao",
      "nome_tecnico",
      "status",
      "conclusao",
      "started_at",
      "tempo_execucao_segundos",
      "concluded_at",
      "motivo",
      "regional",
      "deleted_at",
      "deleted_by",
      "sigla",
    ],
  },
];

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Faltou a variável de ambiente ${name}.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const mysqlPool = mysql.createPool({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: requireEnv("DB_USER"),
    password: process.env.DB_PASSWORD || "",
    database: requireEnv("DB_NAME"),
    waitForConnections: true,
    connectionLimit: 5,
    dateStrings: true,
  });

  const pgPool = new Pool({
    host: requireEnv("PG_HOST"),
    port: Number(process.env.PG_PORT || 5432),
    user: requireEnv("PG_USER"),
    password: process.env.PG_PASSWORD || "",
    database: requireEnv("PG_NAME"),
    max: 5,
  });

  try {
    console.log("Garantindo schema no Postgres (db/schema.postgres.sql)...");
    const schemaSql = fs.readFileSync(
      path.join(__dirname, "..", "db", "schema.postgres.sql"),
      "utf8"
    );
    await pgPool.query(schemaSql);

    if (FORCE) {
      console.log("--force: truncando tabelas do Postgres antes de reimportar...");
      const names = TABLES.map((t) => t.name).join(", ");
      await pgPool.query(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`);
    }

    for (const table of TABLES) {
      await migrateTable(mysqlPool, pgPool, table);
    }

    console.log("\nMigração concluída com sucesso.");
  } finally {
    await mysqlPool.end();
    await pgPool.end();
  }
}

async function migrateTable(mysqlPool, pgPool, table) {
  const { name, columns } = table;

  const { rows: existing } = await pgPool.query(`SELECT COUNT(*)::int AS c FROM ${name}`);
  if (existing[0].c > 0 && !FORCE) {
    console.log(
      `\n[${name}] já tem ${existing[0].c} linha(s) no Postgres — pulando (use --force para truncar e reimportar).`
    );
    return;
  }

  const [mysqlRows] = await mysqlPool.query(`SELECT ${columns.join(", ")} FROM ${name}`);
  console.log(`\n[${name}] ${mysqlRows.length} linha(s) para migrar...`);

  const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
  const insertSql = `INSERT INTO ${name} (${columns.join(", ")}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`;

  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    for (const row of mysqlRows) {
      const values = columns.map((c) => row[c]);
      await client.query(insertSql, values);
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }

  await pgPool.query(
    `SELECT setval(
       pg_get_serial_sequence('${name}', 'id'),
       (SELECT COALESCE(MAX(id), 1) FROM ${name}),
       (SELECT COUNT(*) FROM ${name}) > 0
     );`
  );

  console.log(`[${name}] ok.`);
}

main().catch((err) => {
  console.error("\nErro na migração:", err);
  process.exit(1);
});
