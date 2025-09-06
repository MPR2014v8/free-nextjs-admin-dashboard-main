/* eslint-disable @typescript-eslint/no-explicit-any */
// /* eslint-disable @typescript-eslint/no-explicit-any */
// "use client";
// import * as React from "react";

// export type UIUser = {
//     id: string;
//     fullName: string;
//     email: string;
//     major?: string;
//     faculty?: string;
//     year: number;
//     active: boolean;
//     studentId?: string;
//     groups: string[]; // policy ids
// };

// export type UIGroup = { id: string; name: string };

// export type UIBan = {
//     id: string;
//     userId: string;
//     groupId: string | null;
//     reason: string | null;
//     startAt: string;           // ISO string
//     endAt: string | null;      // ISO string or null
// };

// async function j<T>(r: Response): Promise<T> {
//     if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`));
//     return r.json() as any;
// }

// export function useDB() {
//     const [users, setUsers] = React.useState<UIUser[]>([]);
//     const [groups, setGroups] = React.useState<UIGroup[]>([]);
//     const [bans, setBans] = React.useState<UIBan[]>([]);

//     const refresh = React.useCallback(async () => {
//         // /api/users คืน users + domains + groups(policies)
//         const uRes = await fetch("/api/users", { cache: "no-store" });
//         const uJson = await j<{ ok: true; users: UIUser[]; groups: UIGroup[] }>(uRes);
//         setUsers(uJson.users);
//         setGroups(uJson.groups);

//         const bRes = await fetch("/api/bans", { cache: "no-store" });
//         const bJson = await j<{ ok: true; bans: any[] }>(bRes);
//         // map date -> string
//         setBans(
//             bJson.bans.map((b) => ({
//                 ...b,
//                 startAt: new Date(b.startAt).toISOString(),
//                 endAt: b.endAt ? new Date(b.endAt).toISOString() : null,
//             })),
//         );
//     }, []);

//     React.useEffect(() => {
//         refresh().catch(console.error);
//     }, [refresh]);

//     // ---- actions for BanManager ----
//     const banMany = React.useCallback(
//         async (
//             userIds: string[],
//             opts: { groupId?: string; reason?: string; endAt?: string },
//         ) => {
//             const res = await fetch("/api/bans/bulk", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                     userIds,
//                     groupId: opts.groupId ?? null,
//                     reason: opts.reason ?? null,
//                     endAt: opts.endAt ?? null,
//                 }),
//             });
//             const { created } = await j<{ ok: true; created: any[] }>(res);
//             setBans((s) => [
//                 ...created.map((b) => ({
//                     ...b,
//                     startAt: new Date(b.startAt).toISOString(),
//                     endAt: b.endAt ? new Date(b.endAt).toISOString() : null,
//                 })),
//                 ...s,
//             ]);
//         },
//         [],
//     );

//     const unban = React.useCallback(async (id: string) => {
//         await j(await fetch(`/api/bans/${id}`, { method: "DELETE" }));
//         setBans((s) => s.filter((b) => b.id !== id));
//     }, []);

//     const unbanMany = React.useCallback(async (ids: string[]) => {
//         if (!ids.length) return;
//         await j(
//             await fetch("/api/bans/bulk-unban", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ ids }),
//             }),
//         );
//         setBans((s) => s.filter((b) => !ids.includes(b.id)));
//     }, []);

//     return { users, groups, bans, banMany, unban, unbanMany };
// }

// src/lib/adminDb.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";

/** ---------- UI types ---------- */
export type UIGroup = { id: string; name: string };

export type UIUser = {
    id: string;
    fullName: string;
    email: string;
    year: number;
    active: boolean;
    studentId?: string;
    major?: string;
    faculty?: string;
    /** กลุ่มของผู้ใช้ = policy ids (ปกติ 0 หรือ 1 ค่า) */
    groups: string[];
};

export type UIBan = {
    id: string;
    userId: string;
    groupId: string | null;
    reason: string | null;
    startAt: string;        // ISO
    endAt: string | null;   // ISO | null
};

/** ---------- helper ---------- */
async function j<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(msg);
    }
    return res.json() as any;
}

const normalizeUser = (u: any): UIUser => ({
    id: String(u?.id ?? ""),
    fullName: String(u?.fullName ?? ""),
    email: String(u?.email ?? ""),
    year: Number.isFinite(u?.year) ? Number(u.year) : 1,
    active: Boolean(u?.active),
    studentId: u?.studentId ?? "",
    major: u?.major ?? "",
    faculty: u?.faculty ?? "",
    groups: Array.isArray(u?.groups) ? (u.groups as string[]) : [], // สำคัญ!
});

