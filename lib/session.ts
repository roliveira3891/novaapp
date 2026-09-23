import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "nova-dev-secret-change-me");

export const SESSION_COOKIE = "nova_session";

export interface SessionPayload {
  id: number;
  matricula: string;
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (typeof payload.id !== "number" || typeof payload.matricula !== "string") return null;
    return { id: payload.id, matricula: payload.matricula };
  } catch {
    return null;
  }
}
