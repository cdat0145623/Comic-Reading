"use client";

import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

const inputClass =
    "app-panel app-border min-h-11 w-full border px-3 pr-11 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary";

export default function PasswordField({
    id,
    label,
    registration,
    error,
    className = "",
    ...inputProps
}) {
    const [isVisible, setIsVisible] = useState(false);
    const errorId = error ? `${id}-error` : undefined;

    return (
        <div className={className}>
            <label htmlFor={id} className="text-sm font-semibold">
                {label}
            </label>
            <div className="relative mt-2">
                <input
                    id={id}
                    type={isVisible ? "text" : "password"}
                    aria-invalid={Boolean(error)}
                    aria-describedby={errorId}
                    className={`${inputClass} ${
                        error
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : ""
                    }`}
                    {...registration}
                    {...inputProps}
                />
                <button
                    type="button"
                    onClick={() => setIsVisible((visible) => !visible)}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--app-muted)] transition-colors hover:text-primary"
                    aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    title={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                    {isVisible ? (
                        <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                        <EyeIcon className="h-5 w-5" />
                    )}
                </button>
            </div>
            {error && (
                <p id={errorId} className="mt-2 text-sm text-red-600" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
