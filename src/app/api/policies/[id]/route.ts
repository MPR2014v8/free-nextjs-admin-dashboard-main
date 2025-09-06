/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { NextResponse } from "next/server";
// import { db } from "@/lib/db";
// import { policy, user } from "@/lib/schema";
// import { eq } from "drizzle-orm";

// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//     const body = await req.json().catch(() => ({}));
//     const patch: any = {};
//     if (typeof body.name === "string") patch.name = body.name.trim();
//     if (typeof body.description === "string") patch.detail = body.description;
//     if (Number.isFinite(body.tokenLimit)) patch.tokenLimit = Number(body.tokenLimit);

//     if (!Object.keys(patch).length)
//         return NextResponse.json({ ok: false, error: "NO_FIELDS" }, { status: 400 });

//     const [p] = await db.update(policy).set(patch).where(eq(policy.id, params.id)).returning();
//     if (!p) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

//     return NextResponse.json({ ok: true });
// }

// export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
//     await db.transaction(async (tx) => {
//         await tx.update(user).set({ policyId: null }).where(eq(user.policyId, params.id));
//         await tx.delete(policy).where(eq(policy.id, params.id));
//     });
//     return NextResponse.json({ ok: true });
// }

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policy, user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await req.json().catch(() => ({}));
        const tokenLimit = Number.isFinite(body.tokenLimit) ? Number(body.tokenLimit) : undefined;

        if (typeof tokenLimit !== "number")
            return NextResponse.json({ ok: false, error: "TOKEN_LIMIT_REQUIRED" }, { status: 400 });

        await db.update(policy).set({ tokenLimit }).where(eq(policy.id, id));

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        // ป้องกัน FK: ถอนผู้ใช้ที่อ้างถึงก่อน
        await db.update(user).set({ policyId: null }).where(eq(user.policyId, id));
        await db.delete(policy).where(eq(policy.id, id));

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
}
