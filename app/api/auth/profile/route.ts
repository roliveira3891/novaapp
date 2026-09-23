import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/currentUser";

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
  if (typeof body.regional === "string" && body.regional.trim()) {
    fields.push("regional = ?");
    values.push(body.regional.trim());
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
