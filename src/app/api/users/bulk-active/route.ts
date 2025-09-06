import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { inArray } from "drizzle-orm";

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    const active: boolean = !!body.active;

    if (!ids.length) return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });

    await db.update(user).set({ is_active: active }).where(inArray(user.id, ids));
    return NextResponse.json({ ok: true, updated: ids.length, active });
}
