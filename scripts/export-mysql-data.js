#!/usr/bin/env node
/**
 * Exporta os dados do MySQL atual para um arquivo .sql pronto para rodar
 * no Postgres, sem precisar de conexão direta entre os dois servidores.
 *
 * Uso (aqui, onde há acesso ao MySQL):
 *   node scripts/export-mysql-data.js > db/data-export.sql
 *
 * Depois, no servidor do Postgres (201):
 *   psql "host=SEU_IP_AQUI dbname=novaapp user=iluminar_user" -f db/data-export.sql
 *
 * O arquivo gerado:
 *   - roda o schema.postgres.sql primeiro (CREATE TABLE IF NOT EXISTS, seguro repetir);
 *   - insere tecnicos, armarios, tipos_atividade, usuarios, atividades,
 *     preservando os IDs originais, com ON CONFLICT (id) DO NOTHING
 *     (não duplica se rodar mais de uma vez);
 *   - ajusta as sequences do Postgres no final, para que o próximo INSERT
 *     depois da importação continue a partir do maior ID migrado.
 *
 * Não altera nada no MySQL, é só leitura.
 */

const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const TABLES = [
  { name: "tecnicos", columns: ["id", "nome", "regional"] },
  { name: "armarios", columns: ["id", "nome", "regional"] },
  { name: "tipos_atividade", columns: ["id", "nome", "regional", "sigla"] },
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

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (Buffer.isBuffer(value)) return `'\\x${value.toString("hex")}'`;
  // datas vêm como string por causa de dateStrings:true no pool do MySQL
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Faltou a variável de ambiente ${name}.`);
    process.exit(1);
  }
  return v;
}

async function main() {
  const pool = mysql.createPool({
    host: requireEnv("DB_HOST"),
    port: Number(process.env.DB_PORT || 3306),
    user: requireEnv("DB_USER"),
    password: process.env.DB_PASSWORD || "",
    database: requireEnv("DB_NAME"),
    connectionLimit: 3,
    dateStrings: true,
  });

  const out = [];
  out.push("-- Dump de dados MySQL -> Postgres, gerado por scripts/export-mysql-data.js");
  out.push(`-- Gerado em: ${new Date().toISOString()}`);
  out.push("-- Rode com: psql \"host=... dbname=novaapp user=...\" -f data-export.sql");
  out.push("");
  out.push("-- 1) Garante o schema (idempotente)");
  const schemaSql = fs
    .readFileSync(path.join(__dirname, "..", "db", "schema.postgres.sql"), "utf8")
    .trim();
  out.push(schemaSql);
  out.push("");

  for (const table of TABLES) {
    const { name, columns } = table;
    const [rows] = await pool.query(`SELECT ${columns.join(", ")} FROM ${name}`);
    out.push(`-- 2) Dados de ${name} (${rows.length} linha(s))`);
    if (rows.length === 0) {
      out.push(`-- (sem linhas em ${name})`);
    }
    for (const row of rows) {
      const values = columns.map((c) => sqlLiteral(row[c])).join(", ");
      out.push(
        `INSERT INTO ${name} (${columns.join(", ")}) VALUES (${values}) ON CONFLICT (id) DO NOTHING;`
      );
    }
    out.push(
      `SELECT setval(pg_get_serial_sequence('${name}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${name}), (SELECT COUNT(*) FROM ${name}) > 0);`
    );
    out.push("");
  }

  await pool.end();
  process.stdout.write(out.join("\n") + "\n");
}

main().catch((err) => {
  console.error("Erro ao exportar:", err);
  process.exit(1);
});
