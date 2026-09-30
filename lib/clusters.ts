import { getPool } from "./db";
import type { RowDataPacket } from "./db";

export function normalizeCluster(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().replace(/\s+/g, " ").toUpperCase().slice(0, 80) : "";
}

export async function clusterExists(regional: string, cluster: string): Promise<boolean> {
  if (!cluster) return true; // "sem cluster" é sempre válido
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT id FROM clusters WHERE regional = ? AND nome = ? LIMIT 1",
    [regional, cluster]
  );
  return rows.length > 0;
}
