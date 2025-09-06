/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policy, user } from "@/lib/schema";
import { inArray, eq } from "drizzle-orm";

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });

    await db.transaction(async (tx) => {
        await tx.update(user).set({ policyId: null }).where(inArray(user.policyId, ids));
        await tx.delete(policy).where(inArray(policy.id, ids));
    });

    return NextResponse.json({ ok: true, deleted: ids.length });
}
