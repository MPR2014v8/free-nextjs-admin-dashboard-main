/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policy, user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = await req.json().catch(() => ({}));
    const patch: any = {};
    if (typeof body.name === "string") patch.name = body.name.trim();
    if (typeof body.description === "string") patch.detail = body.description;
    if (Number.isFinite(body.tokenLimit)) patch.tokenLimit = Number(body.tokenLimit);

    if (!Object.keys(patch).length)
        return NextResponse.json({ ok: false, error: "NO_FIELDS" }, { status: 400 });

    const [p] = await db.update(policy).set(patch).where(eq(policy.id, params.id)).returning();
    if (!p) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    await db.transaction(async (tx) => {
        await tx.update(user).set({ policyId: null }).where(eq(user.policyId, params.id));
        await tx.delete(policy).where(eq(policy.id, params.id));
    });
    return NextResponse.json({ ok: true });
}
