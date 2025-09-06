/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import * as React from "react";

export type UIUser = {
    id: string;
    fullName: string;
    email: string;
    major?: string;
    faculty?: string;
    year: number;
    active: boolean;
    studentId?: string;
    groups: string[]; // policyIds
};

export type UIGroup = { id: string; name: string };

async function json<T>(r: Response): Promise<T> {
    if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`));
    return r.json() as any;
}

export function useUsersDB() {
    const [users, setUsers] = React.useState<UIUser[]>([]);
    const [groups, setGroups] = React.useState<UIGroup[]>([]);
    const [domains, setDomains] = React.useState<string[]>([]);

    const refresh = React.useCallback(async () => {
        const r = await fetch("/api/users", { cache: "no-store" });
        const { users: u, groups: g, domains: d } = await json<{ ok: true; users: UIUser[]; groups: UIGroup[]; domains: string[] }>(r);
        setUsers(u);
        setGroups(g);
        setDomains(d);
    }, []);

    React.useEffect(() => { refresh().catch(console.error); }, [refresh]);

    const getAllEmailDomains = React.useCallback(() => domains, [domains]);

    const toggleUserActive = React.useCallback(async (id: string) => {
        await json(await fetch(`/api/users/${id}/toggle-active`, { method: "PATCH" }));
        setUsers((s) => s.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));
    }, []);

    const setUsersActiveMany = React.useCallback(async (ids: string[], active: boolean) => {
        if (!ids.length) return;
        await json(await fetch("/api/users/bulk-active", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, active }),
        }));
        setUsers((s) => s.map((u) => (ids.includes(u.id) ? { ...u, active } : u)));
    }, []);

    const deleteUsersMany = React.useCallback(async (ids: string[]) => {
        if (!ids.length) return;
        await json(await fetch("/api/users/bulk-delete", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        }));
        setUsers((s) => s.filter((u) => !ids.includes(u.id)));
    }, []);

    const createUser = React.useCallback(async (v: {
        fullName: string; studentId: string; email: string;
        major: string; faculty: string; year: number;
    }) => {
        const res = await fetch("/api/users", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(v),
        });
        const { user } = await json<{ ok: true; user: UIUser }>(res);
        setUsers((s) => [user, ...s]);
    }, []);

    return {
        users,
        groups,
        getAllEmailDomains,
        // methods used in UserManager
        toggleUserActive,
        setUsersActiveMany,
        deleteUsersMany,
        createUser,
    };
}
