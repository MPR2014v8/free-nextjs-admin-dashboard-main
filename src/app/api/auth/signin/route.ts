/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/api/auth/signin/route.ts
import { NextResponse } from "next/server";
import { writeSession } from "@/lib/auth";

/** DEMO credentials แบบง่าย */
const DEMO_USERS = {
    "admin@udru.ac.th": {
        password: "admin123",
        role: "admin" as const,
        userId: "u_admin",
        fullName: "ผู้ดูแลหลัก",
    },
    // เพิ่มได้ตามต้องการ
    // "staff@udru.ac.th": { password: "staff123", role: "staff", userId: "u_staff", fullName: "Staff" },
};

export async function POST(req: Request) {
    const { email, password } = await req.json().catch(() => ({}));
    const key = String(email || "").toLowerCase().trim();
    const user = (DEMO_USERS as any)[key];

    if (!user || user.password !== password) {
        return NextResponse.json({ ok: false, error: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    await writeSession({
        userId: user.userId,
        role: user.role,
        fullName: user.fullName,
        email: key,
    });

    return NextResponse.json({ ok: true });
}
