// Autenticación: registro, login, logout y sesión actual.
// Sesión = cookie HttpOnly con un token opaco guardado en la tabla `sessions`
// (se puede revocar borrando la fila; no es un JWT autocontenido).
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/react-start/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, sessions } from "@/db/schema";

const SESSION_COOKIE = "ca_session";
const SESSION_DAYS = 30;

async function createSessionForUser(userId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  await db.insert(sessions).values({ id: token, userId, expiresAt });
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export const registerUser = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string; name: string }) => d)
  .handler(async ({ data }): Promise<AuthUser> => {
    const email = data.email.trim().toLowerCase();
    const name = data.name.trim();
    if (!email || !email.includes("@")) throw new Error("Ingresa un correo válido.");
    if (!name) throw new Error("Ingresa tu nombre.");
    if (!data.password || data.password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres.");
    }
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) throw new Error("Ya existe una cuenta con ese correo.");

    const passwordHash = await bcrypt.hash(data.password, 10);
    const id = crypto.randomUUID();
    await db.insert(users).values({ id, email, passwordHash, name, createdAt: new Date().toISOString() });
    await createSessionForUser(id);
    return { id, email, name };
  });

export const loginUser = createServerFn({ method: "POST" })
  .validator((d: { email: string; password: string }) => d)
  .handler(async ({ data }): Promise<AuthUser> => {
    const email = data.email.trim().toLowerCase();
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = rows[0];
    if (!user) throw new Error("Correo o contraseña incorrectos.");
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) throw new Error("Correo o contraseña incorrectos.");
    await createSessionForUser(user.id);
    return { id: user.id, email: user.email, name: user.name };
  });

export const logoutUser = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (token) await db.delete(sessions).where(eq(sessions.id, token));
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

export const getCurrentUser = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthUser | null> => {
    const token = getCookie(SESSION_COOKIE);
    if (!token) return null;

    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.id, token))
      .limit(1);

    const row = rows[0];
    if (!row) return null;
    if (row.expiresAt < Date.now()) {
      await db.delete(sessions).where(eq(sessions.id, token));
      return null;
    }
    return { id: row.id, email: row.email, name: row.name };
  },
);

/** Para usar DENTRO de otras server functions: exige sesión válida o lanza error. */
export const requireUserId = createServerOnlyFn(async (): Promise<string> => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) throw new Error("No autenticado.");
  const rows = await db
    .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
    .from(sessions)
    .where(eq(sessions.id, token))
    .limit(1);
  const row = rows[0];
  if (!row || row.expiresAt < Date.now()) throw new Error("No autenticado.");
  return row.userId;
});
