// src/lib/policyDb.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";

/** ---------- UI types ---------- */
export type UIPolicy = {
    id: string;
    name: string;
    description?: string | null;
    tokenLimit: number;
    updatedAt: string;
    members: string[]; // รายชื่อ user.id ใน group นี้
};

export type UIUser = {
    id: string;
    fullName: string;
    email: string;
    year: number;
    active: boolean;
    major?: string;
    faculty?: string;
    studentId?: string;
};

/** ---------- tiny fetch helper ---------- */
async function j<T>(res: Response): Promise<T> {
    if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`);
        throw new Error(msg);
    }
    return res.json() as any;
}

/** ---------- main hook ---------- */
export function usePolicyDB() {
    const [groups, setGroups] = React.useState<UIPolicy[]>([]);
    const [users, setUsers] = React.useState<UIUser[]>([]);
    const [domains, setDomains] = React.useState<string[]>([]);

    /** โหลดข้อมูลเริ่มต้นจาก API ทั้งสองชุด */
    const refresh = React.useCallback(async () => {
        const [gRes, uRes] = await Promise.allSettled([
            fetch("/api/policies", { cache: "no-store" }),
            fetch("/api/users", { cache: "no-store" }),
        ]);

        // policies
        if (gRes.status === "fulfilled") {
            const g = await j<{ ok: true; policies: UIPolicy[] }>(gRes.value);
            // กันพัง: ensure members เป็นอาเรย์เสมอ
            const safe = (Array.isArray(g.policies) ? g.policies : []).map((p: any) => ({
                id: String(p.id),
                name: String(p.name ?? ""),
                description: p.description ?? null,
                tokenLimit: Number.isFinite(p.tokenLimit) ? Number(p.tokenLimit) : 0,
                updatedAt: String(p.updatedAt ?? new Date().toISOString()),
                members: Array.isArray(p?.members) ? p.members : [],
            }));
            setGroups(safe);
        } else {
            console.error("policies fetch failed:", gRes.reason);
            setGroups([]);
        }

        // users (+ domains)
        if (uRes.status === "fulfilled") {
            const u = await j<{ ok: true; users: UIUser[]; domains: string[] }>(uRes.value);
            setUsers(Array.isArray(u.users) ? u.users : []);
            setDomains(Array.isArray(u.domains) ? u.domains : []);
        } else {
            console.error("users fetch failed:", uRes.reason);
            setUsers([]);
            setDomains([]);
        }
    }, []);

    React.useEffect(() => {
        void refresh();
    }, [refresh]);

    /** ---------- CRUD Policy (ใช้ชื่อ method ว่า group ให้เข้ากับ UI เดิม) ---------- */

    const createGroup = React.useCallback(
        async (v: { name: string; description?: string; tokenLimit?: number }) => {
            const res = await fetch("/api/policies", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(v),
            });
            const { policy } = await j<{ ok: true; policy: UIPolicy }>(res);
            setGroups((s) => [normalizePolicy(policy), ...(Array.isArray(s) ? s : [])]);
        },
        [],
    );

    const deleteGroup = React.useCallback(async (id: string) => {
        await j(await fetch(`/api/policies/${encodeURIComponent(id)}`, { method: "DELETE" }));
        setGroups((s) => (Array.isArray(s) ? s.filter((g) => g.id !== id) : []));
    }, []);

    const deleteGroupsMany = React.useCallback(async (ids: string[]) => {
        if (!ids.length) return;
        await j(
            await fetch("/api/policies/bulk-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ids }),
            }),
        );
        setGroups((s) => (Array.isArray(s) ? s.filter((g) => !ids.includes(g.id)) : []));
    }, []);

    const setGroupTokenLimit = React.useCallback(async (id: string, value: number) => {
        await j(
            await fetch(`/api/policies/${encodeURIComponent(id)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ tokenLimit: value }),
            }),
        );
        setGroups((s) =>
            (Array.isArray(s) ? s : []).map((g) => (g.id === id ? { ...g, tokenLimit: value } : g)),
        );
    }, []);

    /** ---------- Members (เพิ่ม/เอาออก user จาก policy) ---------- */

    const addUserToGroup = React.useCallback(async (userId: string, policyId: string) => {
        await j(
            await fetch(`/api/policies/${encodeURIComponent(policyId)}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds: [userId] }),
            }),
        );
        setGroups((s) =>
            (Array.isArray(s) ? s : []).map((g) =>
                g.id === policyId
                    ? { ...g, members: [...new Set([...(g.members ?? []), userId])] }
                    : g,
            ),
        );
    }, []);

    const removeUserFromGroup = React.useCallback(async (userId: string, policyId: string) => {
        await j(
            await fetch(`/api/policies/${encodeURIComponent(policyId)}/members`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds: [userId] }),
            }),
        );
        setGroups((s) =>
            (Array.isArray(s) ? s : []).map((g) =>
                g.id === policyId
                    ? { ...g, members: (g.members ?? []).filter((id) => id !== userId) }
                    : g,
            ),
        );
    }, []);

    /** ---------- Users ---------- */

    const toggleUserActive = React.useCallback(async (userId: string) => {
        await j(await fetch(`/api/users/${encodeURIComponent(userId)}/toggle-active`, { method: "PATCH" }));
        setUsers((s) =>
            (Array.isArray(s) ? s : []).map((u) =>
                u.id === userId ? { ...u, active: !u.active } : u,
            ),
        );
    }, []);

    /** ---------- Helpers exposed ---------- */

    const getAllEmailDomains = React.useCallback(() => domains, [domains]);

    return {
        // state
        groups,
        users,

        // actions
        createGroup,
        deleteGroup,
        deleteGroupsMany,
        setGroupTokenLimit,
        addUserToGroup,
        removeUserFromGroup,
        toggleUserActive,
        getAllEmailDomains,

        // optional
        refresh,
    };
}

/** ปรับ policy ให้ฟิลด์ครบและชนิดถูกต้องเสมอ */
function normalizePolicy(p: any): UIPolicy {
    return {
        id: String(p?.id),
        name: String(p?.name ?? ""),
        description: p?.description ?? null,
        tokenLimit: Number.isFinite(p?.tokenLimit) ? Number(p.tokenLimit) : 0,
        updatedAt: String(p?.updatedAt ?? new Date().toISOString()),
        members: Array.isArray(p?.members) ? p.members : [],
    };
}
