"use client";

import { signOut } from "next-auth/react";
import { useEffect, useRef, useState } from "react";
import { publishAuthInvalidation } from "@/app/_lib/auth-session-sync";
import AuthPageShell from "./AuthPageShell";
import AuthStatusContent, { authShellStyles } from "./AuthStatusContent";

export default function EmailChangeResult({ token }) {
    const [status, setStatus] = useState(token ? "pending" : "error");
    const [message, setMessage] = useState(
        token ? "Đang xác nhận email mới..." : "Liên kết không hợp lệ",
    );
    const [targetEmail, setTargetEmail] = useState("");
    const hasRequested = useRef(false);

    useEffect(() => {
        if (!token || hasRequested.current) return;
        hasRequested.current = true;
        let active = true;

        fetch("/api/auth/email/change/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        })
            .then(async (response) => {
                const data = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(data.error);
                if (!active) return;
                setStatus("success");
                setMessage("Email đã được thay đổi. Đang chuyển tới trang đăng nhập...");
                setTargetEmail(data.email || "");
                publishAuthInvalidation(data.reason || "email-changed");
                try {
                    await signOut({ redirectTo: "/login?emailChanged=1" });
                } catch {
                    window.location.assign("/login?emailChanged=1");
                }
            })
            .catch((error) => {
                if (!active) return;
                setStatus("error");
                setMessage(error.message || "Không thể xác nhận email mới");
            });

        return () => {
            active = false;
        };
    }, [token]);

    const context =
        status === "success"
            ? {
                  title: "Email mới đã sẵn sàng",
                  copy: "Phiên đăng nhập cũ sẽ được kết thúc để bảo vệ tài khoản của bạn.",
              }
            : status === "error"
              ? {
                    title: "Liên kết không còn hiệu lực",
                    copy: "Email hiện tại của bạn chưa bị thay đổi.",
                }
              : {
                    title: "Đang kiểm tra liên kết",
                    copy: "Vui lòng giữ nguyên trang này trong khi hệ thống xác nhận yêu cầu.",
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
                        ? "Đổi email thành công"
                        : status === "error"
                          ? "Không thể xác nhận email"
                          : "Đang xác nhận email mới"
                }
                message={message}
                target={targetEmail}
                actions={
                    status === "error" ? (
                        <a
                            href="/tai-khoan/cai-dat"
                            className={authShellStyles.primaryAction}
                        >
                            Về bảo mật
                        </a>
                    ) : null
                }
            />
        </AuthPageShell>
    );
}
