// Matrículas com acesso à relação de usuários (troca de senha/edição de cadastro).
// Provisório, enquanto não existe "esqueci minha senha" por e-mail.
export const ADMIN_MATRICULAS = ["g0047861", "3503828", "154492"];

export function isAdminMatricula(matricula: string): boolean {
  return ADMIN_MATRICULAS.includes(matricula.trim().toLowerCase());
}
