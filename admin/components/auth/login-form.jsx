"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
    Eye,
    EyeOff,
    LockKeyhole,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const LOGIN_ERROR =
    "Không thể đăng nhập. Kiểm tra thông tin, xác minh email và quyền tài khoản.";

export function LoginForm({ forgotPasswordUrl }) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);

        setIsPending(true);
        setError("");
        try {
            const result = await signIn("credentials", {
                email: formData.get("email"),
                password: formData.get("password"),
                redirect: false,
                redirectTo: "/dashboard",
            });

            if (result?.error || result?.code) {
                throw new Error(LOGIN_ERROR);
            }

            router.replace(result?.url || "/dashboard");
            router.refresh();
        } catch {
            setError(LOGIN_ERROR);
            setIsPending(false);
        }
    }

    return (
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <label className="text-sm font-semibold" htmlFor="email">
                    Email công việc
                </label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@metruyenchu.vn"
                    autoComplete="username"
                    required
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                    <label
                        className="text-sm font-semibold"
                        htmlFor="password"
                    >
                        Mật khẩu
                    </label>
                    <a
                        className="text-xs font-semibold text-accent hover:text-accent-strong"
                        href={forgotPasswordUrl}
                    >
                        Quên mật khẩu?
                    </a>
                </div>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Nhập mật khẩu"
                        className="pr-12"
                        autoComplete="current-password"
                        required
                    />
                    <button
                        type="button"
                        className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground"
                        onClick={() => setShowPassword((current) => !current)}
                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
            </div>

            {error ? (
                <p className="text-sm leading-6 text-danger" role="alert">
                    {error}
                </p>
            ) : null}

            <Button className="w-full" disabled={isPending} type="submit">
                {isPending ? (
                    <span
                        className="size-4 animate-spin rounded-full border-2 border-white/35 border-t-white"
                        aria-hidden="true"
                    />
                ) : (
                    <LockKeyhole size={17} />
                )}
                <span>{isPending ? "Đang xác thực" : "Đăng nhập"}</span>
            </Button>
        </form>
    );
}
