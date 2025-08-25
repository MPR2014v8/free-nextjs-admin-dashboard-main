// /* eslint-disable @typescript-eslint/no-unused-vars */
// // src/app/api/login/route.ts
// import { NextResponse } from "next/server";
// import { useDB } from "@/lib/mockDb";
// import { writeSessionCookie } from "@/lib/auth";

// export async function POST(request: Request) {
//     try {
//         const { email, password } = await request.json();
//         if (!email || !password) {
//             return NextResponse.json({ error: "Missing email/password" }, { status: 400 });
//         }

//         const db = useDB.getState();
//         const user = db.findUserByEmail(email);
//         if (!user || !db.verifyUserPassword(user, password)) {
//             return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
//         }
//         if (!user.active) {
//             return NextResponse.json({ error: "User is inactive" }, { status: 403 });
//         }

//         const res = NextResponse.json({ user: db.toPublicUser(user), ok: true });
//         writeSessionCookie(res, { userId: user.id });

//         return res;
//     } catch (e) {
//         return NextResponse.json({ error: "Bad request" }, { status: 400 });
//     }
// }
