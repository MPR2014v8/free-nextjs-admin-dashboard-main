"use client";

import React from "react";
import Section from "@/components/admin/Section";
import SearchAndFilterBar from "@/components/admin/common/SearchAndFilterBar";
import { useDB } from "@/lib/mockDb";
import {
    clearSelection,
    isSelected,
    selectAllFiltered,
    toggleOne,
    SelectionState,
} from "@/components/admin/common/selection";

/** สไตล์ตารางกลาง */
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

/** อ่าน checked ก่อน แล้วค่อยอัปเดต selection */
const handleCheck =
    (id: string, setSel: React.Dispatch<React.SetStateAction<SelectionState>>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSel((s) => toggleOne(id, e.currentTarget.checked, s));
        };

/* ---------------- New User Modal (ย่อ) ---------------- */
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
                    <button className="rounded-lg border px-3 py-1 text-sm" onClick={onClose}>
                        Close
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

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
    const [major, setMajor] = React.useState("");
    const [faculty, setFaculty] = React.useState("");
    const [year, setYear] = React.useState(1);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^\d{11}$/.test(studentId)) {
            alert("Student ID ต้องเป็นตัวเลข 11 หลัก");
            return;
        }
        onSubmit({
            fullName: fullName.trim(),
            studentId: studentId.trim(),
            email: email.trim(),
            major: major.trim(),
            faculty: faculty.trim(),
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
                    required
                />
            </label>
            <label className="text-sm">
                Student ID (11 digits)
                <input
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    inputMode="numeric"
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
                    required
                />
            </label>
            <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                    Major
                    <input
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        value={major}
                        onChange={(e) => setMajor(e.target.value)}
                        required
                    />
                </label>
                <label className="text-sm">
                    Faculty
                    <input
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        value={faculty}
                        onChange={(e) => setFaculty(e.target.value)}
                        required
                    />
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
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                >
                    Create
                </button>
            </div>
        </form>
    );
}

/* ---------------- Main ---------------- */
export default function UserManager() {
    const db = useDB();
    const { users, setUsersActiveMany, toggleUserActive } = db;

    // filters
    const [search, setSearch] = React.useState("");
    const [groupId, setGroupId] = React.useState<string | undefined>(undefined);
    const [domain, setDomain] = React.useState<string | undefined>(undefined);

    // selection
    const [sel, setSel] = React.useState<SelectionState>(clearSelection());

    // modal
    const [openNew, setOpenNew] = React.useState(false);

    /* ---------- filter ---------- */
    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase();
        const arr: typeof users = [];
        for (let i = 0; i < users.length; i++) {
            const u = users[i];
            if (groupId && !u.groups.includes(groupId)) continue;
            if (domain && !u.email.toLowerCase().endsWith(domain.toLowerCase())) continue;
            if (q) {
                const hay = `${u.fullName} ${u.studentId} ${u.email} ${u.major} ${u.faculty}`.toLowerCase();
                if (!hay.includes(q)) continue;
            }
            arr.push(u);
        }
        return arr;
    }, [users, search, groupId, domain]);

    /* ---------- header checkbox ---------- */
    const selectedIds = React.useMemo(() => {
        if (sel.mode === "some") return Array.from(sel.picked);
        if (sel.mode === "allFiltered") {
            const res: string[] = [];
            for (const u of filtered) if (!sel.excluded.has(u.id)) res.push(u.id);
            return res;
        }
        return [];
    }, [sel, filtered]);

    const headerCb = useHeaderCheckbox(
        selectedIds.length,
        filtered.length,
        () => {
            const all = selectedIds.length === filtered.length && filtered.length > 0;
            setSel(all ? clearSelection() : selectAllFiltered());
        },
    );

    /* ---------- bulk ---------- */
    const doBulkActive = (active: boolean) => {
        if (!selectedIds.length) return;
        if (!confirm(`${active ? "Activate" : "Deactivate"} ${selectedIds.length} user(s)?`)) return;
        setUsersActiveMany(selectedIds, active);
        setSel(clearSelection());
    };

    const doBulkDelete = () => {
        if (!selectedIds.length) return;
        if (!confirm(`Delete ${selectedIds.length} user(s)?`)) return;
        if (typeof (db as any).deleteUsersMany === "function") {
            (db as any).deleteUsersMany(selectedIds);
            setSel(clearSelection());
        } else {
            alert("mockDb ยังไม่มี deleteUsersMany");
        }
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
            alert("mockDb ยังไม่มี createUser");
        }
    };

    return (
        <Section
            title="Users"
            actions={
                <div className="flex items-center gap-2">
                    <button
                        className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white shadow-sm hover:bg-emerald-700"
                        onClick={() => setOpenNew(true)}
                    >
                        New User
                    </button>
                    <button
                        className={`rounded-lg px-3 py-1 text-sm text-white shadow-sm transition ${selectedIds.length ? "bg-blue-600 hover:bg-blue-700" : "cursor-not-allowed bg-blue-400 opacity-60"}`}
                        onClick={() => doBulkActive(true)}
                        disabled={!selectedIds.length}
                    >
                        Activate
                    </button>
                    <button
                        className={`rounded-lg px-3 py-1 text-sm text-yellow-950 shadow-sm transition ${selectedIds.length ? "bg-yellow-400 hover:bg-yellow-500" : "cursor-not-allowed bg-yellow-200 opacity-60"}`}
                        onClick={() => doBulkActive(false)}
                        disabled={!selectedIds.length}
                    >
                        Deactivate
                    </button>
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

            {/* ---------- Table (styled) ---------- */}
            <AdminCardTable minWidth={1024}>
                <Table>
                    <TableHeader className="border-b border-gray-100 dark:border-white/10">
                        <TableRow>
                            <TableCell isHeader className="w-10 px-4 py-3">
                                <input type="checkbox" ref={headerCb.ref} checked={headerCb.checked} onChange={headerCb.onChange} />
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                User
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                Major / Faculty
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                Year
                            </TableCell>
                            <TableCell isHeader className="px-5 py-3 text-start text-gray-500 text-theme-xs">
                                Active
                            </TableCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-gray-100 dark:divide-white/10">
                        {filtered.map((u) => (
                            <TableRow key={u.id}>
                                <TableCell className="w-10 px-4 py-3">
                                    <input type="checkbox" checked={isSelected(u.id, sel)} onChange={handleCheck(u.id, setSel)} />
                                </TableCell>
                                <TableCell className="px-5 py-4">
                                    <UserCell title={u.fullName} subtitle={`ID: ${u.studentId} · ${u.email}`} />
                                </TableCell>
                                <TableCell className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                    <div>{u.major}</div>
                                    <div className="text-[12px] text-gray-500 dark:text-gray-400">{u.faculty}</div>
                                </TableCell>
                                <TableCell className="px-5 py-4">{u.year}</TableCell>
                                <TableCell className="px-5 py-4">
                                    <button
                                        className="rounded-full px-3 py-1 text-xs ring-1 transition border-0
                      data-[on=true]:bg-emerald-50 data-[on=true]:text-emerald-700 data-[on=true]:ring-emerald-200
                      data-[on=false]:bg-rose-50   data-[on=false]:text-rose-700   data-[on=false]:ring-rose-200"
                                        data-on={u.active}
                                        onClick={() => toggleUserActive(u.id)}
                                    >
                                        {u.active ? "Active" : "Inactive"}
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </AdminCardTable>

            {/* modal */}
            <Modal open={openNew} onClose={() => setOpenNew(false)} title="New User">
                <NewUserForm onSubmit={createUserThenClose} />
            </Modal>
        </Section>
    );
}
