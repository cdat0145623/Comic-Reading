"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";

import { cn } from "@/lib/utils";

export function DashboardSidebar({
    navigation,
    roleLabel,
    user,
    collapsed,
    mobileOpen,
    onCollapse,
    onMobileClose,
    onSignOut,
    onNavigate,
}) {
    const pathname = usePathname();
    const initials = (user.name || user.email || "MT")
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    return (
        <>
            {mobileOpen ? (
                <button
                    type="button"
                    aria-label="Đóng menu"
                    className="fixed inset-0 z-40 bg-overlay backdrop-blur-[1px] lg:hidden"
                    onClick={onMobileClose}
                />
            ) : null}

            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex w-[278px] flex-col bg-sidebar text-sidebar-foreground transition-[width,transform] duration-200 lg:translate-x-0",
                    collapsed && "lg:w-[82px]",
                    mobileOpen
                        ? "mobile-drawer translate-x-0"
                        : "-translate-x-full",
                )}
            >
                <div
                    className={cn(
                        "flex h-[76px] shrink-0 items-center border-b border-white/8 px-4",
                        collapsed && "lg:px-3",
                    )}
                >
                    <div
                        className={cn(
                            "flex min-w-0 flex-1 items-center gap-3",
                            collapsed && "lg:justify-center lg:gap-0",
                        )}
                    >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-white/18 bg-white/5 p-1">
                            <Image
                                src="/logo.png"
                                width={34}
                                height={34}
                                alt="Mê Truyện Chữ"
                                priority
                            />
                        </span>
                        <span
                            className={cn(
                                "min-w-0 transition-opacity",
                                collapsed && "lg:hidden",
                            )}
                        >
                            <strong className="block truncate text-sm">
                                Quản trị nội dung
                            </strong>
                            <span className="mt-0.5 block truncate text-xs text-white/45">
                                Mê Truyện Chữ
                            </span>
                        </span>
                    </div>
                    <button
                        type="button"
                        className="flex size-9 items-center justify-center rounded-md text-white/55 hover:bg-white/8 hover:text-white lg:hidden"
                        onClick={onMobileClose}
                        aria-label="Đóng menu"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div
                    className={cn(
                        "px-4 pb-3 pt-5",
                        collapsed && "lg:px-3",
                    )}
                >
                    <p
                        className={cn(
                            "px-2 text-[11px] font-bold uppercase text-white/38 transition-opacity",
                            collapsed &&
                                "lg:pointer-events-none lg:invisible",
                        )}
                    >
                        Không gian làm việc
                    </p>
                    <div
                        className={cn(
                            "mt-3 flex items-center gap-3 rounded-md border border-white/8 bg-white/[0.04] p-3",
                            collapsed && "lg:justify-center lg:px-0",
                        )}
                    >
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">
                            {initials}
                        </span>
                        <span
                            className={cn(
                                "min-w-0 transition-opacity",
                                collapsed && "lg:hidden",
                            )}
                        >
                            <strong className="block truncate text-xs">
                                {user.name || user.email}
                            </strong>
                            <span className="mt-0.5 block truncate text-[11px] text-white/45">
                                {roleLabel}
                            </span>
                        </span>
                    </div>
                </div>

                <nav
                    className="scrollbar-hidden flex-1 overflow-y-auto px-3 py-2"
                    aria-label="Điều hướng chính"
                >
                    <ul className="space-y-1">
                        {navigation.map((item, index) => {
                            const Icon = item.icon;
                            const itemId = item.id || `item-${index}`;
                            const active = item.href
                                ? item.href === "/dashboard"
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href)
                                : false;
                            const ItemComponent = item.href ? Link : "button";

                            return (
                                <li key={item.label}>
                                    <ItemComponent
                                        {...(item.href
                                            ? { href: item.href }
                                            : { type: "button" })}
                                        title={collapsed ? item.label : undefined}
                                        onClick={() => onNavigate(itemId)}
                                        className={cn(
                                            "group relative flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm text-white/65 transition-[background-color,color,transform] hover:bg-sidebar-hover hover:text-white active:translate-y-px",
                                            active &&
                                                "bg-sidebar-active text-white",
                                            collapsed && "lg:justify-center lg:px-2",
                                        )}
                                    >
                                        {active ? (
                                            <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-sidebar-accent-strong" />
                                        ) : null}
                                        <Icon
                                            className={cn(
                                                "shrink-0",
                                                active && "text-sidebar-accent-strong",
                                            )}
                                            size={18}
                                            strokeWidth={1.8}
                                        />
                                        <span
                                            className={cn(
                                                "min-w-0 flex-1 truncate",
                                                collapsed && "lg:hidden",
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                        {item.count ? (
                                            <span
                                                className={cn(
                                                    "flex h-5 min-w-5 items-center justify-center rounded-full bg-white/9 px-1.5 text-[10px] font-bold text-white/65",
                                                    collapsed &&
                                                        "lg:absolute lg:right-0.5 lg:top-0.5 lg:size-4 lg:min-w-4 lg:px-0",
                                                )}
                                            >
                                                {item.count}
                                            </span>
                                        ) : null}
                                    </ItemComponent>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                <div className="border-t border-white/8 p-3">
                    <button
                        type="button"
                        onClick={onSignOut}
                        className={cn(
                            "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm text-white/55 hover:bg-white/8 hover:text-white",
                            collapsed && "lg:justify-center lg:px-2",
                        )}
                    >
                        <LogOut size={18} />
                        <span className={cn(collapsed && "lg:hidden")}>
                            Đăng xuất
                        </span>
                    </button>
                    <button
                        type="button"
                        className="mt-2 hidden h-9 w-full items-center justify-center rounded-md border border-white/8 text-white/45 hover:bg-white/8 hover:text-white lg:flex"
                        onClick={onCollapse}
                        aria-label={collapsed ? "Mở rộng sidebar" : "Thu gọn sidebar"}
                    >
                        {collapsed ? (
                            <PanelLeftOpen size={17} />
                        ) : (
                            <PanelLeftClose size={17} />
                        )}
                    </button>
                </div>
            </aside>
        </>
    );
}
