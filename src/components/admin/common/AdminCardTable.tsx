"use client";
import React from "react";
import Image from "next/image";
import Badge from "@/components/ui/badge/Badge";

interface AdminItem {
    id: number;
    user: {
        image: string;
        name: string;
        role: string;
    };
    projectName: string;
    team: {
        images: string[];
    };
    status: "Active" | "Pending" | "Cancel";
    budget: string;
}

const data: AdminItem[] = [
    {
        id: 1,
        user: {
            image: "/images/user/user-17.jpg",
            name: "Lindsey Curtis",
            role: "Web Designer",
        },
        projectName: "Agency Website",
        team: {
            images: [
                "/images/user/user-22.jpg",
                "/images/user/user-23.jpg",
                "/images/user/user-24.jpg",
            ],
        },
        budget: "3.9K",
        status: "Active",
    },
    {
        id: 2,
        user: {
            image: "/images/user/user-18.jpg",
            name: "Kaiya George",
            role: "Project Manager",
        },
        projectName: "Technology",
        team: {
            images: ["/images/user/user-25.jpg", "/images/user/user-26.jpg"],
        },
        budget: "24.9K",
        status: "Pending",
    },
    {
        id: 3,
        user: {
            image: "/images/user/user-20.jpg",
            name: "Abram Schleifer",
            role: "Digital Marketer",
        },
        projectName: "Social Media",
        team: {
            images: [
                "/images/user/user-28.jpg",
                "/images/user/user-29.jpg",
                "/images/user/user-30.jpg",
            ],
        },
        budget: "2.8K",
        status: "Cancel",
    },
];

export default function AdminCardTable() {
    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[900px]">
                    <table className="w-full">
                        {/* Table Header */}
                        <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                            <tr>
                                <th className="px-5 py-3 text-left font-medium text-gray-500 text-sm">
                                    User
                                </th>
                                <th className="px-5 py-3 text-left font-medium text-gray-500 text-sm">
                                    Project
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

                        {/* Table Body */}
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {data.map((item) => (
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
                                                <p className="text-gray-500 text-xs">
                                                    {item.user.role}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Project */}
                                    <td className="px-5 py-4 text-gray-600 dark:text-gray-400">
                                        {item.projectName}
                                    </td>

                                    {/* Team */}
                                    <td className="px-5 py-4">
                                        <div className="flex -space-x-2">
                                            {item.team.images.map((img, index) => (
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
                                        <Badge
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
