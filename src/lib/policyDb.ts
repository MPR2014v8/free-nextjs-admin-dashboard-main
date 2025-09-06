"use client";
import * as React from "react";

export type UIPolicy = {
    id: string;
    name: string;
    description?: string | null;
    tokenLimit: number;
    updatedAt: string;
    members: string[];
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

async function j<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(await res.text().catch(() => `HTTP ${res.status}`));
    return res.json() as any;
}

export function usePolicyDB() {
    const [groups, setGroups] = React.useState<UIPolicy[]>([]);
    const [users, setUsers] = React.useState<UIUser[]>([]);
    const [domains, setDomains] = React.useState<string[]>([]);

    const refresh = React.useCallback(async () => {
        const [gRes, uRes] = await Promise.all([
            fetch("/api/policies", { cache: "no-store" }),
            fetch("/api/users", { cache: "no-store" }),
        ]);
        const g = await j<{ ok: true; policies: UIPolicy[] }>(gRes);
        const u = await j<{ ok: true; users: UIUser[]; domains: string[] }>(uRes);
        setGroups(g.policies);
        setUsers(u.users);
        setDomains(u.domains);
    }, []);

    React.useEffect(() => { refresh().catch(console.error); }, [refresh]);

    // CRUD Policy (ชื่อ method คงเดิม เพื่อให้ GroupManager ใช้ต่อได้)
    const createGroup = React.useCallback(async (v: {
        name: string; description?: string; tokenLimit?: number;
    }) => {
        const res = await fetch("/api/policies", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(v),
        });
        const { policy } = await j<{ ok: true; policy: UIPolicy }>(res);
        setGroups((s) => [policy, ...s]);
    }, []);

    const deleteGroup = React.useCallback(async (id: string) => {
        await j(await fetch(`/api/policies/${id}`, { method: "DELETE" }));
        setGroups((s) => s.filter((g) => g.id !== id));
    }, []);

    const deleteGroupsMany = React.useCallback(async (ids: string[]) => {
        if (!ids.length) return;
        await j(await fetch("/api/policies/bulk-delete", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids }),
        }));
        setGroups((s) => s.filter((g) => !ids.includes(g.id)));
    }, []);

    const setGroupTokenLimit = React.useCallback(async (id: string, value: number) => {
        await j(await fetch(`/api/policies/${id}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tokenLimit: value }),
        }));
        setGroups((s) => s.map((g) => (g.id === id ? { ...g, tokenLimit: value } : g)));
    }, []);

    // Members
    const addUserToGroup = React.useCallback(async (userId: string, policyId: string) => {
        await j(await fetch(`/api/policies/${policyId}/members`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: [userId] }),
        }));
        setGroups((s) => s.map((g) => g.id === policyId ? { ...g, members: [...new Set([...g.members, userId])] } : g));
    }, []);

    const removeUserFromGroup = React.useCallback(async (userId: string, policyId: string) => {
        await j(await fetch(`/api/policies/${policyId}/members`, {
            method: "DELETE", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: [userId] }),
        }));
        setGroups((s) => s.map((g) => g.id === policyId ? { ...g, members: g.members.filter((id) => id !== userId) } : g));
    }, []);

    // Users
    const toggleUserActive = React.useCallback(async (userId: string) => {
        await j(await fetch(`/api/users/${userId}/toggle-active`, { method: "PATCH" }));
        setUsers((s) => s.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)));
    }, []);

    const getAllEmailDomains = React.useCallback(() => domains, [domains]);

    return {
        groups, users,
        createGroup, deleteGroup, deleteGroupsMany, setGroupTokenLimit,
        addUserToGroup, removeUserFromGroup, toggleUserActive,
        getAllEmailDomains,
    };
}
