/* eslint-disable react-hooks/rules-of-hooks */
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

const handleCheck =
    (id: string, setSel: React.Dispatch<React.SetStateAction<SelectionState>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            setSel((s) => toggleOne(id, checked, s));
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
    const [groupFilter, setGroupFilter] = React.useState<string>(""); // "" = All groups
    const [selLeft, setSelLeft] =
        React.useState<SelectionState>(clearSelection());

    const filteredUsers: User[] = React.useMemo(() => {
        const qq = q.trim().toLowerCase();
        const out: User[] = [];
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (groupFilter && !u.groups.includes(groupFilter)) continue; // group filter
            if (domain && !u.email.toLowerCase().endsWith(domain)) continue; // email domain filter
            if (qq) {
                const hay =
                    `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(qq)) continue;
            }
            out.push(u);
        }
        return out;
    }, [users, q, domain, groupFilter]);

    // ---- Header Select (Search users) ----
    const leftIds = React.useMemo(
        () => filteredUsers.map((u) => u.id),
        [filteredUsers],
    );
    const leftSelectedCount = React.useMemo(() => {
        if (selLeft.mode === "none") return 0;
        if (selLeft.mode === "some") {
            let c = 0;
            for (const id of leftIds) if (selLeft.picked.has(id)) c++;
            return c;
        }
        return (
            leftIds.length -
            Array.from(selLeft.excluded).filter((id) => leftIds.includes(id)).length
        );
    }, [selLeft, leftIds]);
    const leftHeaderChecked =
        leftSelectedCount > 0 && leftSelectedCount === leftIds.length;
    const leftHeaderIndeterminate =
        leftSelectedCount > 0 && leftSelectedCount < leftIds.length;
    const leftHeaderRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (leftHeaderRef.current)
            leftHeaderRef.current.indeterminate = leftHeaderIndeterminate;
    }, [leftHeaderIndeterminate]);
    const toggleSelectAllLeft = () => {
        if (leftHeaderChecked) setSelLeft(clearSelection());
        else setSelLeft(selectAllFiltered());
    };

    // Basket (ผู้ใช้ที่จะ ban) — ไม่มี selection ตามที่ต้องการ
    const [basket, setBasket] = React.useState<string[]>([]);
    const basketUsers: User[] = React.useMemo(
        () =>
            basket
                .map((id) => users.find((u) => u.id === id))
                .filter(Boolean) as User[],
        [basket, users],
    );

    const addSelectedToBasket = () => {
        const ids: string[] =
            selLeft.mode === "some"
                ? Array.from(selLeft.picked)
                : selLeft.mode === "allFiltered"
                    ? filteredUsers
                        .filter((u) => !selLeft.excluded.has(u.id))
                        .map((u) => u.id)
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
    const [duration, setDuration] = React.useState<
        "30m" | "1h" | "2h" | "1d" | "7d" | "∞"
    >("1h");

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
            case "∞":
            default:
                return undefined;
        }
    };

    const handleBan = () => {
        if (!basket.length) return;
        if (!confirm(`Ban ${basket.length} user(s)?`)) return;
        banMany(basket, {
            groupId: scopeGroupId || undefined, // "" => Global
            reason: reason || undefined,
            endAt: computeEndAt(),
        });
        setBasket([]);
        setReason("");
    };

    /* ---------------- BOTTOM: Current bans + filters ---------------- */
    type BanRow = { b: (typeof bans)[number]; u?: User; gName: string };
    const banRows: BanRow[] = React.useMemo(() => {
        const userById = new Map(users.map((u) => [u.id, u]));
        return bans.map((b) => ({
            b,
            u: userById.get(b.userId),
            gName: b.groupId ? (groupNameById.get(b.groupId) ?? "Unknown") : "Global",
        }));
    }, [bans, users, groupNameById]);

    const [qBans, setQBans] = React.useState<string>("");
    const [banGroupFilter, setBanGroupFilter] = React.useState<string>(""); // "" = All, "__GLOBAL__" = Global only, else groupId
    const [banDomain, setBanDomain] = React.useState<string | undefined>();
    const [selBans, setSelBans] =
        React.useState<SelectionState>(clearSelection());

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
            if (banDomain && r.u && !r.u.email.toLowerCase().endsWith(banDomain))
                continue;
            if (qq) {
                const name = r.u?.fullName.toLowerCase() ?? "";
                const email = r.u?.email.toLowerCase() ?? "";
                const reasonTxt = (r.b.reason ?? "").toLowerCase();
                if (
                    !(name.includes(qq) || email.includes(qq) || reasonTxt.includes(qq))
                )
                    continue;
            }
            out.push(r);
        }
        return out;
    }, [banRows, qBans, banGroupFilter, banDomain]);

    // ---- Header Select (Current bans) ----
    const banIds = React.useMemo(
        () => filteredBans.map((r) => r.b.id),
        [filteredBans],
    );
    const banSelectedCount = React.useMemo(() => {
        if (selBans.mode === "none") return 0;
        if (selBans.mode === "some") {
            let c = 0;
            for (const id of banIds) if (selBans.picked.has(id)) c++;
            return c;
        }
        return (
            banIds.length -
            Array.from(selBans.excluded).filter((id) => banIds.includes(id)).length
        );
    }, [selBans, banIds]);
    const bansHeaderChecked =
        banSelectedCount > 0 && banSelectedCount === banIds.length;
    const bansHeaderIndeterminate =
        banSelectedCount > 0 && banSelectedCount < banIds.length;
    const bansHeaderRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (bansHeaderRef.current)
            bansHeaderRef.current.indeterminate = bansHeaderIndeterminate;
    }, [bansHeaderIndeterminate]);
    const toggleSelectAllBans = () => {
        if (bansHeaderChecked) setSelBans(clearSelection());
        else setSelBans(selectAllFiltered());
    };

    const bulkUnban = () => {
        const ids: string[] =
            selBans.mode === "some"
                ? Array.from(selBans.picked)
                : selBans.mode === "allFiltered"
                    ? filteredBans
                        .filter((r) => !selBans.excluded.has(r.b.id))
                        .map((r) => r.b.id)
                    : [];
        if (!ids.length) return;
        if (!confirm(`Unban ${ids.length} record(s)?`)) return;
        unbanMany(ids);
        setSelBans(clearSelection());
    };

    /* ---------------- UI ---------------- */
    return (
        <Section title="Bans">
            {/* Dual table */}
            <div className="grid grid-cols-12 gap-4">
                {/* LEFT: search users */}
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
                        {/* filter by group */}
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
                        {/* filter by email domain */}
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
                            disabled={
                                selLeft.mode === "none" ||
                                (selLeft.mode === "some" && selLeft.picked.size === 0)
                            }
                        >
                            Add to basket
                        </button>
                    </div>

                    <div className="min-h-[560px] rounded-xl border">
                        <div className="grid grid-cols-12 border-b text-left text-sm">
                            <div className="col-span-1 px-2 py-2">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        ref={leftHeaderRef}
                                        type="checkbox"
                                        checked={leftHeaderChecked}
                                        onChange={toggleSelectAllLeft}
                                    />
                                    <span></span>
                                </label>
                            </div>
                            <div className="col-span-4 px-2 py-2">Name</div>
                            <div className="col-span-4 px-2 py-2">Email</div>
                            <div className="col-span-3 px-2 py-2">Groups</div>
                        </div>
               
                        <VirtualTable
                            items={filteredUsers}
                            rowHeight={44}
                            renderRow={({ item: u }) => {
                                const gNames = u.groups.map(
                                    (gid) => groupNameById.get(gid) || gid,
                                );
                                const label =
                                    gNames.length <= 2
                                        ? gNames.join(", ")
                                        : `${gNames.slice(0, 2).join(", ")} +${gNames.length - 2} more`;
                                return (
                                    <div className="grid grid-cols-12 items-center border-b text-sm">
                                        <div className="col-span-1 px-2 py-2">
                                            <input
                                                type="checkbox"
                                                checked={isSelected(u.id, selLeft)}
                                                onChange={handleCheck(u.id, setSelLeft)}
                                            />
                                        </div>
                                        <div className="col-span-4 px-2 py-2">
                                            <div className="font-medium">{u.fullName}</div>
                                            <div className="text-xs text-gray-500">
                                                ID: {u.studentId}
                                            </div>
                                        </div>
                                        <div className="col-span-4 px-2 py-2">{u.email}</div>
                                        <div className="col-span-3 px-2 py-2">{label || "-"}</div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>

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
                            <button
                                className="rounded-lg bg-rose-600 px-3 py-1 text-sm text-white shadow-sm hover:bg-rose-700"
                                onClick={handleBan}
                                disabled={!basketUsers.length}
                            >
                                Ban
                            </button>
                        </div>
                    </div>

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
                                        <div className="text-xs text-gray-500">
                                            ID: {u.studentId}
                                        </div>
                                    </div>
                                    <div className="col-span-4 px-2 py-2">{u.email}</div>
                                    <div className="col-span-1 px-2 py-2">
                                        <button
                                            className="rounded-lg border px-2 py-1 text-xs"
                                            onClick={() =>
                                                setBasket((b) => b.filter((x) => x !== u.id))
                                            }
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* Current bans */}
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
                    {/* Group filter: All / Global only / specific group */}
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
                    {/* Email domain filter */}
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

                <div className="rounded-xl border">
                    <div className="grid grid-cols-12 border-b text-left text-sm">
                        <div className="col-span-1 px-2 py-2">
                            {/* Header checkbox: Select All + indeterminate */}
                            <label className="inline-flex items-center gap-2">
                                <input
                                    ref={bansHeaderRef}
                                    type="checkbox"
                                    checked={bansHeaderChecked}
                                    onChange={toggleSelectAllBans}
                                />
                                <span></span>
                            </label>
                        </div>
                        <div className="col-span-3 px-2 py-2">User</div>
                        <div className="col-span-2 px-2 py-2">Scope</div>
                        <div className="col-span-3 px-2 py-2">Reason</div>
                        <div className="col-span-1 px-2 py-2">Start</div>
                        <div className="col-span-1 px-2 py-2">End</div>
                        <div className="col-span-1 px-2 py-2"></div>
                    </div>
                    <VirtualTable
                        items={filteredBans}
                        rowHeight={44}
                        renderRow={({ item: { b, u, gName } }) => (
                            <div className="grid grid-cols-12 items-center border-b text-sm">
                                <div className="col-span-1 px-2 py-2">
                                    <input
                                        type="checkbox"
                                        checked={isSelected(b.id, selBans)}
                                        onChange={handleCheck(b.id, setSelBans)}
                                    />
                                </div>
                                <div className="col-span-3 px-2 py-2">
                                    {u ? (
                                        <>
                                            <div className="font-medium">{u.fullName}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </>
                                    ) : (
                                        b.userId
                                    )}
                                </div>
                                <div className="col-span-2 px-2 py-2">{gName}</div>
                                <div className="col-span-3 px-2 py-2">{b.reason || "-"}</div>
                                <div className="col-span-1 px-2 py-2">
                                    {new Date(b.startAt).toLocaleDateString()}
                                </div>
                                <div className="col-span-1 px-2 py-2">
                                    {b.endAt ? new Date(b.endAt).toLocaleDateString() : "∞"}
                                </div>
                                <div className="col-span-1 px-2 py-2">
                                    <button
                                        className="rounded-lg border px-2 py-1 text-xs"
                                        onClick={() => unban(b.id)}
                                    >
                                        Unban
                                    </button>
                                </div>
                            </div>
                        )}
                    />
                </div>
            </div>
        </Section>
    );
}
