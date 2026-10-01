import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { findUserByEmail } from "@/lib/db/users";

export type Role = "SUPERADMIN" | "EMPRESA" | "NUTRICIONISTA";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

const COOKIE = "pap_session";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Falta AUTH_SECRET");
  return new TextEncoder().encode(value);
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function readSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id:    String(payload.id),
      email: String(payload.email),
      name:  String(payload.name),
      role:  payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await readSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function loginWithPassword(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user || !user.active) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  const session: SessionUser = {
    id:    user.id,
    email: user.email,
    name:  user.name,
    role:  user.role,
  };
  await createSession(session);
  return session;
}

export function canSeeAllPatients(role: Role) {
  return role === "SUPERADMIN" || role === "EMPRESA";
}

export function isSuperadmin(role: Role) {
  return role === "SUPERADMIN";
}
