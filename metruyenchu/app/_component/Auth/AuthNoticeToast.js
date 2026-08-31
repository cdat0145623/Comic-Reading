"use client";

import { notify } from "@/lib/toaster";
import { useEffect } from "react";

export default function AuthNoticeToast({ message, type = "success" }) {
    useEffect(() => {
        if (!message) return;
        notify({ type, message, duration: 4000 });
        const url = new URL(window.location.href);
        url.searchParams.delete("emailChanged");
        url.searchParams.delete("passwordChanged");
        url.searchParams.delete("sessionRevoked");
        window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }, [message, type]);
    return null;
}
