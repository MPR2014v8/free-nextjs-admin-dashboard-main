import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ban } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
    await db.delete(ban).where(eq(ban.id, params.id));
    return NextResponse.json({ ok: true });
}
