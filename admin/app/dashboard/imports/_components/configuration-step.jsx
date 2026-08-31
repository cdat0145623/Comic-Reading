import { AlertCircle, LoaderCircle, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
    CONCURRENCY_OPTIONS,
    IMPORT_MODES,
} from "../_lib/import-calculations";
import { ImportErrorNotice } from "./import-error-notice";

const SELECT_CLASS =
    "mt-2 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-focus-soft";

export function ConfigurationStep({
    state,
    estimatedTotal,
    rangeError,
    canSubmit,
    isPending,
    onConfirm,
    onAction,
}) {
    const totalChapters = state.discovery?.story.totalChapters || 0;
    if (!state.discovery) return null;

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <section className="border border-line-strong bg-surface">
                <header className="border-b border-line px-5 py-4">
                    <h2 className="text-base font-bold">Cấu hình import</h2>
                    <p className="mt-1 text-xs text-muted">
                        Chọn phiên bản, truyện đích và phạm vi trước khi worker
                        chuẩn bị catalog.
                    </p>
                </header>
                <div className="grid gap-4 border-b border-line p-5 sm:grid-cols-2">
                    <label className="text-xs font-semibold">
                        Phiên bản nguồn
                        <select
                            className={SELECT_CLASS}
                            value={state.selectedEditionExternalId}
                            onChange={(event) =>
                                onAction({
                                    type: "SET_EDITION",
                                    value: event.target.value,
                                })
                            }
                        >
                            {state.discovery.story.editions.map((edition) => (
                                <option
                                    key={edition.externalId}
                                    value={edition.externalId}
                                >
                                    {edition.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="text-xs font-semibold">
                        Truyện đích
                        <select
                            className={SELECT_CLASS}
                            value={state.targetStoryId}
                            onChange={(event) =>
                                onAction({
                                    type: "SET_TARGET_STORY",
                                    value: event.target.value,
                                })
                            }
                        >
                            <option value="">Tạo draft truyện mới</option>
                            {state.discovery.targetCandidates.map((story) => (
                                <option key={story.id} value={story.id}>
                                    {story.title}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <fieldset>
                    <legend className="sr-only">Phạm vi import</legend>
                    <div className="divide-y divide-line">
                        {IMPORT_MODES.map((item) => (
                            <label
                                className={cn(
                                    "flex cursor-pointer gap-3 p-5 transition-colors hover:bg-surface-muted",
                                    state.mode === item.id && "bg-accent-soft",
                                )}
                                key={item.id}
                            >
                                <input
                                    className="mt-1 accent-[var(--accent)]"
                                    type="radio"
                                    name="import-mode"
                                    checked={state.mode === item.id}
                                    onChange={() =>
                                        onAction({
                                            type: "SET_MODE",
                                            value: item.id,
                                        })
                                    }
                                />
                                <span>
                                    <strong className="block text-sm">
                                        {item.label}
                                    </strong>
                                    <span className="mt-1 block text-xs leading-5 text-muted">
                                        {item.description}
                                    </span>
                                </span>
                            </label>
                        ))}
                    </div>
                </fieldset>
                {state.mode === "range" ? (
                    <div className="border-t border-line bg-surface-muted p-5">
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                ["from", "Từ chương"],
                                ["to", "Đến chương"],
                            ].map(([field, label]) => (
                                <label className="text-xs font-semibold" key={field}>
                                    {label}
                                    <Input
                                        className="mt-2 bg-surface"
                                        min="1"
                                        max={totalChapters}
                                        type="number"
                                        value={state.range[field]}
                                        onChange={(event) =>
                                            onAction({
                                                type: "SET_RANGE",
                                                field,
                                                value: event.target.value,
                                            })
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                        {rangeError ? (
                            <p className="mt-2 flex gap-2 text-xs text-danger">
                                <AlertCircle size={14} />
                                {rangeError}
                            </p>
                        ) : null}
                    </div>
                ) : null}
            </section>

            <aside className="self-start border border-line-strong bg-surface">
                <header className="border-b border-line px-5 py-4">
                    <h2 className="text-base font-bold">Tốc độ và xác nhận</h2>
                </header>
                <div className="p-4">
                    <div className="grid grid-cols-2 gap-2 bg-surface-muted p-1.5">
                        {CONCURRENCY_OPTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                className={cn(
                                    "min-h-16 rounded-md border px-3 py-2 text-left",
                                    state.concurrency === option.value
                                        ? "border-accent-border bg-surface text-accent-strong"
                                        : "border-transparent text-muted",
                                )}
                                onClick={() =>
                                    onAction({
                                        type: "SET_CONCURRENCY",
                                        value: option.value,
                                    })
                                }
                            >
                                <strong className="block text-xs">
                                    {option.label}
                                </strong>
                                <span className="mt-1 block text-[11px]">
                                    {option.description}
                                </span>
                            </button>
                        ))}
                    </div>
                    <dl className="my-5 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <dt className="text-muted">Dự kiến</dt>
                            <dd className="mt-1 font-bold">
                                {estimatedTotal.toLocaleString("vi-VN")} chương
                            </dd>
                        </div>
                        <div>
                            <dt className="text-muted">Catalog nguồn</dt>
                            <dd className="mt-1 font-bold">
                                {state.discovery.catalog.pageCount} trang
                            </dd>
                        </div>
                    </dl>
                    <Button
                        className="w-full"
                        disabled={!canSubmit || isPending}
                        onClick={onConfirm}
                    >
                        {isPending ? (
                            <LoaderCircle className="animate-spin" size={16} />
                        ) : (
                            <Play size={16} />
                        )}
                        {isPending ? "Đang chuẩn bị" : "Bắt đầu import"}
                    </Button>
                    {state.configurationError ? (
                        <ImportErrorNotice
                            className="mt-3"
                            error={state.configurationError}
                            onRetry={onConfirm}
                        />
                    ) : null}
                </div>
            </aside>
        </div>
    );
}
