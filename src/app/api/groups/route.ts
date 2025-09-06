/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { policy, user } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

type UiGroup = {
    id: string;
    name: string;
    description?: string | null;
    tokenLimit: number;
    updatedAt: string;      // สร้างให้ UI ใช้ได้เลย
    members: string[];      // user ids
};

export async function GET() {
    const groups = await db.select().from(policy);

    // ดึง mapping สมาชิกทั้งหมดครั้งเดียว
    const allUsers = await db
        .select({ id: user.id, policyId: user.policyId })
        .from(user);

    const mapMembers = new Map<string, string[]>();
    for (const g of groups) mapMembers.set(g.id, []);
    for (const u of allUsers) {
        if (u.policyId && mapMembers.has(u.policyId)) {
            mapMembers.get(u.policyId)!.push(u.id);
        }
    }

    const ui: UiGroup[] = groups.map(g => ({
        id: g.id,
        name: g.name,
        description: g.detail ?? null,
        tokenLimit: g.tokenLimit ?? 0,
        updatedAt: new Date().toISOString(),
        members: mapMembers.get(g.id) ?? [],
    }));

    return NextResponse.json({ ok: true, groups: ui });
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const name = String(body.name ?? "").trim();
    const description = body.description ? String(body.description) : null;
    const tokenLimit = Number.isFinite(body.tokenLimit) ? Number(body.tokenLimit) : 0;

    if (!name) {
        return NextResponse.json({ ok: false, error: "NAME_REQUIRED" }, { status: 400 });
    }

    const [g] = await db.insert(policy).values({
        name,
        detail: description,
        tokenLimit,
    }).returning();

    const ui: UiGroup = {
        id: g.id,
        name: g.name,
        description: g.detail ?? null,
        tokenLimit: g.tokenLimit ?? 0,
        updatedAt: new Date().toISOString(),
        members: [],
    };

    return NextResponse.json({ ok: true, group: ui }, { status: 201 });
}
