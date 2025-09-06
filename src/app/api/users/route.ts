/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/app/api/users/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user, department, faculty, policy } from "@/lib/schema";
import { eq } from "drizzle-orm";

type UIUser = {
    id: string;
    fullName: string;
    email: string;
    major?: string;
    faculty?: string;
    year: number;
    active: boolean;
    studentId?: string;
};

function fullName(firstname?: string | null, lastname?: string | null) {
    const a = (firstname ?? "").trim();
    const b = (lastname ?? "").trim();
    return (a || b) ? [a, b].filter(Boolean).join(" ") : "";
}

export async function GET() {
    try {
        const rows = await db
            .select({
                id: user.id,
                email: user.email,
                firstname: user.firstname,
                lastname: user.lastname,
                active: user.is_active, // ✅ schema ใหม่
                policyId: user.policyId,
                deptName: department.name,
                facName: faculty.name,
            })
            .from(user)
            .leftJoin(department, eq(user.departmentId, department.id))
            .leftJoin(faculty, eq(department.facultyId, faculty.id));

        const usersUI: UIUser[] = rows.map((r) => ({
            id: r.id,
            fullName: fullName(r.firstname, r.lastname) || r.email,
            email: r.email,
            major: r.deptName ?? "",
            faculty: r.facName ?? "",
            year: 1,
            active: !!r.active,
            studentId: "",
        }));

        const domains = Array.from(
            new Set(
                usersUI
                    .map((u) => (u.email.toLowerCase().match(/@.+$/)?.[0] ?? "")) // "@domain"
                    .filter(Boolean),
            ),
        ).sort();

        return NextResponse.json({ ok: true, users: usersUI, domains });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const full = String(body.fullName ?? "").trim();
        const email = String(body.email ?? "").trim();
        const majorName = String(body.major ?? "").trim();
        const facultyName = String(body.faculty ?? "").trim();

        if (!full || !email) {
            return NextResponse.json(
                { ok: false, error: "FULLNAME_EMAIL_REQUIRED" },
                { status: 400 },
            );
        }

        const parts = full.split(/\s+/);
        const lastname = parts.length > 1 ? parts.pop()! : "";
        const firstname = parts.join(" ");

        // faculty / department (optional)
        let facRow: { id: string } | undefined;
        if (facultyName) {
            const fac = await db.select().from(faculty).where(eq(faculty.name, facultyName)).limit(1);
            facRow = fac[0];
            if (!facRow) {
                [facRow] = await db.insert(faculty).values({ name: facultyName, detail: "" }).returning();
            }
        }

        let deptRow: { id: string } | undefined;
        if (majorName) {
            const exist = await db.select().from(department).where(eq(department.name, majorName)).limit(1);
            let d = exist[0];
            if (!d) {
                // ถ้าไม่มี faculty ให้เปิด "General" ให้อัตโนมัติ
                if (!facRow) {
                    const [g] = await db.insert(faculty).values({ name: "General", detail: "" }).returning();
                    facRow = g;
                }
                [d] = await db.insert(department).values({
                    name: majorName,
                    detail: "",
                    facultyId: facRow!.id,
                }).returning();
            }
            deptRow = d;
        }

        const [created] = await db
            .insert(user)
            .values({
                email,
                firstname,
                lastname,
                is_active: true,       // ✅ schema ใหม่
                departmentId: deptRow?.id ?? null,
                policyId: null,
            })
            .returning();

        return NextResponse.json({
            ok: true,
            user: {
                id: created.id,
                fullName: full,
                email,
                major: majorName,
                faculty: facultyName,
                year: 1,
                active: true,
                studentId: "",
            } as UIUser,
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
    }
}
