"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import SpinnerMini from "@/app/_component/SpinnerMini";

export default function CredentialsLoginForm({ callbackUrl = "/" }) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState("");

    async function submit(event) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setError("");
        try {
            const result = await signIn("credentials", {
                email: form.get("email"),
                password: form.get("password"),
                redirect: false,
                redirectTo: callbackUrl,
            });
            if (result?.error || result?.code) {
                throw new Error("Email hoặc mật khẩu không đúng");
            }
            router.replace(result?.url || callbackUrl);
            router.refresh();
        } catch (submitError) {
            setError(submitError.message || "Không thể đăng nhập");
            setPending(false);
        }
    }

    return (
        <form onSubmit={submit} className="space-y-4">
            <div>
                <label htmlFor="login-email" className="text-sm font-semibold">
                    Email
                </label>
                <input
                    id="login-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="app-panel app-border mt-2 min-h-11 w-full border px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>
            <div>
                <div className="flex items-center justify-between gap-4">
                    <label
                        htmlFor="login-password"
                        className="text-sm font-semibold"
                    >
                        Mật khẩu
                    </label>
                    <a
                        href="/quen-mat-khau"
                        className="text-sm font-medium text-primary"
                    >
                        Quên mật khẩu?
                    </a>
                </div>
                <input
                    id="login-password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="app-panel app-border mt-2 min-h-11 w-full border px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
            </div>
            {error && (
                <p className="text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}
            <button
                disabled={pending}
                className="min-h-11 w-full bg-primary px-5 font-semibold text-white disabled:cursor-wait disabled:opacity-50"
            >
                {pending ? (
                    <span className="flex items-center justify-center">
                        <SpinnerMini />
                        {/* <span className="sr-only">Đang đăng nhập</span> */}
                    </span>
                ) : (
                    "Đăng nhập"
                )}
            </button>
        </form>
    );
}
