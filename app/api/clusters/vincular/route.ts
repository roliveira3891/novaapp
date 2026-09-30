import { NextRequest, NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

function ids(v: unknown): number[] {
  return Array.isArray(v) ? v.map(Number).filter((n) => Number.isInteger(n) && n > 0) : [];
}

// Vincula ao cluster do usuário os registros da regional que ainda estão sem cluster.
// O "AND cluster = ''" garante que ninguém tome registros que outro usuário já vinculou.
export async function POST(req: NextRequest) {
  await ensureSchema();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!user.cluster) {
    return NextResponse.json({ error: "Escolha seu cluster antes de vincular registros." }, { status: 400 });
  }

  const body = await req.json();
  const pool = getPool();
  const counts = { tecnicos: 0, armarios: 0, tipos: 0, atividades: 0 };

  const link = async (table: string, list: number[]) => {
    if (list.length === 0) return 0;
    const [res] = await pool.query(
      `UPDATE ${table} SET cluster = ? WHERE regional = ? AND cluster = '' AND id IN (${list.map(() => "?").join(",")})`,
      [user.cluster, user.regional, ...list]
    );
    return Number((res as any).affectedRows || 0);
  };

  const armarioIds = ids(body.armarios);
  counts.tecnicos = await link("tecnicos", ids(body.tecnicos));
  counts.armarios = await link("armarios", armarioIds);
  counts.tipos = await link("tipos_atividade", ids(body.tipos));

  // As atividades acompanham o armário: ao vincular um armário, as atividades dele (ainda sem cluster) vão junto.
  if (armarioIds.length > 0) {
    const [res] = await pool.query(
      `UPDATE atividades SET cluster = ? WHERE regional = ? AND cluster = ''
       AND nome_armario IN (SELECT nome FROM armarios WHERE regional = ? AND cluster = ? AND id IN (${armarioIds
         .map(() => "?")
         .join(",")}))`,
      [user.cluster, user.regional, user.regional, user.cluster, ...armarioIds]
    );
    counts.atividades += Number((res as any).affectedRows || 0);
  }
  counts.atividades += await link("atividades", ids(body.atividades));

  return NextResponse.json({ ok: true, ...counts });
}
