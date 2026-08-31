"use client";

import { useState } from "react";
import SpinnerMini from "@/app/_component/SpinnerMini";

export default function ForgotPasswordForm() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [pending, setPending] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setPending(true);
        const response = await fetch("/api/auth/password/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        setMessage(data.message || "Vui lòng kiểm tra email của bạn.");
        setPending(false);
    }

    return (
        <form onSubmit={submit}>
            <label className="block text-sm font-semibold" htmlFor="reset-email">Email</label>
            <input
                id="reset-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-11 w-full border border-gray-300 px-3 outline-none focus:border-primary"
            />
            <button disabled={pending} className="mt-5 inline-flex min-h-11 min-w-36 items-center justify-center bg-primary px-5 font-semibold text-white disabled:cursor-wait disabled:opacity-60">
                {pending ? <SpinnerMini /> : "Gửi hướng dẫn"}
            </button>
            {message && <p className="app-muted mt-4 text-sm">{message}</p>}
        </form>
    );
}
