/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/auth.ts
import { cookies } from "next/headers";

export type Role = "admin" | "staff" | "student";

export interface SessionData {
  userId: string;
  role: Role;
  fullName: string;
  email: string;
}

const SESSION_COOKIE = "prism_session";

/** รองรับทั้งกรณี cookies() เป็น sync หรือ async */
async function getCookieStore() {
  return (await (cookies() as any)) as Awaited<ReturnType<typeof cookies>>;
}

export async function readSession(): Promise<SessionData | null> {
  const store = await getCookieStore();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function writeSession(
  data: SessionData,
  maxAgeSeconds = 60 * 60 * 24 * 7,
) {
  const store = await getCookieStore();
  store.set(SESSION_COOKIE, JSON.stringify(data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearSession() {
  const store = await getCookieStore();
  store.delete(SESSION_COOKIE);
}
