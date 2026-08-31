"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { notify } from "@/lib/toaster";
import AuthPageShell from "./AuthPageShell";
import AuthStatusContent, { authShellStyles } from "./AuthStatusContent";

export default function EmailVerificationResult({ token }) {
    const { data: session, update } = useSession();
    const isAuthenticated = Boolean(session?.user);
    const [status, setStatus] = useState(token ? "pending" : "error");
    const [message, setMessage] = useState(
        token ? "Đang xác minh email..." : "Liên kết không hợp lệ",
    );
    const hasRequested = useRef(false);

    useEffect(() => {
        if (!token || hasRequested.current) return;
        hasRequested.current = true;
        let active = true;
        fetch("/api/auth/verification/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (response) => {
                const data = await response.json();
                if (!response.ok) throw new Error(data.error);
                if (!active) return;
                setStatus("success");
                setMessage("Email đã được xác minh thành công.");
                notify({
                    type: "success",
                    message: "Email đã được xác minh thành công.",
                });
                if (isAuthenticated) {
                    await update({
                        user: { emailVerified: new Date() },
                    });
                }
            })
            .catch((error) => {
                if (!active) return;
                setStatus("error");
                setMessage(error.message || "Không thể xác minh email");
                notify({
                    type: "error",
                    message: error.message || "Không thể xác minh email",
                });
            });
        return () => {
            active = false;
        };
    }, [isAuthenticated, token, update]);

    const context =
        status === "success"
            ? {
                  title: "Email đã được xác minh",
                  copy: "Tài khoản của bạn đã hoàn tất bước xác nhận địa chỉ email.",
              }
            : status === "error"
              ? {
                    title: "Liên kết không còn hiệu lực",
                    copy: "Liên kết có thể đã hết hạn, đã được sử dụng hoặc bị thay thế.",
                }
              : {
                    title: "Đang kiểm tra liên kết",
                    copy: "Vui lòng giữ nguyên trang này trong khi hệ thống xác minh email.",
                };

    return (
        <AuthPageShell
            contextTitle={context.title}
            contextCopy={context.copy}
        >
            <AuthStatusContent
                status={status}
                title={
                    status === "success"
                        ? "Xác minh thành công"
                        : status === "error"
                          ? "Không thể xác minh email"
                          : "Đang xác minh email"
                }
                message={message}
                actions={
                    status !== "pending" ? (
                        <Link
                            href={
                                isAuthenticated
                                    ? "/tai-khoan/cai-dat"
                                    : "/login"
                            }
                            className={authShellStyles.primaryAction}
                        >
                            {isAuthenticated ? "Về hồ sơ" : "Đăng nhập"}
                        </Link>
                    ) : null
                }
            />
        </AuthPageShell>
    );
}
