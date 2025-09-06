/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        const [row] = await db.select({ is_active: user.is_active }).from(user).where(eq(user.id, id)).limit(1);
        if (!row) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

        await db.update(user).set({ is_active: !row.is_active }).where(eq(user.id, id));
        return NextResponse.json({ ok: true, active: !row.is_active });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
}
