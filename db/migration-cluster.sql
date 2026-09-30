-- Cluster (subdivisão da regional) vinculado a usuários, cadastros e atividades.
-- PostgreSQL. Idempotente. (O app também aplica isto sozinho via ensureSchema.)
-- Registros existentes ficam com cluster '' e são vinculados pelos próprios usuários no app.
--
-- Exemplo: psql "host=localhost dbname=novaapp user=iluminar_user" -f migration-cluster.sql

CREATE TABLE IF NOT EXISTS clusters (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(80) NOT NULL,
  regional VARCHAR(60) NOT NULL,
  CONSTRAINT uniq_cluster_regional UNIQUE (nome, regional)
);

ALTER TABLE usuarios        ADD COLUMN IF NOT EXISTS cluster VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE atividades      ADD COLUMN IF NOT EXISTS cluster VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE tecnicos        ADD COLUMN IF NOT EXISTS cluster VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE armarios        ADD COLUMN IF NOT EXISTS cluster VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE tipos_atividade ADD COLUMN IF NOT EXISTS cluster VARCHAR(80) NOT NULL DEFAULT '';
