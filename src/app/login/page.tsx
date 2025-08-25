// src/app/login/page.tsx
"use client";
import * as React from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = React.useState("admin@udru.ac.th");
    const [password, setPassword] = React.useState("admin123");
    const [error, setError] = React.useState<string | null>(null);
    const [loading, setLoading] = React.useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await fetch("/api/auth/signin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j?.error === "INVALID_CREDENTIALS" ? "Invalid credentials" : "Sign in failed");
                setLoading(false);
                return;
            }
            router.replace("/"); // HOME
        } catch (e) {
            setError(`Request failed: ${e}`);
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto mt-16 w-full max-w-md rounded-2xl border bg-white p-6 shadow-sm">
            <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
            <form className="grid gap-3" onSubmit={onSubmit}>
                <label className="text-sm">
                    Email
                    <input
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        required
                    />
                </label>
                <label className="text-sm">
                    Password
                    <input
                        className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        required
                    />
                </label>
                {error && <p className="text-sm text-rose-600">{error}</p>}
                <button
                    className="mt-2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign in"}
                </button>
            </form>
            <p className="mt-4 text-xs text-gray-500">
                Demo: admin <b>admin@udru.ac.th</b> / <b>admin123</b>
            </p>
        </div>
    );
}
