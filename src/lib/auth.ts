/* src/lib/auth.ts */
import { cookies } from "next/headers";

export type SessionRole = "admin" | "staff" | "student";
export type SessionData = {
  userId: string;
  role: SessionRole;
  fullName: string;
  email: string;
};

const SESSION_COOKIE = "pa_session";

/** อ่าน session จาก cookie (ต้อง await cookies() บน Next.js 15) */
export async function readSession(): Promise<SessionData | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

/** เขียน session ลง cookie */
export async function writeSession(data: SessionData): Promise<void> {
  const jar = await cookies();
  jar.set({
    name: SESSION_COOKIE,
    value: JSON.stringify(data),
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  });
}

/** ลบ session ออกจาก cookie */
export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}
