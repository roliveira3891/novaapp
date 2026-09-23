import bcrypt from "bcryptjs";

export function hashPassword(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export function verifyPassword(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}
