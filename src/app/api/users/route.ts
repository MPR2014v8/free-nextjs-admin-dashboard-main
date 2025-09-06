/* eslint-disable prefer-const */
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
    year: number;           // UI ใช้ — ไม่มีใน schema: ใส่ค่า default 1
    active: boolean;
    studentId?: string;     // UI ใช้ — ไม่มีใน schema
    groups: string[];       // policyId -> [policyId] หรือ []
};

function fullName(firstname?: string | null, lastname?: string | null) {
    const a = (firstname ?? "").trim();
    const b = (lastname ?? "").trim();
    return (a || b) ? [a, b].filter(Boolean).join(" ") : "";
}

export async function GET() {
    const rows = await db
        .select({
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            active: user.status,
            policyId: user.policyId,
            deptName: department.name,
            facName: faculty.name,
        })
        .from(user)
        .leftJoin(department, eq(user.departmentId, department.id))
        .leftJoin(faculty, eq(department.facultyId, faculty.id));

    const users: UIUser[] = rows.map((r) => ({
        id: r.id,
        fullName: fullName(r.firstname, r.lastname) || r.email,
        email: r.email,
        major: r.deptName ?? "",
        faculty: r.facName ?? "",
        year: 1,                 // ไม่มีใน schema → ใส่ default
        active: !!r.active,
        studentId: "",           // ไม่มีใน schema
        groups: r.policyId ? [r.policyId] : [],
    }));

    // สร้างโดเมนลิสต์สำหรับตัวกรอง
    const domains = Array.from(
        new Set(
            users
                .map((u) => (u.email.toLowerCase().match(/@.+$/)?.[0] ?? ""))
                .filter(Boolean),
        ),
    );

    // ส่งรายชื่อ policies ให้ filter (Group = Policy)
    const policies = await db.select({ id: policy.id, name: policy.name }).from(policy);

    return NextResponse.json({
        ok: true,
        users,
        domains,
        groups: policies, // [{id,name}]
    });
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}));
    const fullName: string = (body.fullName ?? "").trim();
    const email: string = (body.email ?? "").trim();
    const majorName: string = (body.major ?? "").trim();
    const facultyName: string = (body.faculty ?? "").trim();
    // body.studentId, body.year มีใน UI แต่ไม่มีใน schema → ไม่บันทึก

    if (!fullName || !email) {
        return NextResponse.json(
            { ok: false, error: "FULLNAME_EMAIL_REQUIRED" },
            { status: 400 },
        );
    }

    // split ชื่อ: คำท้ายเป็นนามสกุล ที่เหลือเป็นชื่อ (ง่าย ๆ)
    const parts = fullName.split(/\s+/);
    const lastname = parts.length > 1 ? parts.pop()! : "";
    const firstname = parts.join(" ");

    // หา/สร้าง Faculty + Department ให้ตรงกับชื่อ
    let fac = await db.select().from(faculty).where(eq(faculty.name, facultyName)).limit(1);
    let facRow = fac[0];
    if (!facRow && facultyName) {
        [facRow] = await db.insert(faculty).values({
            name: facultyName,
            detail: "",
        }).returning();
    }

    let deptRow: { id: string } | undefined;
    if (majorName) {
        const exist = await db
            .select()
            .from(department)
            .where(eq(department.name, majorName))
            .limit(1);
        let d = exist[0];
        if (!d) {
            [d] = await db.insert(department).values({
                name: majorName,
                detail: "",
                facultyId: facRow?.id ?? crypto.randomUUID(), // กันพลาด (แม้ไม่มี faculty)
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
            status: true,
            departmentId: deptRow?.id ?? null,
            policyId: null,
        })
        .returning();

    return NextResponse.json({
        ok: true,
        user: {
            id: created.id,
            fullName,
            email,
            major: majorName,
            faculty: facultyName,
            year: 1,
            active: true,
            studentId: "",
            groups: [],
        } as UIUser,
    });
}
