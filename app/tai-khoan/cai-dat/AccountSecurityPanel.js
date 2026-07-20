"use client";

import { useState } from "react";
import SignInButton from "@/app/_component/SignInButton";

function StatusBadge({ active, children }) {
    return (
        <span
            className={`border px-2.5 py-1 text-xs font-medium ${
                active
                    ? "border-green-300 bg-green-50 text-green-700"
                    : "border-amber-300 bg-amber-50 text-amber-800"
            }`}
        >
            {children}
        </span>
    );
}

export default function AccountSecurityPanel({
    email,
    emailVerified,
    googleLinked,
    onOpenSecurity,
}) {
    const [verificationState, setVerificationState] = useState("");
    const [isSending, setIsSending] = useState(false);

    async function resendVerification() {
        setIsSending(true);
        const response = await fetch("/api/auth/verification/request", {
            method: "POST",
        });
        const data = await response.json();
        setVerificationState(
            response.ok
                ? "Đã gửi liên kết xác minh. Vui lòng kiểm tra email."
                : data.error || "Không thể gửi email xác minh.",
        );
        setIsSending(false);
    }

    return (
        <section className="app-border border-t px-5 py-6 sm:px-7">
            <h2 className="text-lg font-semibold">Email và tài khoản liên kết</h2>
            <div className="mt-5 divide-y divide-gray-200 border-y border-gray-200">
                <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-medium">{email}</p>
                        <p className="app-muted mt-1 text-sm">Dùng để đăng nhập và khôi phục tài khoản.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge active={Boolean(emailVerified)}>
                            {emailVerified ? "Đã xác minh" : "Chưa xác minh"}
                        </StatusBadge>
                        {!emailVerified && (
                            <button
                                type="button"
                                onClick={resendVerification}
                                disabled={isSending}
                                className="min-h-10 border border-primary px-4 font-medium text-primary disabled:opacity-60"
                            >
                                {isSending ? "Đang gửi..." : "Gửi lại"}
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onOpenSecurity}
                            className="min-h-10 border border-primary px-4 font-medium text-primary transition-colors hover:bg-[var(--app-primary-soft)]"
                        >
                            Đổi email
                        </button>
                    </div>
                </div>
                <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="font-medium">Google</p>
                        <p className="app-muted mt-1 text-sm">
                            Thêm Google làm phương thức đăng nhập thứ hai cho tài khoản này.
                        </p>
                    </div>
                    {googleLinked ? (
                        <StatusBadge active>Đã liên kết</StatusBadge>
                    ) : (
                        <SignInButton
                            callbackUrl="/tai-khoan/cai-dat"
                            label="Liên kết Google"
                        />
                    )}
                </div>
            </div>
            {verificationState && (
                <p className="app-muted mt-3 text-sm" role="status">{verificationState}</p>
            )}
        </section>
    );
}
