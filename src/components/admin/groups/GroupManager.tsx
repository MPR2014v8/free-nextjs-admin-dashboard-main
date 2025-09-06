/* eslint-disable react-hooks/exhaustive-deps */
// src/components/admin/groups/GroupManager.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React from "react";
import Section from "@/components/admin/Section";
import GroupForm, { GroupFormValues } from "./GroupForm";
import { usePolicyDB as useDB } from "@/lib/policyDb";
import { VirtualTable } from "@/components/admin/common/VirtualTable";
import {
    clearSelection,
    isSelected,
    selectAllFiltered,
    toggleOne,
    type SelectionState,
} from "@/components/admin/common/selection";

/* -------------------- helpers -------------------- */
const handleCheck =
    (id: string, setSel: React.Dispatch<React.SetStateAction<SelectionState>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            setSel((s) => toggleOne(id, checked, s));
        };

/* -------------------- Modal -------------------- */
function Modal({
    open,
    onClose,
    title,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-[71] w-full max-w-6xl rounded-2xl border bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/* -------------------- Edit Members (wrapper) -------------------- */
function EditMembersModal({
    open,
    onClose,
    groupId,
}: {
    open: boolean;
    onClose: () => void;
    groupId: string | null;
}) {
    return (
        <Modal open={open} onClose={onClose} title="Edit Members">
            {open && groupId ? <EditMembersBody groupId={groupId} /> : null}
        </Modal>
    );
}

/* -------------------- Edit Members (body) -------------------- */
function EditMembersBody({ groupId }: { groupId: string }) {
    const db = useDB();

    const groups = Array.isArray(db.groups) ? db.groups.filter(Boolean) : [];
    const users = Array.isArray(db.users) ? db.users : [];
    const addUserToGroup = db.addUserToGroup;
    const removeUserFromGroup = db.removeUserFromGroup;
    const toggleUserActive = db.toggleUserActive;
    const getAllEmailDomains = db.getAllEmailDomains;

    // filters
    const [q, setQ] = React.useState("");
    const [domain, setDomain] = React.useState<string | undefined>();
    const [year, setYear] = React.useState<number | undefined>();
    const [activeOnly, setActiveOnly] = React.useState(false);

    const [addQ, setAddQ] = React.useState("");
    const [addDomain, setAddDomain] = React.useState<string | undefined>();
    const [addYear, setAddYear] = React.useState<number | undefined>();

    // selections
    const [pick, setPick] = React.useState<SelectionState>(clearSelection());
    const [selMembers, setSelMembers] = React.useState<SelectionState>(clearSelection());
    const membersHeaderRef = React.useRef<HTMLInputElement>(null);

    const domains = React.useMemo(() => getAllEmailDomains(), [getAllEmailDomains]);

    const group = React.useMemo(
        () => groups.find((gg: any) => gg?.id === groupId) ?? null,
        [groups, groupId],
    );

    const members = React.useMemo(
        () =>
            group
                ? users.filter((u: any) =>
                    (Array.isArray(group.members) ? group.members : []).includes(u.id),
                )
                : [],
        [users, group],
    );

    const filteredMembers = React.useMemo(() => {
        const qq = q.trim().toLowerCase();
        const out: any[] = [];
        for (let i = 0; i < members.length; i++) {
            const u: any = members[i];
            if (domain && !u.email.toLowerCase().endsWith(domain)) continue;
            if (year && u.year !== year) continue;
            if (activeOnly && !u.active) continue;
            if (qq) {
                const hay = `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(qq)) continue;
            }
            out.push(u);
        }
        return out;
    }, [members, q, domain, year, activeOnly]);

    const candidates = React.useMemo(() => {
        if (!group) return [];
        const qq = addQ.trim().toLowerCase();
        const out: any[] = [];
        const currentMembers = Array.isArray(group.members) ? group.members : [];
        for (let i = 0; i < users.length; i++) {
            const u: any = users[i];
            if (currentMembers.includes(u.id)) continue;
            if (addDomain && !u.email.toLowerCase().endsWith(addDomain)) continue;
            if (addYear && u.year !== addYear) continue;
            if (qq) {
                const hay = `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(qq)) continue;
            }
            out.push(u);
        }
        return out;
    }, [users, group, addQ, addDomain, addYear]);

    const pickedIds = React.useMemo(() => {
        if (pick.mode === "some") return Array.from(pick.picked);
        if (pick.mode === "allFiltered") {
            const ids: string[] = [];
            for (const u of candidates as any[]) if (!pick.excluded.has(u.id)) ids.push(u.id);
            return ids;
        }
        return [];
    }, [pick, candidates]);

    const addSelected = React.useCallback(() => {
        if (!group || !pickedIds.length) return;
        pickedIds.forEach((uid) => addUserToGroup(uid, group.id));
        setPick(clearSelection());
    }, [group, pickedIds, addUserToGroup]);

    // header select-all (members)
    const memberIds = React.useMemo(() => filteredMembers.map((u: any) => u.id), [filteredMembers]);

    const membersSelectedCount = React.useMemo(() => {
        if (selMembers.mode === "none") return 0;
        if (selMembers.mode === "some") {
            let c = 0;
            for (const id of memberIds) if (selMembers.picked.has(id)) c++;
            return c;
        }
        return memberIds.length - Array.from(selMembers.excluded).filter((id) => memberIds.includes(id)).length;
    }, [selMembers, memberIds]);

    const membersHeaderChecked = membersSelectedCount > 0 && membersSelectedCount === memberIds.length;
    const membersHeaderIndeterminate = membersSelectedCount > 0 && membersSelectedCount < memberIds.length;

    React.useEffect(() => {
        if (membersHeaderRef.current) membersHeaderRef.current.indeterminate = membersHeaderIndeterminate;
    }, [membersHeaderIndeterminate]);

    const toggleSelectAllMembers = () => {
        if (membersHeaderChecked) setSelMembers(clearSelection());
        else setSelMembers(selectAllFiltered());
    };

    const removeSelectedMembers = () => {
        if (!group) return;
        const ids: string[] =
            selMembers.mode === "some"
                ? Array.from(selMembers.picked)
                : selMembers.mode === "allFiltered"
                    ? filteredMembers.filter((u: any) => !selMembers.excluded.has(u.id)).map((u: any) => u.id)
                    : [];
        if (!ids.length) return;
        if (!confirm(`Remove ${ids.length} member(s) from "${group.name}" ?`)) return;
        ids.forEach((uid) => removeUserFromGroup(uid, group.id));
        setSelMembers(clearSelection());
    };

    if (!group) return <div className="text-sm text-rose-600">Group not found.</div>;

    return (
        <div className="grid grid-cols-12 gap-4">
            {/* Left: current members */}
            <div className="col-span-12 xl:col-span-7">
                <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Members</div>
                    <button
                        className="rounded-lg border px-3 py-1 text-sm"
                        onClick={removeSelectedMembers}
                        disabled={selMembers.mode === "none" || (selMembers.mode === "some" && selMembers.picked.size === 0)}
                    >
                        Remove selected
                    </button>
                </div>

                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search name / studentId / email…"
                        className="w-64 rounded-lg border px-3 py-2 text-sm"
                    />
                    <select
                        value={domain ?? ""}
                        onChange={(e) => setDomain(e.target.value || undefined)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        <option value="">All domains</option>
                        {domains.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                    <select
                        value={year ?? ""}
                        onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        <option value="">All years</option>
                        {[1, 2, 3, 4, 5].map((y) => (
                            <option key={y} value={y}>
                                Year {y}
                            </option>
                        ))}
                    </select>
                    <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={activeOnly} onChange={(e) => setActiveOnly(e.currentTarget.checked)} />
                        Active only
                    </label>
                </div>

                <div className="rounded-xl border overflow-x-auto">
                    <div className="min-w-[880px]">
                        <div className="grid grid-cols-12 border-b text-left text-sm">
                            <div className="col-span-1 px-2 py-2">
                                <label className="inline-flex items-center gap-2">
                                    <input
                                        ref={membersHeaderRef}
                                        type="checkbox"
                                        checked={membersHeaderChecked}
                                        onChange={toggleSelectAllMembers}
                                    />
                                    <span></span>
                                </label>
                            </div>
                            <div className="col-span-4 px-2 py-2">Name / StudentID</div>
                            <div className="col-span-4 px-2 py-2">Email</div>
                            <div className="col-span-1 px-2 py-2">Year</div>
                            <div className="col-span-2 px-2 py-2">Actions</div>
                        </div>

                        <VirtualTable
                            items={filteredMembers}
                            rowHeight={44}
                            renderRow={({ item }) => {
                                const u = item as any;
                                return (
                                    <div className="grid grid-cols-12 items-center border-b text-sm">
                                        <div className="col-span-1 px-2 py-2">
                                            <input type="checkbox" checked={isSelected(u.id, selMembers)} onChange={handleCheck(u.id, setSelMembers)} />
                                        </div>
                                        <div className="col-span-4 px-2 py-2">
                                            <div className="font-medium">{u.fullName}</div>
                                            <div className="text-xs text-gray-500">ID: {u.studentId}</div>
                                        </div>
                                        <div className="col-span-4 px-2 py-2">{u.email}</div>
                                        <div className="col-span-1 px-2 py-2">{u.year}</div>
                                        <div className="col-span-2 px-2 py-2">
                                            <div className="flex items-center gap-2">
                                                <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => toggleUserActive(u.id)}>
                                                    {u.active ? "Deactivate" : "Activate"}
                                                </button>
                                                <button className="rounded-lg border px-2 py-1 text-xs" onClick={() => removeUserFromGroup(u.id, group.id)}>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Right: add users */}
            <div className="col-span-12 xl:col-span-5">
                <div className="mb-2 text-sm font-medium">
                    Add users to <span className="font-semibold">{group.name}</span>
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    <input
                        value={addQ}
                        onChange={(e) => setAddQ(e.target.value)}
                        placeholder="Search candidates…"
                        className="w-64 rounded-lg border px-3 py-2 text-sm"
                    />
                    <select
                        value={addDomain ?? ""}
                        onChange={(e) => setAddDomain(e.target.value || undefined)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        <option value="">All domains</option>
                        {domains.map((d) => (
                            <option key={d} value={d}>
                                {d}
                            </option>
                        ))}
                    </select>
                    <select
                        value={addYear ?? ""}
                        onChange={(e) => setAddYear(e.target.value ? Number(e.target.value) : undefined)}
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        <option value="">All years</option>
                        {[1, 2, 3, 4, 5].map((y) => (
                            <option key={y} value={y}>
                                Year {y}
                            </option>
                        ))}
                    </select>

                    <button className="ml-auto rounded-lg border px-3 py-1 text-sm" onClick={() => setPick(selectAllFiltered())} disabled={!candidates.length}>
                        Select all
                    </button>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setPick(clearSelection())}>
                        Clear
                    </button>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={addSelected} disabled={!pickedIds.length}>
                        Add selected
                    </button>
                </div>

                <div className="rounded-xl border overflow-x-auto">
                    <div className="min-w-[720px]">
                        <div className="grid grid-cols-12 border-b text-left text-sm">
                            <div className="col-span-1 px-2 py-2">Sel</div>
                            <div className="col-span-5 px-2 py-2">User / StudentID</div>
                            <div className="col-span-4 px-2 py-2">Email</div>
                            <div className="col-span-2 px-2 py-2">Year</div>
                        </div>
                        <VirtualTable
                            items={candidates}
                            rowHeight={44}
                            renderRow={({ item }) => {
                                const u = item as any;
                                return (
                                    <div className="grid grid-cols-12 items-center border-b text-sm">
                                        <div className="col-span-1 px-2 py-2">
                                            <input type="checkbox" checked={isSelected(u.id, pick)} onChange={handleCheck(u.id, setPick)} />
                                        </div>
                                        <div className="col-span-5 px-2 py-2">
                                            <div className="font-medium">{u.fullName}</div>
                                            <div className="text-xs text-gray-500">ID: {u.studentId}</div>
                                        </div>
                                        <div className="col-span-4 px-2 py-2">{u.email}</div>
                                        <div className="col-span-2 px-2 py-2">{u.year}</div>
                                    </div>
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* -------------------- Main: GroupManager -------------------- */
export default function GroupManager() {
    const db = useDB();

    const groups = Array.isArray(db.groups) ? db.groups.filter(Boolean) : [];
    const users = Array.isArray(db.users) ? db.users : [];
    const createGroup = db.createGroup;
    const deleteGroup = db.deleteGroup;
    const deleteGroupsMany = db.deleteGroupsMany;
    const setGroupTokenLimit = db.setGroupTokenLimit;

    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const [search, setSearch] = React.useState("");
    const [sel, setSel] = React.useState<SelectionState>(clearSelection());
    const [editingGroupId, setEditingGroupId] = React.useState<string | null>(null);

    const filteredGroups = React.useMemo(() => {
        const arr = groups;
        const q = search.trim().toLowerCase();
        if (!q) return arr;
        return arr.filter(
            (g: any) =>
                String(g?.name ?? "").toLowerCase().includes(q) ||
                String(g?.description ?? "").toLowerCase().includes(q),
        );
    }, [groups, search]);

    const selectedGroupIds = React.useMemo(() => {
        if (sel.mode === "some") return Array.from(sel.picked);
        if (sel.mode === "allFiltered") {
            const result: string[] = [];
            for (const g of filteredGroups)
                if (!sel.excluded.has((g as any)?.id)) result.push((g as any).id);
            return result;
        }
        return [];
    }, [sel, filteredGroups]);

    const handleCreate = (v: GroupFormValues) => {
        createGroup({
            name: v.name,
            description: v.description,
            tokenLimit: typeof v.tokenLimit === "number" ? v.tokenLimit : undefined,
        });
    };

    const bulkDelete = () => {
        if (!selectedGroupIds.length) return;
        if (!confirm(`Delete ${selectedGroupIds.length} group(s)?`)) return;
        deleteGroupsMany(selectedGroupIds);
        setSel(clearSelection());
    };

    return (
        <Section
            title="Groups"
            actions={
                <details className="relative">
                    <summary className="cursor-pointer rounded-lg border px-3 py-1 text-sm">New Group</summary>
                    <div className="absolute right-0 z-10 mt-2 w-[340px] rounded-xl border bg-white p-4 shadow-lg">
                        <GroupForm onSubmit={handleCreate} />
                    </div>
                </details>
            }
        >
            {/* top bar (แทน SearchAndFilterBar) */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setSel(clearSelection());
                    }}
                    placeholder="Search groups..."
                    className="w-64 rounded-lg border px-3 py-2 text-sm"
                />
                <div className="ml-auto flex items-center gap-2">
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setSel(selectAllFiltered())} disabled={!filteredGroups.length}>
                        Select all
                    </button>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={() => setSel(clearSelection())}>
                        Clear
                    </button>
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={bulkDelete} disabled={!selectedGroupIds.length}>
                        Delete selected
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {(filteredGroups ?? []).filter(Boolean).map((g: any, idx: number) => {
                    const memberIds: string[] = Array.isArray(g?.members) ? g.members : [];
                    const uniqueMemberIds = Array.from(new Set(memberIds));
                    const previewIds = uniqueMemberIds.slice(0, 10);

                    return (
                        <div key={g?.id ?? idx} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={g?.id ? isSelected(g.id, sel) : false}
                                        onChange={g?.id ? handleCheck(g.id, setSel) : undefined}
                                    />
                                    <span className="font-medium">{g?.name ?? "(no name)"}</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <button className="rounded-lg border px-2 py-1 text-sm" onClick={() => g?.id && setEditingGroupId(g.id)}>
                                        Edit Members
                                    </button>
                                    <button className="rounded-lg border px-2 py-1 text-sm" onClick={() => g?.id && deleteGroup(g.id)}>
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                Updated{" "}
                                <time dateTime={g?.updatedAt ?? ""} suppressHydrationWarning>
                                    {mounted ? new Date(g?.updatedAt ?? Date.now()).toLocaleString() : ""}
                                </time>
                            </p>

                            {/* Token limit */}
                            <div className="mt-4">
                                <p className="mb-2 text-sm font-medium">Token limit</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={0}
                                        step={1}
                                        defaultValue={Number.isFinite(g?.tokenLimit) ? g.tokenLimit : 0}
                                        className="w-32 rounded-lg border px-2 py-1 text-sm"
                                        onBlur={(e) => {
                                            const val = parseInt(e.currentTarget.value || "0", 10);
                                            if (g?.id) setGroupTokenLimit(g.id, isNaN(val) ? 0 : val);
                                        }}
                                    />
                                    <span className="text-xs text-gray-500">tokens</span>
                                </div>
                            </div>

                            {/* members preview */}
                            <div className="mt-4">
                                <p className="mb-2 text-sm font-medium">Members ({uniqueMemberIds.length})</p>
                                <div className="flex flex-wrap gap-2">
                                    {previewIds.map((uid, i) => {
                                        const u = (users as any[]).find((x) => x.id === uid);
                                        if (!u) return null;
                                        return (
                                            <span key={`${g?.id ?? "g"}-${uid}-${i}`} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm">
                                                {u.fullName}
                                                <span className="text-xs text-gray-500">({u.email})</span>
                                            </span>
                                        );
                                    })}
                                    {uniqueMemberIds.length > 10 && (
                                        <span className="text-xs text-gray-500">+{uniqueMemberIds.length - 10} more</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {!filteredGroups.length && <p className="text-sm text-gray-500">No groups match your search.</p>}
            </div>

            {/* modal */}
            <EditMembersModal open={!!editingGroupId} onClose={() => setEditingGroupId(null)} groupId={editingGroupId} />
        </Section>
    );
}

