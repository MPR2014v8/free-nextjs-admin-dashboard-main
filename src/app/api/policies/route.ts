/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policy, user } from "@/lib/schema";
import { eq } from "drizzle-orm";

type UIPolicy = {
    id: string;
    name: string;
    description?: string | null;
    tokenLimit: number;
    updatedAt: string;
    members: string[];
};

export async function GET() {
    const policies = await db.select().from(policy);
    const users = await db.select({ id: user.id, policyId: user.policyId }).from(user);

    const memberMap = new Map<string, string[]>();
    for (const p of policies) memberMap.set(p.id, []);
    for (const u of users) if (u.policyId) memberMap.get(u.policyId)?.push(u.id);

    const ui: UIPolicy[] = policies.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.detail ?? null,
        tokenLimit: p.tokenLimit ?? 0,
        updatedAt: new Date().toISOString(),
        members: memberMap.get(p.id) ?? [],
    }));

    return NextResponse.json({ ok: true, policies: ui });
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const description = body.description ? String(body.description) : null;
    const tokenLimit = Number.isFinite(body.tokenLimit) ? Number(body.tokenLimit) : 0;

    if (!name) return NextResponse.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });

    const [p] = await db.insert(policy).values({
        name,
        detail: description,
        tokenLimit,
    }).returning();

    const ui: UIPolicy = {
        id: p.id,
        name: p.name,
        description: p.detail ?? null,
        tokenLimit: p.tokenLimit ?? 0,
        updatedAt: new Date().toISOString(),
        members: [],
    };

    return NextResponse.json({ ok: true, policy: ui }, { status: 201 });
}
