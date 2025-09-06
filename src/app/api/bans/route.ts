import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ban } from "@/lib/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(ban).orderBy(desc(ban.startAt));
  return NextResponse.json({ ok: true, bans: rows });
}
