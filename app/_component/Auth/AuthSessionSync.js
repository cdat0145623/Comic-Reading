"use client";

import {
    getAuthTabId,
    subscribeAuthInvalidation,
} from "@/app/_lib/auth-session-sync";
import { notify } from "@/lib/toaster";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const PROTECTED_PREFIXES = ["/tai-khoan"];

function getRevocationMessage(reason) {
    if (reason === "email-changed") {
        return "Email đăng nhập đã thay đổi. Vui lòng đăng nhập lại.";
    }
    if (reason === "password-changed" || reason === "password-reset") {
        return "Mật khẩu đã thay đổi. Vui lòng đăng nhập lại.";
    }
    return "Phiên đăng nhập đã hết hiệu lực.";
}

export default function AuthSessionSync() {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const router = useRouter();
    const handlingRef = useRef(false);
    const userId = session?.user?.id;

    const invalidateSession = useCallback(
        async (reason) => {
            if (handlingRef.current) return;
            handlingRef.current = true;
            try {
                await signOut({ redirect: false });
                notify({
                    type: "warning",
                    message: getRevocationMessage(reason),
                    duration: 4000,
                });
                if (
                    PROTECTED_PREFIXES.some((prefix) =>
                        pathname.startsWith(prefix),
                    )
                ) {
                    const callbackUrl = encodeURIComponent(pathname);
                    router.replace(
                        `/login?sessionRevoked=1&callbackUrl=${callbackUrl}`,
                    );
                } else {
                    router.refresh();
                }
            } finally {
                handlingRef.current = false;
            }
        },
        [pathname, router],
    );

    useEffect(() => {
        if (!userId) return;
        return subscribeAuthInvalidation((event) => {
            if (event.sourceTabId === getAuthTabId()) return;
            void invalidateSession(event.reason);
        });
    }, [invalidateSession, userId]);

    useEffect(() => {
        if (status !== "authenticated") return;
        let active = true;
        let requestPending = false;

        const validateSession = async () => {
            if (!active || requestPending || document.visibilityState === "hidden") {
                return;
            }
            requestPending = true;
            try {
                const response = await fetch("/api/auth/session/validate", {
                    cache: "no-store",
                });
                if (active && response.status === 401) {
                    const data = await response.json().catch(() => ({}));
                    await invalidateSession(
                        data.code === "SESSION_REVOKED"
                            ? "session-revoked"
                            : "session-ended",
                    );
                }
            } catch {
                // A transient network failure must not revoke a valid local session.
            } finally {
                requestPending = false;
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === "visible") void validateSession();
        };
        window.addEventListener("focus", validateSession);
        document.addEventListener("visibilitychange", handleVisibility);
        return () => {
            active = false;
            window.removeEventListener("focus", validateSession);
            document.removeEventListener("visibilitychange", handleVisibility);
        };
    }, [invalidateSession, status]);

    return null;
}
