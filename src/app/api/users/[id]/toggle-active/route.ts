import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
    const [row] = await db.select({ status: user.status }).from(user).where(eq(user.id, params.id));
    if (!row) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    await db.update(user).set({ status: !row.status }).where(eq(user.id, params.id));
    return NextResponse.json({ ok: true, active: !row.status });
}
