import {
    AlertTriangle,
    ExternalLink,
    FileCheck2,
    Hash,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CHAPTER_STATUS = {
    NEW: { label: "Mới", variant: "success" },
    UNCHANGED: { label: "Không thay đổi", variant: "neutral" },
    CHANGED: { label: "Đã thay đổi", variant: "warning" },
    DUPLICATE_DRAFT: { label: "Trùng draft", variant: "info" },
};

export function DraftStep({ chapter, story }) {
    if (!chapter) {
        return (
            <section className="border border-dashed border-line-strong bg-surface p-8 text-center">
                <FileCheck2 className="mx-auto text-muted" size={24} />
                <h2 className="mt-3 text-sm font-bold">
                    Chưa có chapter draft
                </h2>
                <p className="mt-1 text-xs text-muted">
                    Quay lại Thiết lập và tải một chapter mẫu.
                </p>
            </section>
        );
    }

    const status =
        CHAPTER_STATUS[chapter.duplicateStatus] || CHAPTER_STATUS.NEW;
    const paragraphs = chapter.content
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean);

    return (
        <div className="grid gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="self-start border border-line-strong bg-surface">
                <header className="border-b border-line px-5 py-4">
                    <h2 className="text-base font-bold">Chapter mẫu</h2>
                    <p className="mt-1 text-xs leading-5 text-muted">
                        Draft gần nhất đã lưu trong PostgreSQL.
                    </p>
                </header>
                <div className="bg-accent-soft p-5">
                    <div className="flex items-start justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase text-muted">
                            Chương {chapter.number}
                        </span>
                        <Badge variant={status.variant}>
                            {status.label}
                        </Badge>
                    </div>
                    <strong className="mt-2 block text-sm leading-5">
                        {chapter.title}
                    </strong>
                    <p className="mt-2 text-xs text-muted">
                        {chapter.wordCount.toLocaleString("vi-VN")} từ ·{" "}
                        {chapter.editionName || "Edition đã lưu"}
                    </p>
                </div>
                <dl className="divide-y divide-line px-5 text-xs">
                    <div className="py-3">
                        <dt className="text-muted">Content hash</dt>
                        <dd className="mt-1 flex items-center gap-2 font-mono font-semibold">
                            <Hash size={13} />
                            {chapter.contentHash.slice(0, 12)}
                        </dd>
                    </div>
                    <div className="py-3">
                        <dt className="text-muted">Cập nhật draft</dt>
                        <dd className="mt-1 font-semibold">
                            {new Intl.DateTimeFormat("vi-VN", {
                                dateStyle: "short",
                                timeStyle: "short",
                            }).format(new Date(chapter.updatedAt))}
                        </dd>
                    </div>
                </dl>
            </aside>

            <section className="self-start border border-line-strong bg-surface">
                <header className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase text-accent">
                            Chương {chapter.number}
                        </p>
                        <h2 className="mt-1 text-lg font-bold">
                            {chapter.title}
                        </h2>
                        <p className="mt-1 text-xs text-muted">
                            {story?.title || "Story import draft"} ·{" "}
                            {chapter.wordCount.toLocaleString("vi-VN")} từ
                        </p>
                    </div>
                    {chapter.sourceUrl ? (
                        <Button size="sm" variant="secondary" asChild>
                            <a
                                href={chapter.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink size={14} />
                                Đối chiếu nguồn
                            </a>
                        </Button>
                    ) : null}
                </header>

                <div className="p-5">
                    {chapter.warnings?.length ? (
                        <div className="mb-5 flex items-start gap-3 border-l-2 border-warning bg-status-warning p-3 text-xs leading-5">
                            <AlertTriangle
                                className="mt-0.5 shrink-0 text-warning"
                                size={16}
                            />
                            {chapter.warnings.join(" ")}
                        </div>
                    ) : null}

                    <article className="space-y-5 whitespace-pre-wrap break-words text-base leading-8 text-foreground">
                        {paragraphs.map((paragraph, index) => (
                            <p key={`${index}-${paragraph.slice(0, 24)}`}>
                                {paragraph}
                            </p>
                        ))}
                    </article>

                    <dl className="mt-8 grid grid-cols-2 border border-line sm:grid-cols-4">
                        {[
                            ["Nguồn", chapter.editionName || "Đã chọn"],
                            [
                                "Số từ",
                                chapter.wordCount.toLocaleString("vi-VN"),
                            ],
                            ["Ảnh đã bỏ", chapter.imageCount || 0],
                            ["Đối chiếu", status.label],
                        ].map(([label, value]) => (
                            <div
                                className="border-b border-line p-3 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
                                key={label}
                            >
                                <dt className="text-[11px] font-semibold text-muted">
                                    {label}
                                </dt>
                                <dd className="mt-1 text-sm font-bold">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>

                <footer className="flex items-center justify-between gap-3 border-t border-line bg-surface-muted px-5 py-4">
                    <p className="flex items-center gap-2 text-xs text-muted">
                        <FileCheck2 size={15} />
                        Chỉ là draft, chưa xuất bản.
                    </p>
                    <Button
                        disabled
                        title="Publish được triển khai ở phase sau"
                    >
                        Duyệt và xuất bản
                    </Button>
                </footer>
            </section>
        </div>
    );
}
