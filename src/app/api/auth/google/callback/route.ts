export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAuth2Client } from "google-auth-library";
import { writeSession } from "@/lib/auth";

const STATE_COOKIE = "g_oauth_state";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const returnedState = url.searchParams.get("state");

    // ดึง state เดิมจาก cookie
    const raw = cookies().get(STATE_COOKIE)?.value;
    if (!raw) {
        return NextResponse.redirect(new URL("/login?error=state_missing", url.origin));
    }

    let parsed: { nonce: string; next?: string } | null = null;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return NextResponse.redirect(new URL("/login?error=state_invalid", url.origin));
    }

    // ลบ cookie state ทิ้งทันที (one-time use)
    cookies().delete(STATE_COOKIE);

    // ตรวจ nonce (state)
    if (!code || !returnedState || returnedState !== parsed.nonce) {
        return NextResponse.redirect(new URL("/login?error=state_mismatch", url.origin));
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI!;
    if (!clientId || !clientSecret || !redirectUri) {
        return NextResponse.redirect(new URL("/login?error=env_missing", url.origin));
    }

    try {
        const oauth2client = new OAuth2Client({ clientId, clientSecret, redirectUri });

        // แลก code เป็น token
        const { tokens } = await oauth2client.getToken(code);

        // ตรวจสอบ/ถอดข้อมูลจาก id_token
        const ticket = await oauth2client.verifyIdToken({
            idToken: tokens.id_token!,
            audience: clientId,
        });
        const payload = ticket.getPayload();

        const email = payload?.email ?? "";
        const name = payload?.name ?? "";
        const sub = payload?.sub ?? ""; // Google user id

        if (!email || !sub) {
            return NextResponse.redirect(new URL("/login?error=no_email", url.origin));
        }

        // กำหนด role: ถ้า email อยู่ใน whitelist → admin, ไม่งั้น user
        const adminList = (process.env.GOOGLE_ADMIN_EMAILS || "")
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

        const role: "admin" | "user" = adminList.includes(email.toLowerCase()) ? "admin" : "user";

        // เขียน session ด้วยของระบบเดิม (จะตั้งคุกกี้ prism_session ให้)
        await writeSession({
            userId: `google_${sub}`,
            role,
            fullName: name || email,
            email,
        });

        const next = parsed.next || "/";
        return NextResponse.redirect(new URL(next, url.origin));
    } catch (err) {
        console.error("Google OAuth callback error:", err);
        return NextResponse.redirect(new URL("/login?error=oauth_fail", url.origin));
    }
}
