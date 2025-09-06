/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";
import { useDB } from "@/lib/adminDb";

const PLACEHOLDER = "/images/user/user-1.jpg";

export default function AdminCardTable() {
    const { users, groups } = useDB();

    const groupById = React.useMemo(
        () => new Map(groups.map((g) => [g.id, g] as const)),
        [groups]
    );

    // เตรียมแถวจาก users จริง (เอา 10 แถวแรกให้ตารางตัวอย่าง)
    const rows = React.useMemo(() => {
        return users.slice(0, 10).map((u) => {
            const firstGroupId = u.groups?.[0] ?? null;
            const g = firstGroupId ? groupById.get(firstGroupId) : undefined;

            // เอาเพื่อนร่วม group/policy เดียวกันมาโชว์ 3 คน
            const mates = firstGroupId
                ? users
                    .filter(
                        (x) => x.id !== u.id && (x.groups ?? []).includes(firstGroupId)
                    )
                    .slice(0, 3)
                : [];

            return {
                id: u.id,
                user: {
                    image: (u as any).image ?? PLACEHOLDER,
                    name: u.fullName ?? u.email,
                    role: u.major ?? "User",
                },
                projectName: g?.name ?? "—",
                teamImages: mates.map((m) => (m as any).image ?? PLACEHOLDER),
                status: (u.active ? "Active" : "Cancel") as "Active" | "Cancel",
                budget: "—",
            };
        });
    }, [users, groupById]);

    if (!rows.length) {
        return (
            <div className="rounded-xl border p-6 text-sm text-gray-500">
                No users yet.
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[900px]">
                    <table className="w-full">
                        <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                            <tr>
                                <th className="px-5 py-3 text-left font-medium text-gray-500 text-sm">
                                    User
                                </th>
                                <th className="px-5 py-3 text-left font-medium text-gray-500 text-sm">
                                    Policy
                                </th>
                                <th className="px-5 py-3 text-left font-medium text-gray-500 text-sm">
                                    Team
                                </th>
                                <th className="px-5 py-3 text-left font-medium text-gray-500 text-sm">
                                    Status
                                </th>
                                <th className="px-5 py-3 text-left font-medium text-gray-500 text-sm">
                                    Budget
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {rows.map((item) => (
                                <tr key={item.id}>
                                    {/* User */}
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 overflow-hidden rounded-full">
                                                <Image
                                                    src={item.user.image}
                                                    alt={item.user.name}
                                                    width={40}
                                                    height={40}
                                                />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-800 dark:text-white">
                                                    {item.user.name}
                                                </p>
                                                <p className="text-gray-500 text-xs">{item.user.role}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Policy */}
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                        {item.projectName}
                                    </td>

                                    {/* Team */}
                                    <td className="px-5 py-4">
                                        <div className="flex -space-x-2">
                                            {item.teamImages.map((img, index) => (
                                                <div
                                                    key={index}
                                                    className="w-7 h-7 overflow-hidden rounded-full border-2 border-white dark:border-gray-800"
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`team-${index}`}
                                                        width={28}
                                                        height={28}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </td>

                                    {/* Status */}
                                    <td className="px-5 py-4">
                                        {/* <Badge
                                            size="sm"
                                            color={
                                                item.status === "Active"
                                                    ? "success"
                                                    : item.status === "Pending"
                                                        ? "warning"
                                                        : "error"
                                            }
                                        >
                                            {item.status}
                                        </Badge> */}
                                        <Badge
                                            size="sm"
                                            color={item.status === "Active" ? "success" : "error"}
                                        >
                                            {item.status}
                                        </Badge>

                                    </td>

                                    {/* Budget */}
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                        {item.budget}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
