"use client";

import { Bell, BookOpen, Menu, Moon, Search, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";

const themes = [
    { value: "light", label: "Sáng", icon: Sun },
    { value: "dark", label: "Tối", icon: Moon },
    { value: "gold", label: "Vàng", icon: BookOpen },
];

export function Topbar({ theme, onThemeChange, onMenuOpen }) {
    return (
        <header className="sticky top-0 z-30 flex h-[76px] items-center border-b border-line bg-surface px-4 sm:px-6 xl:px-8">
            <Button
                className="mr-3 lg:hidden"
                size="icon"
                variant="ghost"
                onClick={onMenuOpen}
                aria-label="Mở menu"
            >
                <Menu size={20} />
            </Button>

            <div className="flex h-11 min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-md border border-line-strong bg-surface-muted px-3 text-muted focus-within:border-accent focus-within:ring-2 focus-within:ring-focus-soft">
                <Search size={18} />
                <input
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
                    placeholder="Tìm truyện, chapter, user hoặc mã report"
                    aria-label="Tìm kiếm toàn hệ thống"
                />
                <kbd className="hidden rounded border border-line-strong bg-surface px-2 py-1 text-[10px] font-semibold sm:block">
                    ⌘ K
                </kbd>
            </div>

            <div className="ml-auto flex items-center gap-2 pl-3 sm:gap-3 sm:pl-6">
                <span className="hidden text-xs font-semibold text-muted xl:block">
                    Giao diện
                </span>
                <div
                    className="flex h-10 items-center rounded-md border border-line-strong bg-surface-muted p-1"
                    role="group"
                    aria-label="Chọn màu giao diện"
                >
                    {themes.map((item) => {
                        const Icon = item.icon;
                        const active = theme === item.value;
                        return (
                            <button
                                key={item.value}
                                type="button"
                                title={item.label}
                                aria-label={`Giao diện ${item.label}`}
                                aria-pressed={active}
                                className={`flex size-8 items-center justify-center rounded text-muted transition-[background-color,color,transform] hover:text-foreground active:scale-[0.97] ${active ? "bg-surface text-accent shadow-sm" : ""}`}
                                onClick={() => onThemeChange(item.value)}
                            >
                                <Icon size={16} />
                            </button>
                        );
                    })}
                </div>
                <Button
                    size="icon"
                    variant="secondary"
                    aria-label="Thông báo"
                    className="relative"
                >
                    <Bell size={18} />
                    <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger" />
                </Button>
            </div>
        </header>
    );
}
