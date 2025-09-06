"use client";
import React from "react";
import { useDB } from "@/lib/adminDb";

export default function SearchAndFilterBar({
    search,
    onSearch,
    groupId,
    onGroupChange,
    domain,
    onDomainChange,
    placeholder = "Search…",
    showGroupFilter = true,
    showDomainFilter = true,
    extraActions,
}: {
    search: string;
    onSearch: (v: string) => void;
    groupId?: string;
    onGroupChange?: (id: string | undefined) => void;
    domain?: string;
    onDomainChange?: (d: string | undefined) => void;
    placeholder?: string;
    showGroupFilter?: boolean;
    showDomainFilter?: boolean;
    extraActions?: React.ReactNode;
}) {
    const { groups, users } = useDB();

    // คำนวณโดเมนจาก users จริง
    const domains = React.useMemo(() => {
        const s = new Set<string>();
        for (const u of users) {
            const at = u.email.includes("@")
                ? u.email.slice(u.email.indexOf("@")).toLowerCase()
                : "";
            if (at) s.add(at);
        }
        return Array.from(s).sort();
    }, [users]);

    return (
        <div className="flex flex-wrap items-center gap-2">
            <input
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                placeholder={placeholder}
                className="w-64 rounded-lg border px-3 py-2 text-sm"
            />

            {showGroupFilter && (
                <select
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={groupId ?? ""}
                    onChange={(e) => onGroupChange?.(e.target.value || undefined)}
                >
                    <option value="">All groups</option>
                    {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                            {g.name}
                        </option>
                    ))}
                </select>
            )}

            {showDomainFilter && (
                <select
                    className="rounded-lg border px-3 py-2 text-sm"
                    value={domain ?? ""}
                    onChange={(e) => onDomainChange?.(e.target.value || undefined)}
                >
                    <option value="">All domains</option>
                    {domains.map((d) => (
                        <option key={d} value={d}>
                            {d}
                        </option>
                    ))}
                </select>
            )}

            <div className="ml-auto flex items-center gap-2">{extraActions}</div>
        </div>
    );
}
