/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React from "react";
import Section from "@/components/admin/Section";
import GroupForm, { GroupFormValues } from "./GroupForm";
// import { useDB } from "@/lib/mockDb";
import { usePolicyDB as useDB } from "@/lib/policyDb";
import SearchAndFilterBar from "@/components/admin/common/SearchAndFilterBar";
import { VirtualTable } from "@/components/admin/common/VirtualTable";
import {
    clearSelection,
    isSelected,
    selectAllFiltered,
    toggleOne,
    SelectionState,
} from "@/components/admin/common/selection";

const handleCheck =
    (id: string, setSel: React.Dispatch<React.SetStateAction<SelectionState>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            setSel((s) => toggleOne(id, checked, s));
        };

/* ---------- Reusable Modal ---------- */
function Modal({
    open,
    onClose,
    children,
    title,
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
                    <button
                        className="rounded-lg border px-3 py-1 text-sm"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

/* ---------- EditMembersModal (Wrapper: ไม่มี hooks) ---------- */
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

/* ---------- EditMembersBody (ใส่ hooks ทั้งหมดที่นี่เท่านั้น) ---------- */
function EditMembersBody({ groupId }: { groupId: string }) {
    const {
        groups,
        users,
        addUserToGroup,
        removeUserFromGroup,
        toggleUserActive,
        getAllEmailDomains,
    } = useDB();

    // state + filters (เรียงและคงที่ทุกครั้ง)
    const [q, setQ] = React.useState("");
    const [domain, setDomain] = React.useState<string | undefined>();
    const [year, setYear] = React.useState<number | undefined>();
    const [activeOnly, setActiveOnly] = React.useState(false);

    const [addQ, setAddQ] = React.useState("");
    const [addDomain, setAddDomain] = React.useState<string | undefined>();
    const [addYear, setAddYear] = React.useState<number | undefined>();
    const [pick, setPick] = React.useState<SelectionState>(clearSelection());

    // ✅ selection สำหรับฝั่ง Members
    const [selMembers, setSelMembers] =
        React.useState<SelectionState>(clearSelection());
    const membersHeaderRef = React.useRef<HTMLInputElement>(null);

    const domains = React.useMemo(() => getAllEmailDomains(), [getAllEmailDomains]);

    const group = React.useMemo(
        () => groups.find((gg) => gg.id === groupId) ?? null,
        [groups, groupId],
    );

    const members = React.useMemo(
        () => (group ? users.filter((u) => group.members.includes(u.id)) : []),
        [users, group],
    );

    const filteredMembers = React.useMemo(() => {
        const qq = q.trim().toLowerCase();
        const arr: typeof members = [];
        for (let i = 0; i < members.length; i++) {
            const u = members[i];
            if (domain && !u.email.toLowerCase().endsWith(domain)) continue;
            if (year && u.year !== year) continue;
            if (activeOnly && !u.active) continue;
            if (qq) {
                const hay =
                    `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(qq)) continue;
            }
            arr.push(u);
        }
        return arr;
    }, [members, q, domain, year, activeOnly]);

    const candidates = React.useMemo(() => {
        if (!group) return [];
        const qq = addQ.trim().toLowerCase();
        const arr: typeof users = [];
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (group.members.includes(u.id)) continue;
            if (addDomain && !u.email.toLowerCase().endsWith(addDomain)) continue;
            if (addYear && u.year !== addYear) continue;
            if (qq) {
                const hay =
                    `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(qq)) continue;
            }
            arr.push(u);
        }
        return arr;
    }, [users, group, addQ, addDomain, addYear]);

    const pickedIds = React.useMemo(() => {
        if (pick.mode === "some") return Array.from(pick.picked);
        if (pick.mode === "allFiltered") {
            const res: string[] = [];
            for (const u of candidates) if (!pick.excluded.has(u.id)) res.push(u.id);
            return res;
        }
        return [];
    }, [pick, candidates]);

    const addSelected = React.useCallback(() => {
        if (!group || !pickedIds.length) return;
        pickedIds.forEach((uid) => addUserToGroup(uid, group.id));
        setPick(clearSelection());
    }, [group, pickedIds, addUserToGroup]);

    // ---- Members: Select All header ----
    const memberIds = React.useMemo(
        () => filteredMembers.map((u) => u.id),
        [filteredMembers],
    );

    const membersSelectedCount = React.useMemo(() => {
        if (selMembers.mode === "none") return 0;
        if (selMembers.mode === "some") {
            let c = 0;
            for (const id of memberIds) if (selMembers.picked.has(id)) c++;
            return c;
        }
        return (
            memberIds.length -
            Array.from(selMembers.excluded).filter((id) => memberIds.includes(id))
                .length
        );
    }, [selMembers, memberIds]);

    const membersHeaderChecked =
        membersSelectedCount > 0 && membersSelectedCount === memberIds.length;
    const membersHeaderIndeterminate =
        membersSelectedCount > 0 && membersSelectedCount < memberIds.length;

    React.useEffect(() => {
        if (membersHeaderRef.current)
            membersHeaderRef.current.indeterminate = membersHeaderIndeterminate;
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
                    ? filteredMembers
                        .filter((u) => !selMembers.excluded.has(u.id))
                        .map((u) => u.id)
                    : [];
        if (!ids.length) return;
        if (!confirm(`Remove ${ids.length} member(s) from "${group.name}" ?`))
            return;
        ids.forEach((uid) => removeUserFromGroup(uid, group.id));
        setSelMembers(clearSelection());
    };

    if (!group) {
        return <div className="text-sm text-rose-600">Group not found.</div>;
    }

    return (
        <div className="grid grid-cols-12 gap-4">
            {/* Left: current members */}
            <div className="col-span-12 xl:col-span-7">
                <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Members</div>
                    <button
                        className="rounded-lg border px-3 py-1 text-sm"
                        onClick={removeSelectedMembers}
                        disabled={
                            selMembers.mode === "none" ||
                            (selMembers.mode === "some" && selMembers.picked.size === 0)
                        }
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
                        onChange={(e) =>
                            setYear(e.target.value ? Number(e.target.value) : undefined)
                        }
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
                        <input
                            type="checkbox"
                            checked={activeOnly}
                            onChange={(e) => setActiveOnly(e.currentTarget.checked)}
                        />
                        Active only
                    </label>
                </div>

                <div className="rounded-xl border overflow-x-auto">
                    <div className="min-w-[880px]">
                        <div className="grid grid-cols-12 border-b text-left text-sm">
                            <div className="col-span-1 px-2 py-2">
                                {/* Header select all */}
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
                            renderRow={({ item: u }) => (
                                <div className="grid grid-cols-12 items-center border-b text-sm">
                                    <div className="col-span-1 px-2 py-2">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(u.id, selMembers)}
                                            onChange={handleCheck(u.id, setSelMembers)}
                                        />
                                    </div>
                                    <div className="col-span-4 px-2 py-2">
                                        <div className="font-medium">{u.fullName}</div>
                                        <div className="text-xs text-gray-500">
                                            ID: {u.studentId}
                                        </div>
                                    </div>
                                    <div className="col-span-4 px-2 py-2">{u.email}</div>
                                    <div className="col-span-1 px-2 py-2">{u.year}</div>
                                    <div className="col-span-2 px-2 py-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                className="rounded-lg border px-2 py-1 text-xs"
                                                onClick={() => toggleUserActive(u.id)}
                                            >
                                                {u.active ? "Deactivate" : "Activate"}
                                            </button>
                                            <button
                                                className="rounded-lg border px-2 py-1 text-xs"
                                                onClick={() => removeUserFromGroup(u.id, group.id)}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
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
                        onChange={(e) =>
                            setAddYear(e.target.value ? Number(e.target.value) : undefined)
                        }
                        className="rounded-lg border px-3 py-2 text-sm"
                    >
                        <option value="">All years</option>
                        {[1, 2, 3, 4, 5].map((y) => (
                            <option key={y} value={y}>
                                Year {y}
                            </option>
                        ))}
                    </select>

                    <button
                        className="ml-auto rounded-lg border px-3 py-1 text-sm"
                        onClick={() => setPick(selectAllFiltered())}
                        disabled={!candidates.length}
                    >
                        Select all
                    </button>
                    <button
                        className="rounded-lg border px-3 py-1 text-sm"
                        onClick={() => setPick(clearSelection())}
                    >
                        Clear
                    </button>
                    <button
                        className="rounded-lg border px-3 py-1 text-sm"
                        onClick={addSelected}
                        disabled={!pickedIds.length}
                    >
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
                            renderRow={({ item: u }) => (
                                <div className="grid grid-cols-12 items-center border-b text-sm">
                                    <div className="col-span-1 px-2 py-2">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(u.id, pick)}
                                            onChange={handleCheck(u.id, setPick)}
                                        />
                                    </div>
                                    <div className="col-span-5 px-2 py-2">
                                        <div className="font-medium">{u.fullName}</div>
                                        <div className="text-xs text-gray-500">
                                            ID: {u.studentId}
                                        </div>
                                    </div>
                                    <div className="col-span-4 px-2 py-2">{u.email}</div>
                                    <div className="col-span-2 px-2 py-2">{u.year}</div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Main: GroupManager ---------- */
export default function GroupManager() {
    const {
        groups,
        users,
        createGroup,
        deleteGroup,
        deleteGroupsMany,
        setGroupTokenLimit,
    } = useDB();

    // ป้องกัน hydration mismatch เวลา
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);

    const [search, setSearch] = React.useState("");
    const [sel, setSel] = React.useState<SelectionState>(clearSelection());
    const [editingGroupId, setEditingGroupId] = React.useState<string | null>(
        null,
    );

    const filteredGroups = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return groups;
        return groups.filter(
            (g) =>
                g.name.toLowerCase().includes(q) ||
                (g.description ?? "").toLowerCase().includes(q),
        );
    }, [groups, search]);

    const selectedGroupIds = React.useMemo(() => {
        if (sel.mode === "some") return Array.from(sel.picked);
        if (sel.mode === "allFiltered") {
            const result: string[] = [];
            for (const g of filteredGroups)
                if (!sel.excluded.has(g.id)) result.push(g.id);
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
                    <summary className="cursor-pointer rounded-lg border px-3 py-1 text-sm">
                        New Group
                    </summary>
                    <div className="absolute right-0 z-10 mt-2 w-[340px] rounded-xl border bg-white p-4 shadow-lg">
                        <GroupForm onSubmit={handleCreate} />
                    </div>
                </details>
            }
        >
            <div className="mb-3">
                <SearchAndFilterBar
                    search={search}
                    onSearch={(v) => {
                        setSearch(v);
                        setSel(clearSelection());
                    }}
                    showGroupFilter={false}
                    showDomainFilter={false}
                    placeholder="Search groups..."
                    extraActions={
                        <>
                            <button
                                className="rounded-lg border px-3 py-1 text-sm"
                                onClick={() => setSel(selectAllFiltered())}
                                disabled={!filteredGroups.length}
                            >
                                Select all
                            </button>
                            <button
                                className="rounded-lg border px-3 py-1 text-sm"
                                onClick={() => setSel(clearSelection())}
                            >
                                Clear
                            </button>
                            <button
                                className="rounded-lg border px-3 py-1 text-sm"
                                onClick={bulkDelete}
                                disabled={!selectedGroupIds.length}
                            >
                                Delete selected
                            </button>
                        </>
                    }
                />
            </div>

            <div className="grid gap-4">
                {filteredGroups.map((g) => {

                    const uniqueMemberIds = Array.from(new Set(g.members));
                    const previewIds = uniqueMemberIds.slice(0, 10);

                    return (
                        <div key={g.id} className="rounded-xl border p-4">
                            <div className="flex items-start justify-between gap-3">
                                <label className="flex items-center gap-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={isSelected(g.id, sel)}
                                        onChange={handleCheck(g.id, setSel)}
                                    />
                                    <span className="font-medium">{g.name}</span>
                                </label>

                                <div className="flex items-center gap-2">
                                    <button
                                        className="rounded-lg border px-2 py-1 text-sm"
                                        onClick={() => setEditingGroupId(g.id)}
                                    >
                                        Edit Members
                                    </button>
                                    <button
                                        className="rounded-lg border px-2 py-1 text-sm"
                                        onClick={() => deleteGroup(g.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>

                            <p className="text-xs text-gray-500">
                                Updated{" "}
                                <time dateTime={g.updatedAt} suppressHydrationWarning>
                                    {mounted ? new Date(g.updatedAt).toLocaleString() : ""}
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
                                        defaultValue={g.tokenLimit}
                                        className="w-32 rounded-lg border px-2 py-1 text-sm"
                                        onBlur={(e) => {
                                            const val = parseInt(e.currentTarget.value || "0", 10);
                                            setGroupTokenLimit(g.id, isNaN(val) ? 0 : val);
                                        }}
                                    />
                                    <span className="text-xs text-gray-500">tokens</span>
                                </div>
                            </div>

                            {/* Members preview (dedupe + key safe) */}
                            <div className="mt-4">
                                <p className="mb-2 text-sm font-medium">
                                    Members ({uniqueMemberIds.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {previewIds.map((uid, idx) => {
                                        const u = users.find((x) => x.id === uid);
                                        if (!u) return null;
                                        return (
                                            <span
                                                key={`${g.id}-${uid}-${idx}`}
                                                className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
                                            >
                                                {u.fullName}
                                                <span className="text-xs text-gray-500">
                                                    ({u.email})
                                                </span>
                                            </span>
                                        );
                                    })}
                                    {uniqueMemberIds.length > 10 && (
                                        <span className="text-xs text-gray-500">
                                            +{uniqueMemberIds.length - 10} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {!filteredGroups.length && (
                    <p className="text-sm text-gray-500">No groups match your search.</p>
                )}
            </div>

            {/* Modal */}
            <EditMembersModal
                open={!!editingGroupId}
                onClose={() => setEditingGroupId(null)}
                groupId={editingGroupId}
            />
        </Section>
    );
}
