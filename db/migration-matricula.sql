-- Matrícula do técnico + vínculo das atividades por matrícula (versão mobile).
-- PostgreSQL. Idempotente: pode rodar mais de uma vez.
-- (O app também aplica isto sozinho no primeiro acesso via ensureSchema.)
--
-- Exemplo: psql "host=localhost dbname=novaapp user=iluminar_user" -f migration-matricula.sql

ALTER TABLE tecnicos   ADD COLUMN IF NOT EXISTS matricula VARCHAR(30) NOT NULL DEFAULT '';
ALTER TABLE atividades ADD COLUMN IF NOT EXISTS matricula_tecnico VARCHAR(30) NOT NULL DEFAULT '';

-- Atividades antigas herdam a matrícula do técnico com o mesmo nome/regional
-- (só faz efeito depois que os técnicos tiverem matrícula preenchida).
UPDATE atividades SET matricula_tecnico = COALESCE((
  SELECT t.matricula FROM tecnicos t
  WHERE t.nome = atividades.nome_tecnico AND t.regional = atividades.regional AND t.matricula <> ''
  LIMIT 1
), '')
WHERE matricula_tecnico = '' AND nome_tecnico <> '';

/* Equivalente MySQL/MariaDB (se DB_DRIVER=mysql):

ALTER TABLE tecnicos   ADD COLUMN IF NOT EXISTS matricula VARCHAR(30) NOT NULL DEFAULT '';
ALTER TABLE atividades ADD COLUMN IF NOT EXISTS matricula_tecnico VARCHAR(30) NOT NULL DEFAULT '';
-- e o mesmo UPDATE acima.
*/
