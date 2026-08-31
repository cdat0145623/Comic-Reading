"use client";

import useOutsideClick from "@/app/hooks/useOutsideClick";
import { useEscapseKey } from "@/app/hooks/useEscapeKey";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useReaderSettings } from "./ReaderSettingsContext";
import ThemeSelector from "../../Appearance/ThemeSelector";
import { useAppearance } from "../../Appearance/AppearanceProvider";

function ReaderSettingsPanel({ onClose }) {
    const { settings, updateSetting, resetSettings } = useReaderSettings();
    const { resetTheme } = useAppearance();
    const [isMounted, setIsMounted] = useState(false);
    const panelRef = useOutsideClick(onClose);

    useEscapseKey(onClose);
    useEffect(() => setIsMounted(true), []);

    if (!isMounted) return null;

    const handleReset = () => {
        resetTheme();
        resetSettings();
    };

    return createPortal(
        <div
            ref={panelRef}
            className="app-panel fixed inset-x-0 bottom-0 z-40 max-h-[85vh] overflow-y-auto border-t p-5 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:top-24 sm:right-[var(--reader-panel-right)] sm:w-[380px] sm:rounded-md sm:border"
            style={{
                "--reader-panel-right":
                    "max(1rem, calc((100vw - 1024px) / 2 - 1rem))",
            }}
            role="dialog"
            aria-label="Cấu hình đọc truyện"
        >
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase">
                    Cấu hình đọc
                </h2>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded p-1 text-gray-500 hover:text-primary"
                    aria-label="Đóng cấu hình"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            <div className="space-y-7">
                <fieldset>
                    <legend className="mb-3 text-xs font-semibold uppercase text-gray-500">
                        Màu nền website
                    </legend>
                    <ThemeSelector />
                </fieldset>

                <label className="block">
                    <span className="mb-3 flex items-center justify-between text-xs font-semibold uppercase text-gray-500">
                        <span>Cỡ chữ nội dung</span>
                        <span className="text-primary normal-case">
                            {settings.fontSize}px
                        </span>
                    </span>
                    <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                updateSetting(
                                    "fontSize",
                                    settings.fontSize - 1,
                                )
                            }
                            className="h-10 rounded-full bg-slate-100 font-semibold text-slate-700"
                            aria-label="Giảm cỡ chữ"
                        >
                            A-
                        </button>
                        <input
                            type="range"
                            min="16"
                            max="32"
                            step="1"
                            value={settings.fontSize}
                            onChange={(event) =>
                                updateSetting("fontSize", event.target.value)
                            }
                            aria-label="Cỡ chữ nội dung"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                updateSetting(
                                    "fontSize",
                                    settings.fontSize + 1,
                                )
                            }
                            className="h-10 rounded-full bg-slate-100 font-semibold text-slate-700"
                            aria-label="Tăng cỡ chữ"
                        >
                            A+
                        </button>
                    </div>
                </label>

                <fieldset>
                    <legend className="mb-3 text-xs font-semibold uppercase text-gray-500">
                        Phông chữ
                    </legend>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            ["sans", "Hiện đại"],
                            ["serif", "Cổ điển"],
                        ].map(([value, label]) => {
                            const isActive = settings.fontFamily === value;

                            return (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() =>
                                        updateSetting("fontFamily", value)
                                    }
                                    className={`h-11 rounded border text-xs font-semibold uppercase ${
                                        isActive
                                            ? "border-primary bg-primary text-white"
                                            : "border-slate-300 hover:border-primary"
                                    }`}
                                    aria-pressed={isActive}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                </fieldset>

                <label className="block">
                    <span className="mb-3 flex items-center justify-between text-xs font-semibold uppercase text-gray-500">
                        <span>Giãn dòng</span>
                        <span className="text-primary">
                            {settings.lineHeight.toFixed(1)}
                        </span>
                    </span>
                    <input
                        type="range"
                        min="1.4"
                        max="2.4"
                        step="0.1"
                        value={settings.lineHeight}
                        onChange={(event) =>
                            updateSetting("lineHeight", event.target.value)
                        }
                        className="w-full"
                        aria-label="Giãn dòng"
                    />
                </label>

                <button
                    type="button"
                    onClick={handleReset}
                    className="flex w-full items-center justify-center gap-2 rounded border border-primary px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary hover:text-white"
                >
                    <ArrowPathIcon className="h-5 w-5" />
                    <span>Khôi phục mặc định</span>
                </button>
            </div>
        </div>,
        document.body,
    );
}

export default ReaderSettingsPanel;
