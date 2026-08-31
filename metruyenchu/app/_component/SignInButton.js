"use client";

import Image from "next/image";
import { signIn } from "next-auth/react";
import { useState } from "react";

function normalizeCallbackUrl(callbackUrl) {
    if (typeof callbackUrl !== "string" || !callbackUrl.startsWith("/")) {
        return "/";
    }
    return callbackUrl.startsWith("//") ? "/" : callbackUrl;
}

function SignInButton({
    callbackUrl = "/",
    className = "",
    label = "Tiếp tục với Google",
}) {
    const [isPending, setIsPending] = useState(false);

    async function handleSignIn() {
        setIsPending(true);
        try {
            await signIn("google", {
                redirectTo: normalizeCallbackUrl(callbackUrl),
            });
        } catch {
            setIsPending(false);
        }
    }

    return (
        <button
            type="button"
            onClick={handleSignIn}
            disabled={isPending}
            className={`flex min-h-11 items-center justify-center gap-3 border border-primary-300 bg-white px-5 py-2.5 font-medium text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-wait disabled:opacity-60 ${className}`}
        >
            <Image
                src="https://authjs.dev/img/providers/google.svg"
                alt=""
                height={22}
                width={22}
            />
            <span>{isPending ? "Đang chuyển..." : label}</span>
        </button>
    );
}

export default SignInButton;
