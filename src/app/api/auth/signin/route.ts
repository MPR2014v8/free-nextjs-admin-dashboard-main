/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { writeSession } from "@/lib/auth";

/** DEMO credentials */
const DEMO_USERS = {
    "admin@udru.ac.th": {
        password: "admin123",
        role: "admin" as const,
        userId: "u_admin",
        fullName: "ผู้ดูแลหลัก",
    },
};

async function readCredentials(req: Request): Promise<{ email: string; password: string }> {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
        const b = await req.json().catch(() => ({}));
        return { email: String(b.email ?? ""), password: String(b.password ?? "") };
    }
    if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
        const fd = await req.formData();
        return { email: String(fd.get("email") ?? ""), password: String(fd.get("password") ?? "") };
    }
    try {
        const b = await req.json();
        return { email: String((b as any).email ?? ""), password: String((b as any).password ?? "") };
    } catch {
        return { email: "", password: "" };
    }
}

export async function POST(req: Request) {
    const { email, password } = await readCredentials(req);

    const key = email.toLowerCase().trim();
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
