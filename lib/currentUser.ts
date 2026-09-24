import { cookies } from "next/headers";
import { ensureSchema, getPool } from "./db";
import type { RowDataPacket } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { User } from "./types";
import { isAdminMatricula } from "./admin";

export async function getCurrentUser(): Promise<User | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifySessionToken(token);
  if (!session) return null;

  await ensureSchema();
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, matricula, nome, regional, avatar FROM usuarios WHERE id = ?",
    [session.id]
  );
  const row = rows[0] as User | undefined;
  return row ? { ...row, isAdmin: isAdminMatricula(row.matricula) } : null;
}
