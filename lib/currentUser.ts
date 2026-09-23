import { cookies } from "next/headers";
import { ensureSchema, getPool } from "./db";
import type { RowDataPacket } from "./db";
import { SESSION_COOKIE, verifySessionToken } from "./session";
import type { User } from "./types";

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
  return (rows[0] as User) || null;
}
