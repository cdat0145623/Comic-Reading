"use client";

import Link from "next/link";
import { useState } from "react";
import { publishAuthInvalidation } from "@/app/_lib/auth-session-sync";
import { notify } from "@/lib/toaster";
import SpinnerMini from "@/app/_component/SpinnerMini";
import { authShellStyles } from "./AuthStatusContent";

export default function ResetPasswordForm({ token }) {
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [success, setSuccess] = useState(false);
    const [pending, setPending] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setPending(true);
        const response = await fetch("/api/auth/password/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, password }),
        });
        const data = await response.json();
        setSuccess(response.ok);
        setMessage(response.ok ? "Mật khẩu đã được cập nhật." : data.error);
        if (response.ok) {
            publishAuthInvalidation(data.reason || "password-reset");
            notify({
                type: "success",
                message: "Mật khẩu đã được cập nhật. Hãy đăng nhập lại.",
            });
        }
        setPending(false);
    }

    return (
        <form onSubmit={submit}>
            {!success && (
                <>
                    <label className="block text-sm font-semibold" htmlFor="new-password">Mật khẩu mới</label>
                    <input
                        id="new-password"
                        type="password"
                        required
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="mt-2 min-h-11 w-full border border-gray-300 px-3 outline-none focus:border-primary"
                    />
                    <p className="app-muted mt-2 text-xs">Ít nhất 8 ký tự, gồm một chữ in hoa và một chữ số.</p>
                    <button disabled={pending || !token} className="mt-5 inline-flex min-h-11 min-w-44 items-center justify-center bg-primary px-5 font-semibold text-white disabled:cursor-wait disabled:opacity-60">
                        {pending ? <SpinnerMini /> : "Cập nhật mật khẩu"}
                    </button>
                </>
            )}
            {message && <p className={`mt-4 text-sm ${success ? "text-green-700" : "text-red-600"}`}>{message}</p>}
            {success && <Link href="/login?passwordChanged=1" className={`${authShellStyles.primaryAction} mt-5`}>Đăng nhập</Link>}
        </form>
    );
}
