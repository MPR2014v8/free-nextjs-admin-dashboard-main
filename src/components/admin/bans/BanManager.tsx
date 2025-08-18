"use client";
import React from "react";
import Section from "@/components/admin/Section";
import { useDB } from "@/lib/mockDb";
import { VirtualTable } from "@/components/admin/common/VirtualTable";
import {
    clearSelection,
    isSelected,
    toggleOne,
    selectAllFiltered,
    SelectionState,
} from "@/components/admin/common/selection";
import type { User } from "@/lib/types";
import { addMinutes, addDays } from "date-fns";

import {
    AdminCardTable,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    UserCell,
    useHeaderCheckbox,
} from "@/components/admin/common/AdminCardTable";

/** helper */
const handleCheck =
    (id: string, setSel: React.Dispatch<React.SetStateAction<SelectionState>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSel((s) => toggleOne(id, e.currentTarget.checked, s));
        };

export default function BanManager() {
    const { users, groups, bans, banMany, unban, unbanMany } = useDB();

    const groupNameById = React.useMemo(
        () => new Map(groups.map((g) => [g.id, g.name] as const)),
        [groups],
    );

    /* ---------------- LEFT: Search/Filter Users ---------------- */
    const [q, setQ] = React.useState<string>("");
    const [domain, setDomain] = React.useState<string | undefined>();
    const [groupFilter, setGroupFilter] = React.useState<string>("");
    const [selLeft, setSelLeft] = React.useState<SelectionState>(clearSelection());

    const filteredUsers: User[] = React.useMemo(() => {
        const qq = q.trim().toLowerCase();
        const out: User[] = [];
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (groupFilter && !u.groups.includes(groupFilter)) continue;
            if (domain && !u.email.toLowerCase().endsWith(domain)) continue;
            if (qq) {
                const hay = `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(qq)) continue;
            }
            out.push(u);
        }
        return out;
    }, [users, q, domain, groupFilter]);

    // header
    const leftIds = React.useMemo(() => filteredUsers.map((u) => u.id), [filteredUsers]);
    const leftSelectedCount = React.useMemo(() => {
        if (selLeft.mode === "none") return 0;
        if (selLeft.mode === "some") {
            let c = 0;
            for (const id of leftIds) if (selLeft.picked.has(id)) c++;
            return c;
        }
        return leftIds.length - Array.from(selLeft.excluded).filter((id) => leftIds.includes(id)).length;
    }, [selLeft, leftIds]);

    const leftHeaderCb = useHeaderCheckbox(leftSelectedCount, leftIds.length, () => {
        const all = leftSelectedCount === leftIds.length && leftIds.length > 0;
        setSelLeft(all ? clearSelection() : selectAllFiltered());
    });

    // Basket
    const [basket, setBasket] = React.useState<string[]>([]);
    const basketUsers: User[] = React.useMemo(
        () => basket.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[],
        [basket, users],
    );
    const addSelectedToBasket = () => {
        const ids: string[] =
            selLeft.mode === "some"
                ? Array.from(selLeft.picked)
                : selLeft.mode === "allFiltered"
                    ? filteredUsers.filter((u) => !selLeft.excluded.has(u.id)).map((u) => u.id)
                    : [];
        if (!ids.length) return;
        const s = new Set(basket);
        ids.forEach((id) => s.add(id));
        setBasket(Array.from(s));
        setSelLeft(clearSelection());
    };

    /* ---------------- Basket options ---------------- */
    const [reason, setReason] = React.useState<string>("");
    const [scopeGroupId, setScopeGroupId] = React.useState<string>(""); // "" = Global
    const [duration, setDuration] = React.useState<"30m" | "1h" | "2h" | "1d" | "7d" | "∞">("1h");

    const computeEndAt = (): string | undefined => {
        const now = new Date();
        switch (duration) {
            case "30m":
                return addMinutes(now, 30).toISOString();
            case "1h":
                return addMinutes(now, 60).toISOString();
            case "2h":
                return addMinutes(now, 120).toISOString();
            case "1d":
                return addDays(now, 1).toISOString();
            case "7d":
                return addDays(now, 7).toISOString();
            default:
                return undefined;
        }
    };

    const handleBan = () => {
        if (!basket.length) return;
        if (!confirm(`Ban ${basket.length} user(s)?`)) return;
        banMany(basket, {
            groupId: scopeGroupId || undefined,
            reason: reason || undefined,
            endAt: computeEndAt(),
        });
        setBasket([]);
        setReason("");
    };

    /* ---------------- Current bans table ---------------- */
    type BanRow = { b: (typeof bans)[number]; u?: User; gName: string };
    const banRows: BanRow[] = React.useMemo(() => {
        const userById = new Map(users.map((u) => [u.id, u]));
        return bans.map((b) => ({
            b,
            u: userById.get(b.userId),
            gName: b.groupId ? groupNameById.get(b.groupId) ?? "Unknown" : "Global",
        }));
    }, [bans, users, groupNameById]);

    const [qBans, setQBans] = React.useState<string>("");
    const [banGroupFilter, setBanGroupFilter] = React.useState<string>("");
    const [banDomain, setBanDomain] = React.useState<string | undefined>();
    const [selBans, setSelBans] = React.useState<SelectionState>(clearSelection());

    const filteredBans: BanRow[] = React.useMemo(() => {
        const qq = qBans.trim().toLowerCase();
        const out: BanRow[] = [];
        for (let i = 0; i < banRows.length; i++) {
            const r = banRows[i];
            if (banGroupFilter === "__GLOBAL__") {
                if (r.b.groupId != null) continue;
            } else if (banGroupFilter) {
                if ((r.b.groupId ?? "") !== banGroupFilter) continue;
            }
            if (banDomain && r.u && !r.u.email.toLowerCase().endsWith(banDomain)) continue;
            if (qq) {
                const name = r.u?.fullName.toLowerCase() ?? "";
                const email = r.u?.email.toLowerCase() ?? "";
                const reasonTxt = (r.b.reason ?? "").toLowerCase();
                if (!(name.includes(qq) || email.includes(qq) || reasonTxt.includes(qq))) continue;
            }
            out.push(r);
        }
        return out;
    }, [banRows, qBans, banGroupFilter, banDomain]);

    const banIds = React.useMemo(() => filteredBans.map((r) => r.b.id), [filteredBans]);
    const banSelectedCount = React.useMemo(() => {
        if (selBans.mode === "none") return 0;
        if (selBans.mode === "some") {
            let c = 0;
            for (const id of banIds) if (selBans.picked.has(id)) c++;
            return c;
        }
        return banIds.length - Array.from(selBans.excluded).filter((id) => banIds.includes(id)).length;
    }, [selBans, banIds]);

    const bansHeaderCb = useHeaderCheckbox(banSelectedCount, banIds.length, () => {
        const all = banSelectedCount === banIds.length && banIds.length > 0;
        setSelBans(all ? clearSelection() : selectAllFiltered());
    });

    const bulkUnban = () => {
        const ids: string[] =
            selBans.mode === "some"
                ? Array.from(selBans.picked)
                : selBans.mode === "allFiltered"
                    ? filteredBans.filter((r) => !selBans.excluded.has(r.b.id)).map((r) => r.b.id)
                    : [];
        if (!ids.length) return;
        if (!confirm(`Unban ${ids.length} record(s)?`)) return;
        unbanMany(ids);
        setSelBans(clearSelection());
    };

    /* ---------------- UI ---------------- */
    return (
        <Section title="Bans">
            <div className="grid grid-cols-12 gap-4">
                {/* LEFT: search users (list ธรรมดา ใช้ VirtualTable เหมือนเดิม) */}
                <div className="col-span-12 xl:col-span-7">
                    <div className="mb-2 text-sm font-medium">Search users</div>

                    <div className="mb-3 flex flex-wrap items-center gap-2">
                        <input
                            value={q}
                            onChange={(e) => {
                                setQ(e.target.value);
                                setSelLeft(clearSelection());
                            }}
                            placeholder="Search name / studentId / email…"
                            className="w-64 rounded-lg border px-3 py-2 text-sm"
                        />
                        <select
                            className="rounded-lg border px-3 py-2 text-sm"
                            value={groupFilter}
                            onChange={(e) => {
                                setGroupFilter(e.target.value);
                                setSelLeft(clearSelection());
                            }}
                        >
                            <option value="">All groups</option>
                            {groups.map((g) => (
                                <option key={g.id} value={g.id}>
                                    {g.name}
                                </option>
                            ))}
                        </select>
                        <select
                            className="rounded-lg border px-3 py-2 text-sm"
                            value={domain ?? ""}
                            onChange={(e) => {
                                setDomain(e.target.value || undefined);
                                setSelLeft(clearSelection());
                            }}
                        >
                            <option value="">All domains</option>
                            <option value="@udru.ac.th">@udru.ac.th</option>
                            <option value="@gmail.com">@gmail.com</option>
                            <option value="@hotmail.com">@hotmail.com</option>
                            <option value="@outlook.com">@outlook.com</option>
                            <option value="@yahoo.com">@yahoo.com</option>
                        </select>

                        <button
                            className="ml-auto rounded-lg border px-3 py-1 text-sm"
                            onClick={addSelectedToBasket}
                            disabled={selLeft.mode === "none" || (selLeft.mode === "some" && selLeft.picked.size === 0)}
                        >
                            Add to basket
                        </button>
                    </div>

                    <div className="min-h-[560px] rounded-xl border">
                        <div className="grid grid-cols-12 border-b text-left text-sm">
                            <div className="col-span-1 px-2 py-2">
                                <input ref={leftHeaderCb.ref} type="checkbox" checked={leftHeaderCb.checked} onChange={leftHeaderCb.onChange} />
                            </div>
                            <div className="col-span-4 px-2 py-2">Name</div>
                            <div className="col-span-4 px-2 py-2">Email</div>
                            <div className="col-span-3 px-2 py-2">Groups</div>
                        </div>
                        <VirtualTable
                            items={filteredUsers}
                            rowHeight={44}
                            renderRow={({ item: u }) => {
                                const gNames = u.groups.map((gid) => groupNameById.get(gid) || gid);
                                const label = gNames.length <= 2 ? gNames.join(", ") : `${gNames.slice(0, 2).join(", ")} +${gNames.length - 2} more`;
                                return (
                                    <div className="grid grid-cols-12 items-center border-b text-sm">
                                        <div className="col-span-1 px-2 py-2">
                                            <input type="checkbox" checked={isSelected(u.id, selLeft)} onChange={handleCheck(u.id, setSelLeft)} />
                                        </div>
                                        <div className="col-span-4 px-2 py-2">
                                            <div className="font-medium">{u.fullName}</div>
                                            <div className="text-xs text-gray-500">ID: {u.studentId}</div>
                                        </div>
                                        <div className="col-span-4 px-2 py-2">{u.email}</div>
                                        <div className="col-span-3 px-2 py-2">{label || "-"}</div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>

                {/* RIGHT: basket */}
                <div className="col-span-12 xl:col-span-5">
                    <div className="mb-2 text-sm font-medium">Ban basket</div>
                    <div className="mb-3 grid grid-cols-1 gap-2 rounded-xl border p-3">
                        <label className="text-sm">
                            Reason
                            <input
                                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="Why are you banning these users?"
                            />
                        </label>
                        <label className="text-sm">
                            Scope
                            <select
                                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                value={scopeGroupId}
                                onChange={(e) => setScopeGroupId(e.target.value)}
                            >
                                <option value="">Global</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm">
                            Duration
                            <select
                                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value as typeof duration)}
                            >
                                <option value="30m">30 minutes</option>
                                <option value="1h">1 hour</option>
                                <option value="2h">2 hours</option>
                                <option value="1d">1 day</option>
                                <option value="7d">7 days</option>
                                <option value="∞">Indefinite (∞)</option>
                            </select>
                        </label>
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Selected: <b>{basketUsers.length}</b>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    className="rounded-lg border px-3 py-1 text-sm text-rose-600 ring-1 ring-rose-200 hover:bg-rose-50"
                                    onClick={handleBan}
                                    disabled={!basketUsers.length}
                                >
                                    Ban
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* basket list (คง VirtualTable) */}
                    <div className="min-h-[560px] rounded-xl border">
                        <div className="grid grid-cols-12 border-b text-left text-sm">
                            <div className="col-span-7 px-2 py-2">User</div>
                            <div className="col-span-4 px-2 py-2">Email</div>
                            <div className="col-span-1 px-2 py-2"></div>
                        </div>
                        <VirtualTable
                            items={basketUsers}
                            rowHeight={44}
                            renderRow={({ item: u }) => (
                                <div className="grid grid-cols-12 items-center border-b text-sm">
                                    <div className="col-span-7 px-2 py-2">
                                        <div className="font-medium">{u.fullName}</div>
                                        <div className="text-xs text-gray-500">ID: {u.studentId}</div>
                                    </div>
                                    <div className="col-span-4 px-2 py-2">{u.email}</div>
                                    <div className="col-span-1 px-2 py-2">
                                        <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => setBasket((b) => b.filter((x) => x !== u.id))}>
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* ---------------- Current bans (styled table) ---------------- */}
            <div className="mt-6">
                <div className="mb-2 text-sm font-medium">Current bans</div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                        value={qBans}
                        onChange={(e) => {
                            setQBans(e.target.value);
                            setSelBans(clearSelection());
                        }}
                        placeholder="Search bans by name / email / reason…"
                        className="w-64 rounded-lg border px-3 py-2 text-sm"
                    />
                    <select
                        className="rounded-lg border px-3 py-2 text-sm"
                        value={banGroupFilter}
                        onChange={(e) => {
                            setBanGroupFilter(e.target.value);
                            setSelBans(clearSelection());
                        }}
                    >
                        <option value="">All groups</option>
                        <option value="__GLOBAL__">Global only</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="rounded-lg border px-3 py-2 text-sm"
                        value={banDomain ?? ""}
                        onChange={(e) => {
                            setBanDomain(e.target.value || undefined);
                            setSelBans(clearSelection());
                        }}
                    >
                        <option value="">All domains</option>
                        <option value="@udru.ac.th">@udru.ac.th</option>
                        <option value="@gmail.com">@gmail.com</option>
                        <option value="@hotmail.com">@hotmail.com</option>
                        <option value="@outlook.com">@outlook.com</option>
                        <option value="@yahoo.com">@yahoo.com</option>
                    </select>

                    <button
                        className="ml-auto rounded-lg border px-3 py-1 text-sm"
                        onClick={bulkUnban}
                        disabled={
                            selBans.mode === "none" ||
                            (selBans.mode === "some" && selBans.picked.size === 0)
                        }
                    >
                        Unban selected
                    </button>
                </div>

                <AdminCardTable minWidth={1100}>
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/10">
                            <TableRow>
                                <TableCell isHeader className="w-10 px-4 py-3">
                                    <input
                                        type="checkbox"
                                        ref={bansHeaderCb.ref}
                                        checked={bansHeaderCb.checked}
                                        onChange={bansHeaderCb.onChange}
                                    />
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                    User
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                    Scope
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                    Reason
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                    Start
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                    End
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs"></TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-white/10">
                            {filteredBans.map(({ b, u, gName }) => (
                                <TableRow key={b.id}>
                                    <TableCell className="w-10 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(b.id, selBans)}
                                            onChange={(e) => setSelBans((s) => toggleOne(b.id, e.currentTarget.checked, s))}
                                        />
                                    </TableCell>

                                    <TableCell className="px-5 py-4">
                                        {u ? (
                                            <UserCell title={u.fullName} subtitle={`${u.email}${u.studentId ? " · ID: " + u.studentId : ""}`} />
                                        ) : (
                                            <UserCell title={b.userId} />
                                        )}
                                    </TableCell>

                                    <TableCell className="px-5 py-4">{gName}</TableCell>
                                    <TableCell className="px-5 py-4">{b.reason || "-"}</TableCell>
                                    <TableCell className="px-5 py-4">{new Date(b.startAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="px-5 py-4">{b.endAt ? new Date(b.endAt).toLocaleDateString() : "∞"}</TableCell>

                                    <TableCell className="px-5 py-4">
                                        <button
                                            className="rounded-full px-3 py-1 text-xs ring-1 ring-gray-200 text-gray-700 hover:bg-gray-50 dark:ring-white/10 dark:text-gray-300"
                                            onClick={() => unban(b.id)}
                                        >
                                            Unban
                                        </button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </AdminCardTable>
            </div>
        </Section>
    );
}
