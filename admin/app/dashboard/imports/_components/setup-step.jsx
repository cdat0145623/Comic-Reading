import {
    AlertTriangle,
    CheckCircle2,
    ExternalLink,
    Globe2,
    LoaderCircle,
    Search,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ImportErrorNotice } from "./import-error-notice";

function formatSourceStatus(status) {
    if (status === "completed") return "Hoàn thành";
    if (status === "ongoing") return "Đang ra";
    return status || "Chưa xác định";
}

function StoryMetadata({ discovery }) {
    const { story, catalog } = discovery;
    return (
        <section className="border border-line-strong bg-surface">
            <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                <div>
                    <h2 className="text-base font-bold">Thông tin nhận diện</h2>
                    <p className="mt-1 text-xs leading-5 text-muted">
                        Discovery chỉ lưu metadata và trang catalog đầu. Chương
                        cuối được xác định khi chuẩn bị catalog.
                    </p>
                </div>
                <Badge variant="success">
                    {catalog.count.toLocaleString("vi-VN")} chương
                </Badge>
            </header>
            <div className="grid gap-5 p-5 sm:grid-cols-[116px_minmax(0,1fr)]">
                <div
                    className="aspect-[3/4] rounded-md border border-line-strong bg-sidebar bg-cover bg-center"
                    style={
                        story.coverUrl
                            ? {
                                  backgroundImage: `url("${story.coverUrl.replaceAll('"', "%22")}")`,
                              }
                            : undefined
                    }
                    role="img"
                    aria-label={`Ảnh bìa ${story.title}`}
                />
                <div className="min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-bold">{story.title}</h3>
                            <p className="mt-1 text-sm text-muted">
                                Tác giả: {story.authorName}
                            </p>
                        </div>
                        <Button size="sm" variant="secondary" asChild>
                            <a
                                href={discovery.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                <ExternalLink size={14} />
                                Mở nguồn
                            </a>
                        </Button>
                        {discovery.fetchTransport ? (
                            <Badge variant="neutral">
                                {
                                    {
                                        CHROMIUM: "Chrome fallback",
                                        HTTPCLOAK: "HTTP/3 fingerprint",
                                        DIRECT: "Direct fetch",
                                    }[discovery.fetchTransport]
                                }
                            </Badge>
                        ) : null}
                    </div>
                    <dl className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {[
                            ["Trạng thái", formatSourceStatus(story.sourceStatus)],
                            ["Phiên bản", `${story.editions.length} lựa chọn`],
                            ["Tổng chương", story.totalChapters.toLocaleString("vi-VN")],
                            ["Trang catalog", catalog.pageCount || "—"],
                        ].map(([label, value]) => (
                            <div key={label}>
                                <dt className="text-[11px] font-semibold text-muted">
                                    {label}
                                </dt>
                                <dd className="mt-1 text-sm font-semibold">
                                    {value}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    <div className="mt-5 grid gap-3 bg-surface-muted p-3 text-xs sm:grid-cols-2">
                        <div>
                            <span className="text-muted">Chương đầu</span>
                            <strong className="mt-1 block">
                                {catalog.first
                                    ? `${catalog.first.number}. ${catalog.first.title}`
                                    : "Không có dữ liệu"}
                            </strong>
                        </div>
                        <div>
                            <span className="text-muted">Chương cuối</span>
                            <strong className="mt-1 block">
                                {catalog.last
                                    ? `${catalog.last.number}. ${catalog.last.title}`
                                    : "Xác định ở bước chuẩn bị catalog"}
                            </strong>
                        </div>
                    </div>
                    {catalog.warnings.length ? (
                        <div className="mt-4 flex items-start gap-2 border-l-2 border-warning bg-status-warning px-3 py-2.5 text-xs leading-5">
                            <AlertTriangle className="mt-0.5 shrink-0" size={15} />
                            {catalog.warnings.join(" ")}
                        </div>
                    ) : null}
                </div>
            </div>
        </section>
    );
}

function MetadataPlaceholder({ analyzing }) {
    return (
        <section className="flex min-h-56 items-center justify-center border border-dashed border-line-strong bg-surface px-6 text-center">
            <div className="max-w-sm">
                {analyzing ? (
                    <LoaderCircle
                        className="mx-auto animate-spin text-accent"
                        size={24}
                    />
                ) : (
                    <Globe2 className="mx-auto text-muted" size={24} />
                )}
                <h2 className="mt-3 text-sm font-bold">
                    {analyzing
                        ? "Đang nhận diện nguồn truyện"
                        : "Nhập URL để bắt đầu phân tích"}
                </h2>
                <p className="mt-1 text-xs leading-5 text-muted">
                    Direct fetch được ưu tiên; Chromium chỉ chạy khi nguồn chặn
                    request thông thường.
                </p>
            </div>
        </section>
    );
}

export function SetupStep({
    state,
    isPending,
    onAnalyze,
    onContinue,
    onAction,
}) {
    const analyzing = state.analysisStatus === "analyzing";
    const analysisMessage =
        state.jobStatus === "QUEUED"
            ? "Đang chờ discovery worker"
            : state.jobStatus === "DISCOVERING"
              ? "Đang kết nối website nguồn"
              : null;
    return (
        <div className="space-y-6">
            <section className="border border-line-strong bg-surface">
                <header className="border-b border-line px-5 py-4">
                    <h2 className="text-base font-bold">Nguồn dữ liệu</h2>
                    <p className="mt-1 text-xs text-muted">
                        Hỗ trợ truyendich.live và truyendich.ai.
                    </p>
                </header>
                <div className="p-5">
                    <label className="text-xs font-semibold" htmlFor="source-url">
                        URL trang truyện
                    </label>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                        <div className="relative min-w-0 flex-1">
                            <Globe2
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                                size={17}
                            />
                            <Input
                                id="source-url"
                                className="pl-10"
                                value={state.sourceUrl}
                                disabled={analyzing || isPending}
                                onChange={(event) =>
                                    onAction({
                                        type: "SET_SOURCE_URL",
                                        value: event.target.value,
                                    })
                                }
                            />
                        </div>
                        <Button
                            disabled={analyzing || isPending}
                            onClick={onAnalyze}
                        >
                            {analyzing ? (
                                <LoaderCircle className="animate-spin" size={16} />
                            ) : (
                                <Search size={16} />
                            )}
                            {analyzing ? "Đang phân tích" : "Phân tích nguồn"}
                        </Button>
                    </div>
                    {state.analysisStatus === "invalid" ? (
                        <ImportErrorNotice
                            className="mt-3"
                            error={state.analysisError}
                            onRetry={onAnalyze}
                        />
                    ) : (
                        <div className="mt-2 flex min-h-5 items-start gap-2 text-xs leading-5 text-muted">
                            {state.analysisStatus === "ready" ? (
                                <CheckCircle2
                                    className="mt-0.5 shrink-0 text-success"
                                    size={14}
                                />
                            ) : null}
                            <span>
                                {state.analysisStatus === "ready"
                                    ? "Đã nhận diện metadata. Chọn phạm vi ở bước tiếp theo."
                                    : "Hệ thống chỉ gửi request sau khi bấm Phân tích nguồn."}
                            </span>
                        </div>
                    )}
                </div>
            </section>
            {state.discovery ? (
                <StoryMetadata discovery={state.discovery} />
            ) : (
                <div>
                    <MetadataPlaceholder analyzing={analyzing} />
                    {analyzing && analysisMessage ? (
                        <p className="mt-2 text-center text-xs font-semibold text-accent">
                            {analysisMessage}
                        </p>
                    ) : null}
                </div>
            )}
            {state.discovery ? (
                <div className="flex justify-end">
                    <Button onClick={onContinue}>Tiếp tục cấu hình</Button>
                </div>
            ) : null}
        </div>
    );
}
