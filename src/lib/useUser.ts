/* eslint-disable @typescript-eslint/no-explicit-any */
// example: src/lib/useUser.ts
"use client";
import { useEffect, useState } from "react";

export function useUser() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        (async () => {
            const res = await fetch("/api/me"); // ทำ endpoint คืนค่า session user จาก prism_session
            if (res.ok) {
                setUser(await res.json());
            }
        })();
    }, []);

    return user;
}
