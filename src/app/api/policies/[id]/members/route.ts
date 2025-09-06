/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-unused-vars */
// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { user } from "@/lib/schema";
// import { inArray } from "drizzle-orm";

// export async function POST(req: Request, { params }: { params: { id: string } }) {
//     const body = await req.json().catch(() => ({}));
//     const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];
//     if (!userIds.length) return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });

//     await db.update(user).set({ policyId: params.id }).where(inArray(user.id, userIds));
//     return NextResponse.json({ ok: true, added: userIds.length });
// }

// export async function DELETE(req: Request, { params }: { params: { id: string } }) {
//     const body = await req.json().catch(() => ({}));
//     const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];
//     if (!userIds.length) return NextResponse.json({ ok: false, error: "EMPTY" }, { status: 400 });

//     await db.update(user).set({ policyId: null }).where(inArray(user.id, userIds));
//     return NextResponse.json({ ok: true, removed: userIds.length });
// }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const policyId = params.id;
        const body = await req.json().catch(() => ({}));
        const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];

        if (!userIds.length) return NextResponse.json({ ok: true, updated: 0 });

        await db.update(user).set({ policyId }).where(inArray(user.id, userIds));
        return NextResponse.json({ ok: true, updated: userIds.length });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const policyId = params.id;
        const body = await req.json().catch(() => ({}));
        const userIds: string[] = Array.isArray(body.userIds) ? body.userIds : [];

        if (!userIds.length) return NextResponse.json({ ok: true, updated: 0 });

        await db
            .update(user)
            .set({ policyId: null })
            .where(and(inArray(user.id, userIds), eq(user.policyId, policyId)));

        return NextResponse.json({ ok: true, updated: userIds.length });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
}
