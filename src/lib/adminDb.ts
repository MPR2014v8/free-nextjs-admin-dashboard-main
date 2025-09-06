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
    groups: string[]; // policy ids
};

export type UIGroup = { id: string; name: string };

export type UIBan = {
    id: string;
    userId: string;
    groupId: string | null;
    reason: string | null;
    startAt: string;           // ISO string
    endAt: string | null;      // ISO string or null
};

async function j<T>(r: Response): Promise<T> {
    if (!r.ok) throw new Error(await r.text().catch(() => `HTTP ${r.status}`));
    return r.json() as any;
}

export function useDB() {
    const [users, setUsers] = React.useState<UIUser[]>([]);
    const [groups, setGroups] = React.useState<UIGroup[]>([]);
    const [bans, setBans] = React.useState<UIBan[]>([]);

    const refresh = React.useCallback(async () => {
        // /api/users คืน users + domains + groups(policies)
        const uRes = await fetch("/api/users", { cache: "no-store" });
        const uJson = await j<{ ok: true; users: UIUser[]; groups: UIGroup[] }>(uRes);
        setUsers(uJson.users);
        setGroups(uJson.groups);

        const bRes = await fetch("/api/bans", { cache: "no-store" });
        const bJson = await j<{ ok: true; bans: any[] }>(bRes);
        // map date -> string
        setBans(
            bJson.bans.map((b) => ({
                ...b,
                startAt: new Date(b.startAt).toISOString(),
                endAt: b.endAt ? new Date(b.endAt).toISOString() : null,
            })),
        );
    }, []);

    React.useEffect(() => {
        refresh().catch(console.error);
    }, [refresh]);

    // ---- actions for BanManager ----
    const banMany = React.useCallback(
        async (
            userIds: string[],
            opts: { groupId?: string; reason?: string; endAt?: string },
        ) => {
            const res = await fetch("/api/bans/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userIds,
                    groupId: opts.groupId ?? null,
                    reason: opts.reason ?? null,
                    endAt: opts.endAt ?? null,
                }),
            });
            const { created } = await j<{ ok: true; created: any[] }>(res);
            setBans((s) => [
                ...created.map((b) => ({
                    ...b,
                    startAt: new Date(b.startAt).toISOString(),
                    endAt: b.endAt ? new Date(b.endAt).toISOString() : null,
                })),
                ...s,
            ]);
        },
        [],
    );

    const unban = React.useCallback(async (id: string) => {
        await j(await fetch(`/api/bans/${id}`, { method: "DELETE" }));
        setBans((s) => s.filter((b) => b.id !== id));
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
        setBans((s) => s.filter((b) => !ids.includes(b.id)));
    }, []);

    return { users, groups, bans, banMany, unban, unbanMany };
}
