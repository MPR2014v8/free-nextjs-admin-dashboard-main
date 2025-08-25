/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import React from "react";
import Section from "@/components/admin/Section";
import { useDB } from "@/lib/mockDb";
import SearchAndFilterBar from "@/components/admin/common/SearchAndFilterBar";
import { VirtualTable } from "@/components/admin/common/VirtualTable";
import {
    clearSelection,
    isSelected,
    selectAllFiltered,
    toggleOne,
    SelectionState,
} from "@/components/admin/common/selection";
import { FACULTIES, MAJORS_BY_FACULTY } from "@/lib/mockData";

const handleCheck =
    (id: string, setSel: React.Dispatch<React.SetStateAction<SelectionState>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const checked = e.target.checked;
            setSel((s) => toggleOne(id, checked, s));
        };

/* ---------------- Reusable Modal ---------------- */
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
            <div className="relative z-[71] w-full max-w-xl rounded-2xl border bg-white p-4 shadow-xl">
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

/* ---------------- New User Form ---------------- */
function NewUserForm({
    onSubmit,
}: {
    onSubmit: (v: {
        fullName: string;
        studentId: string;
        email: string;
        major: string;
        faculty: string;
        year: number;
    }) => void;
}) {
    const [fullName, setFullName] = React.useState("");
    const [studentId, setStudentId] = React.useState("");
    const [email, setEmail] = React.useState("");

    const [faculty, setFaculty] = React.useState<(typeof FACULTIES)[number]>(
        FACULTIES[0],
    );
    const majors = MAJORS_BY_FACULTY[faculty] ?? [];
    const [major, setMajor] = React.useState<string>(majors[0] ?? "");
    const [year, setYear] = React.useState<number>(1);

    React.useEffect(() => {
        const list = MAJORS_BY_FACULTY[faculty] ?? [];
        setMajor(list[0] ?? "");
    }, [faculty]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const sid = studentId.trim();
        if (!/^\d{11}$/.test(sid)) {
            alert("รหัสนักศึกษาต้องเป็นตัวเลข 11 หลัก เช่น 64040249107");
            return;
        }
        if (!fullName.trim() || !email.trim()) {
            alert("กรอกชื่อและอีเมลให้ครบก่อนนะครับ");
            return;
        }
        onSubmit({
            fullName: fullName.trim(),
            studentId: sid,
            email: email.trim(),
            major: major.trim(),
            faculty: faculty,
            year,
        });
    };

    return (
        <form className="grid gap-3" onSubmit={submit}>
            <label className="text-sm">
                Full name
                <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="เช่น สมชาย ใจดี"
                    required
                />
            </label>

            <label className="text-sm">
                Student ID (11 digits)
                <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={studentId}
                    onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 11);
                        setStudentId(v);
                    }}
                    inputMode="numeric"
                    placeholder="64040249107"
                    required
                />
            </label>

            <label className="text-sm">
                Email
                <input
                    type="email"
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="เช่น stu64040249107@udru.ac.th"
                    required
                />
            </label>

            <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                    Faculty
                    <select
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        value={faculty}
                        onChange={(e) =>
                            setFaculty(e.target.value as (typeof FACULTIES)[number])
                        }
                    >
                        {FACULTIES.map((f) => (
                            <option key={f} value={f}>
                                {f}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="text-sm">
                    Major
                    <select
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                    >
                        {(MAJORS_BY_FACULTY[faculty] ?? []).map((m) => (
                            <option key={m} value={m}>
                                {m}
                            </option>
                        ))}
                    </select>
                </label>
            </div>

            <label className="text-sm">
                Year
                <select
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                >
                    {[1, 2, 3, 4, 5].map((y) => (
                        <option key={y} value={y}>
                            Year {y}
                        </option>
                    ))}
                </select>
            </label>

            <div className="mt-2 flex items-center justify-end gap-2">
                <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                    Create
                </button>
            </div>
        </form>
    );
}

/* ---------------- Main: UserManager ---------------- */
export default function UserManager() {
    const db = useDB();
    const { users, setUsersActiveMany, toggleUserActive } = db;

    // filters
    const [search, setSearch] = React.useState("");
    const [groupId, setGroupId] = React.useState<string | undefined>(undefined);
    const [domain, setDomain] = React.useState<string | undefined>(undefined);

    // selection
    const [sel, setSel] = React.useState<SelectionState>(clearSelection());

    // modal: new user
    const [openNew, setOpenNew] = React.useState(false);

    /* ---------- Filter ---------- */
    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        const arr: typeof users = [];
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (groupId && !u.groups.includes(groupId)) continue;
            if (domain && !u.email.toLowerCase().endsWith(domain.toLowerCase()))
                continue;
            if (q) {
                const hay =
                    `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }
            arr.push(u);
        }
        return arr;
    }, [users, search, groupId, domain]);

    /* ---------- Header Select All ---------- */
    const rowIds = React.useMemo(() => filtered.map((u) => u.id), [filtered]);

    const selectedCount = React.useMemo(() => {
        if (sel.mode === "none") return 0;
        if (sel.mode === "some") {
            let c = 0;
            for (const id of rowIds) if (sel.picked.has(id)) c++;
            return c;
        }
        return (
            rowIds.length -
            Array.from(sel.excluded).filter((id) => rowIds.includes(id)).length
        );
    }, [sel, rowIds]);

    const headerChecked = selectedCount > 0 && selectedCount === rowIds.length;
    const headerIndeterminate =
        selectedCount > 0 && selectedCount < rowIds.length;

    const headerRef = React.useRef<HTMLInputElement>(null);
    React.useEffect(() => {
        if (headerRef.current)
            headerRef.current.indeterminate = headerIndeterminate;
    }, [headerIndeterminate]);

    const toggleSelectAll = () => {
        if (headerChecked) setSel(clearSelection());
        else setSel(selectAllFiltered());
    };

    /* ---------- Bulk ---------- */
    const selectedIds = React.useMemo(() => {
        if (sel.mode === "some") return Array.from(sel.picked);
        if (sel.mode === "allFiltered") {
            const res: string[] = [];
            for (const u of filtered) if (!sel.excluded.has(u.id)) res.push(u.id);
            return res;
        }
        return [];
    }, [sel, filtered]);

    const doBulkActive = (active: boolean) => {
        if (!selectedIds.length) return;
        if (
            !confirm(
                `${active ? "Activate" : "Deactivate"} ${selectedIds.length} user(s)?`,
            )
        )
            return;
        setUsersActiveMany(selectedIds, active);
        setSel(clearSelection());
    };

    const doBulkDelete = () => {
        if (!selectedIds.length) return;
        if (
            !confirm(`Delete ${selectedIds.length} user(s)? This cannot be undone.`)
        )
            return;

        const hasDelete = db && typeof (db as any).deleteUsersMany === "function";
        if (!hasDelete) {
            alert(
                "ยังไม่มีฟังก์ชัน deleteUsersMany ใน mockDb.ts\nกรุณาเพิ่ม: deleteUsersMany(ids: ID[]) เพื่อลบผู้ใช้หลายคน",
            );
            return;
        }
        (db as any).deleteUsersMany(selectedIds);
        setSel(clearSelection());
    };

    const createUserThenClose = (v: {
        fullName: string;
        studentId: string;
        email: string;
        major: string;
        faculty: string;
        year: number;
    }) => {
        if (typeof (db as any).createUser === "function") {
            (db as any).createUser(v);
            setOpenNew(false);
        } else {
            alert("ไม่พบฟังก์ชัน createUser ใน mockDb.ts");
        }
    };

    return (
        <Section
            title="Users"
            actions={
                <div className="flex items-center gap-2">
                    {/* New User */}
                    <button
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white shadow-sm hover:bg-emerald-700"
                        onClick={() => setOpenNew(true)}
                    >
                        New User
                    </button>

                    {/* Activate (ฟ้า) */}
                    <button
                        className={`rounded-lg px-3 py-1 text-sm text-white shadow-sm transition ${selectedIds.length ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-blue-400 opacity-60"}`}
                        onClick={() => doBulkActive(true)}
                        disabled={!selectedIds.length}
                    >
                        Activate
                    </button>

                    {/* Deactivate (เหลือง) */}
                    <button
                        className={`rounded-lg px-3 py-1 text-sm text-yellow-950 shadow-sm transition ${selectedIds.length ? "bg-yellow-400 hover:bg-yellow-500" : "cursor-not-allowed bg-yellow-200 opacity-60"}`}
                        onClick={() => doBulkActive(false)}
                        disabled={!selectedIds.length}
                    >
                        Deactivate
                    </button>

                    {/* Delete (แดง) */}
                    <button
                        className={`rounded-lg px-3 py-1 text-sm text-white shadow-sm transition ${selectedIds.length ? "bg-rose-600 hover:bg-rose-700" : "cursor-not-allowed bg-rose-400 opacity-60"}`}
                        onClick={doBulkDelete}
                        disabled={!selectedIds.length}
                    >
                        Delete
                    </button>
                </div>
            }
        >
            <div className="mb-3">
                <SearchAndFilterBar
                    search={search}
                    onSearch={(v) => {
                        setSearch(v);
                        setSel(clearSelection());
                    }}
                    groupId={groupId}
                    onGroupChange={(gid) => {
                        setGroupId(gid);
                        setSel(clearSelection());
                    }}
                    domain={domain}
                    onDomainChange={(d) => {
                        setDomain(d);
                        setSel(clearSelection());
                    }}
                    placeholder="Search name, studentId, email, major, faculty..."
                    showGroupFilter
                    showDomainFilter
                />
            </div>

            <div className="rounded-xl border">
                <div className="grid grid-cols-12 border-b text-left text-sm">
                    {/* Header checkbox: Select All */}
                    <div className="col-span-1 px-2 py-2">
                        <label className="inline-flex items-center gap-2">
                            <input
                                ref={headerRef}
                                type="checkbox"
                                checked={headerChecked}
                                onChange={toggleSelectAll}
                            />
                            <span></span>
                        </label>
                    </div>
                    <div className="col-span-3 px-2 py-2">Name / StudentID</div>
                    <div className="col-span-3 px-2 py-2">Email</div>
                    <div className="col-span-2 px-2 py-2">Major / Faculty</div>
                    <div className="col-span-1 px-2 py-2">Year</div>
                    <div className="col-span-1 px-2 py-2">Active</div>
                    <div className="col-span-1 px-2 py-2"></div>
                </div>

                <VirtualTable
                    items={filtered}
                    rowHeight={48}
                    renderRow={({ item: u }) => (
                        <div className="grid grid-cols-12 items-center border-b text-sm">
                            <div className="col-span-1 px-2 py-2">
                                <input
                                    type="checkbox"
                                    checked={isSelected(u.id, sel)}
                                    onChange={handleCheck(u.id, setSel)}
                                />
                            </div>
                            <div className="col-span-3 px-2 py-2">
                                <div className="font-medium">{u.fullName}</div>
                                <div className="text-xs text-gray-500">ID: {u.studentId}</div>
                            </div>
                            <div className="col-span-3 px-2 py-2">{u.email}</div>
                            <div className="col-span-2 px-2 py-2">
                                <div>{u.major}</div>
                                <div className="text-xs text-gray-500">{u.faculty}</div>
                            </div>
                            <div className="col-span-1 px-2 py-2">{u.year}</div>
                            <div className="col-span-1 px-2 py-2">
                                <button
                                    className="rounded-lg border px-2 py-1 text-xs"
                                    onClick={() => toggleUserActive(u.id)}
                                >
                                    {u.active ? "Yes" : "No"}
                                </button>
                            </div>
                            <div className="col-span-1 px-2 py-2"></div>
                        </div>
                    )}
                />
            </div>

            {/* New user modal */}
            <Modal open={openNew} onClose={() => setOpenNew(false)} title="New User">
                <NewUserForm onSubmit={createUserThenClose} />
            </Modal>
        </Section>
    );
}
