export const runtime = "edge";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ban } from "@/lib/schema";
import { inArray } from "drizzle-orm";

const toUI = (b: typeof ban.$inferSelect) => ({
  id: b.id,
  userId: b.userId,
  groupId: b.groupId ?? null,
  reason: b.reason ?? null,
  startAt: (b.startAt as Date).toISOString?.() ?? String(b.startAt),
  endAt: b.endAt ? ((b.endAt as Date).toISOString?.() ?? String(b.endAt)) : null,
});

export async function GET() {
  try {
    const rows = await db.select().from(ban);
    return NextResponse.json(rows.map(toUI));
  } catch (e) {
    console.error("GET /api/bans failed:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}

// สร้างแบนแบบหลาย user
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const ids: string[] = Array.isArray(b.userIds) ? b.userIds : [];
    if (!ids.length) {
      return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
    }
    const payload = ids.map((uid) => ({
      userId: uid,
      groupId: b.groupId ?? null,
      reason: b.reason ?? null,
      endAt: b.endAt ? new Date(b.endAt) : null,
    }));
    const rows = await db.insert(ban).values(payload).returning();
    return NextResponse.json(rows.map(toUI), { status: 201 });
  } catch (e) {
    console.error("POST /api/bans failed:", e);
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
}

// ลบแบน 1 รายการผ่าน query ?id= หรือหลายรายการผ่าน body.ids
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (id) {
      await db.delete(ban).where(inArray(ban.id, [id]));
      return NextResponse.json({ ok: true });
    }
    const b = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(b.ids) ? b.ids : [];
    if (!ids.length) {
      return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
    }
    await db.delete(ban).where(inArray(ban.id, ids));
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/bans failed:", e);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