const normalizeGroup = (g: any): UIGroup => ({
    id: String(g?.id ?? ""),
    name: String(g?.name ?? ""),
});

const normalizeBan = (b: any): UIBan => ({
    id: String(b?.id ?? ""),
    userId: String(b?.userId ?? ""),
    groupId: b?.groupId ?? null,
    reason: b?.reason ?? null,
    startAt: new Date(b?.startAt ?? Date.now()).toISOString(),
    endAt: b?.endAt ? new Date(b.endAt).toISOString() : null,
});

/** ---------- main hook ---------- */
export function useDB() {
    const [users, setUsers] = React.useState<UIUser[]>([]);
    const [groups, setGroups] = React.useState<UIGroup[]>([]);
    const [bans, setBans] = React.useState<UIBan[]>([]);

    const refresh = React.useCallback(async () => {
        const [uRes, pRes, bRes] = await Promise.allSettled([
            fetch("/api/users", { cache: "no-store" }),
            fetch("/api/policies", { cache: "no-store" }),
            fetch("/api/bans", { cache: "no-store" }),
        ]);

        // users (+groups จาก /api/users เผื่อไว้)
        if (uRes.status === "fulfilled") {
            const u = await j<{ ok: true; users: any[]; groups?: any[] }>(uRes.value);
            setUsers(Array.isArray(u.users) ? u.users.map(normalizeUser) : []);
            // ถ้ามี groups กลับมาด้วยก็เติมชื่อกลุ่มไว้ก่อน (จะถูก override ด้วย /api/policies ทันทีด้านล่าง)
            if (Array.isArray(u.groups) && u.groups.length) {
                setGroups(u.groups.map(normalizeGroup));
            }
        } else {
            console.error("users fetch failed:", uRes.reason);
            setUsers([]);
        }

        // policies => groups
        if (pRes.status === "fulfilled") {
            const p = await j<{ ok: true; policies: any[] }>(pRes.value);
            setGroups(Array.isArray(p.policies) ? p.policies.map(normalizeGroup) : []);
        } else {
            console.error("policies fetch failed:", pRes.reason);
        }

        // bans
        if (bRes.status === "fulfilled") {
            const b = await j<{ ok: true; bans: any[] }>(bRes.value);
            setBans(Array.isArray(b.bans) ? b.bans.map(normalizeBan) : []);
        } else {
            console.error("bans fetch failed:", bRes.reason);
            setBans([]);
        }
    }, []);

    React.useEffect(() => {
        void refresh();
    }, [refresh]);

    /* ---------- actions: bans ---------- */

    // bulk create bans
    const banMany = React.useCallback(
        async (
            userIds: string[],
            payload: { groupId?: string; reason?: string; endAt?: string },
        ) => {
            if (!userIds.length) return;
            const res = await fetch("/api/bans/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds,
                    groupId: payload.groupId ?? null,
                    reason: payload.reason ?? null,
                    endAt: payload.endAt ?? null,
                }),
            });
            // ถ้า API ส่งรายการที่สร้างกลับมา จะอัพเดทแบบเพิ่ม; ถ้าไม่ ก็ refresh
            const data = await j<{ ok: true; created?: any[] }>(res).catch(() => ({ ok: true, created: undefined } as any));
            if (Array.isArray((data as any).created)) {
                const created = (data as any).created.map(normalizeBan);
                setBans((s) => [...created, ...(Array.isArray(s) ? s : [])]);
            } else {
                await refresh();
            }
        },
        [refresh],
    );

    const unban = React.useCallback(async (id: string) => {
        await j(await fetch(`/api/bans/${encodeURIComponent(id)}`, { method: "DELETE" }));
        setBans((s) => (Array.isArray(s) ? s.filter((b) => b.id !== id) : []));
    }, []);

    const unbanMany = React.useCallback(async (ids: string[]) => {
        if (!ids.length) return;
        await j(
            await fetch("/api/bans/bulk-unban", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            }),
        );
        setBans((s) => (Array.isArray(s) ? s.filter((b) => !ids.includes(b.id)) : []));
    }, []);

    /* ---------- exports ---------- */
    return {
        users,
        groups,
        bans,
        refresh,
        banMany,
        unban,
        unbanMany,
    };
}
