import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";
import { clusterExists, normalizeCluster } from "@/lib/clusters";
import { REGIONAIS } from "@/lib/regionais";

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await req.json();
  const fields: string[] = [];
  const values: any[] = [];

  if (typeof body.nome === "string" && body.nome.trim()) {
    fields.push("nome = ?");
    values.push(body.nome.trim());
  }
  let regional = user.regional;
  if (typeof body.regional === "string" && body.regional.trim()) {
    regional = body.regional.trim();
    if (!(REGIONAIS as readonly string[]).includes(regional)) {
      return NextResponse.json({ error: "Regional inválida." }, { status: 400 });
    }
    fields.push("regional = ?");
    values.push(regional);
  }
  // O cluster pertence a uma regional: trocando de regional sem escolher outro cluster, ele é zerado.
  if (typeof body.cluster === "string" || regional !== user.regional) {
    const cluster = typeof body.cluster === "string" ? normalizeCluster(body.cluster) : "";
    if (!(await clusterExists(regional, cluster))) {
      return NextResponse.json({ error: "Cluster não encontrado nesta regional." }, { status: 400 });
    }
    fields.push("cluster = ?");
    values.push(cluster);
  }
  if (typeof body.avatar === "string" && body.avatar.trim()) {
    fields.push("avatar = ?");
    values.push(body.avatar.trim());
  }

  if (fields.length === 0) {
    return NextResponse.json(user);
  }

  const pool = getPool();
  values.push(user.id);
  await pool.query(`UPDATE usuarios SET ${fields.join(", ")} WHERE id = ?`, values);

  const updated = await getCurrentUser();
  return NextResponse.json(updated);
}
