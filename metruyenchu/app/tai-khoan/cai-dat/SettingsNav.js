"use client";

import {
    BookOpenIcon,
    ShieldCheckIcon,
    UserCircleIcon,
} from "@heroicons/react/24/outline";

const settingsTabs = [
    {
        value: "profile",
        label: "Hồ sơ",
        Icon: UserCircleIcon,
    },
    {
        value: "library",
        label: "Tủ truyện",
        Icon: BookOpenIcon,
    },
    {
        value: "security",
        label: "Bảo mật",
        Icon: ShieldCheckIcon,
    },
];

function SettingsNav({ activeTab, onChange }) {
    return (
        <nav
            className="app-panel app-border grid grid-cols-3 border-b"
            aria-label="Cài đặt tài khoản"
            role="tablist"
        >
            {settingsTabs.map(({ value, label, Icon }) => {
                const isActive = activeTab === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onChange(value)}
                        className={`relative flex min-h-14 items-center justify-center gap-2 px-4 text-sm font-semibold transition-colors ${
                            isActive
                                ? "bg-[var(--app-primary-soft)] text-primary"
                                : "hover:bg-[var(--app-surface-muted)]"
                        }`}
                        aria-selected={isActive}
                        role="tab"
                    >
                        {isActive && (
                            <span className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
                        )}
                        <Icon className="h-5 w-5" />
                        <span>{label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

export default SettingsNav;
