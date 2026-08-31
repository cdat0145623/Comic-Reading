"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = new Set([
    "/login",
    "/quen-mat-khau",
    "/dat-lai-mat-khau",
    "/xac-minh-email",
    "/xac-minh-email-moi",
]);

export default function RouteChrome({
    authHeader,
    banner,
    children,
    footer,
    siteHeader,
}) {
    const pathname = usePathname();
    const isAuthPage = AUTH_PATHS.has(pathname);

    if (isAuthPage) {
        return (
            <>
                {authHeader}
                <main className="min-h-[calc(100dvh-72px)] bg-[var(--app-surface-muted)]">
                    {children}
                </main>
            </>
        );
    }

    return (
        <>
            {siteHeader}
            {banner}
            <main className="min-h-[72vh]">{children}</main>
            {footer}
        </>
    );
}
