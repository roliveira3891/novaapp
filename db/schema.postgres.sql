-- Schema PostgreSQL do NovaApp
-- Execute conectado ao banco "novaapp" (já existente). Não cria nem apaga
-- nenhum banco, e é seguro rodar mais de uma vez (idempotente).
--
-- Exemplo: psql "host=localhost dbname=novaapp user=iluminar_user" -f schema.postgres.sql

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

CREATE TABLE IF NOT EXISTS tecnicos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  regional VARCHAR(60) NOT NULL DEFAULT ''
);

ALTER TABLE tecnicos ADD COLUMN IF NOT EXISTS matricula VARCHAR(30) NOT NULL DEFAULT '';
ALTER TABLE atividades ADD COLUMN IF NOT EXISTS matricula_tecnico VARCHAR(30) NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS armarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  regional VARCHAR(60) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS tipos_atividade (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  regional VARCHAR(60) NOT NULL DEFAULT '',
  sigla CHAR(3) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(30) NOT NULL UNIQUE,
  nome VARCHAR(120) NOT NULL,
  regional VARCHAR(60) NOT NULL DEFAULT '',
  senha_hash VARCHAR(255) NOT NULL,
  avatar VARCHAR(20) NOT NULL DEFAULT 'a1',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Uniques equivalentes às "UNIQUE KEY" do MySQL.
-- Os blocos DO ignoram o erro se a constraint já existir (permite rodar de novo).
DO $$ BEGIN
  ALTER TABLE tecnicos ADD CONSTRAINT uniq_tecnico_regional UNIQUE (nome, regional);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE armarios ADD CONSTRAINT uniq_armario_regional UNIQUE (nome, regional);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tipos_atividade ADD CONSTRAINT uniq_tipo_atividade_regional UNIQUE (nome, regional);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE tipos_atividade ADD CONSTRAINT uniq_tipo_atividade_sigla UNIQUE (sigla, regional);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
