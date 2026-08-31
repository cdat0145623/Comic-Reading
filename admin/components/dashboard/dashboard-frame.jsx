"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

import { DashboardSidebar } from "./sidebar";
import { Topbar } from "./topbar";
import {
    adminNavigation,
    contributorNavigation,
    roleLabels,
    ROLES,
} from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function DashboardFrame({ children, user }) {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [theme, setTheme] = useState("light");
    const navigation =
        user.role === ROLES.ADMIN ? adminNavigation : contributorNavigation;

    useEffect(() => {
        const savedTheme = window.localStorage.getItem("mtc-admin-theme");
        if (!["light", "dark", "gold"].includes(savedTheme)) return;

        document.documentElement.dataset.theme = savedTheme;
        const frame = window.requestAnimationFrame(() => setTheme(savedTheme));
        return () => window.cancelAnimationFrame(frame);
    }, []);

    function changeTheme(nextTheme) {
        setTheme(nextTheme);
        document.documentElement.dataset.theme = nextTheme;
        window.localStorage.setItem("mtc-admin-theme", nextTheme);
    }

    return (
        <div className="min-h-[100dvh] bg-canvas">
            <DashboardSidebar
                navigation={navigation}
                roleLabel={roleLabels[user.role]}
                user={user}
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCollapse={() => setCollapsed((current) => !current)}
                onMobileClose={() => setMobileOpen(false)}
                onNavigate={() => setMobileOpen(false)}
                onSignOut={() => signOut({ redirectTo: "/login" })}
            />

            <div
                className={cn(
                    "min-h-[100dvh] transition-[padding] duration-200 lg:pl-[278px]",
                    collapsed && "lg:pl-[82px]",
                )}
            >
                <Topbar
                    theme={theme}
                    onThemeChange={changeTheme}
                    onMenuOpen={() => setMobileOpen(true)}
                />
                <main className="px-4 py-7 sm:px-6 xl:px-8 xl:py-9">
                    <div className="mx-auto max-w-[1500px] animate-enter">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
