"use client";

import {
    BookOpenIcon,
    MoonIcon,
    SunIcon,
} from "@heroicons/react/24/outline";
import { useAppearance } from "./AppearanceProvider";

const THEME_OPTIONS = [
    { value: "light", label: "Sáng", Icon: SunIcon },
    { value: "sepia", label: "Vàng", Icon: BookOpenIcon },
    { value: "dark", label: "Tối", Icon: MoonIcon },
];

function ThemeSelector({ compact = false, className = "" }) {
    const { theme, setTheme } = useAppearance();

    return (
        <div
            className={`${
                compact
                    ? "grid grid-cols-3 gap-1"
                    : "grid grid-cols-3 gap-2"
            } ${className}`}
            role="group"
            aria-label="Màu giao diện"
        >
            {THEME_OPTIONS.map(({ value, label, Icon }) => {
                const isActive = theme === value;

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setTheme(value)}
                        className={`theme-choice ${
                            compact ? "theme-choice-compact" : ""
                        } ${isActive ? "theme-choice-active" : ""}`}
                        aria-pressed={isActive}
                        title={label}
                    >
                        <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} />
                        <span className={compact ? "text-[11px]" : "text-sm"}>
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

export default ThemeSelector;
