import {
    AlertTriangle,
    CheckCircle2,
    CirclePause,
    FileWarning,
    ListFilter,
    RotateCcw,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_META = {
    RUNNING: {
        label: "Đang chạy",
        variant: "info",
        title: "Đang chuẩn bị draft",
        description:
            "Worker chuẩn bị catalog trước, sau đó mới tải nội dung chương đã chọn.",
    },
    QUEUED: {
        label: "Đang chờ",
        variant: "warning",
        title: "Job đã vào hàng đợi",
        description: "Redis đang giữ thứ tự; worker sẽ nhận job khi có tài nguyên.",
    },
    PARTIAL_FAILED: {
        label: "Hoàn tất một phần",
        variant: "warning",
        title: "Một số chapter cần thử lại",
        description: "Các chapter thành công đã được giữ lại trong draft.",
    },
    FAILED: {
        label: "Thất bại",
        variant: "danger",
        title: "Job không thể hoàn tất",
        description: "Kiểm tra mã lỗi trước khi tạo lần chạy mới.",
    },
    PAUSED: {
        label: "Đã tạm dừng",
        variant: "warning",
        title: "Job đang được giữ an toàn",
        description:
            "Tiến trình không thay đổi cho tới khi người dùng tiếp tục job.",
    },
    REVIEW_REQUIRED: {
        label: "Chờ kiểm tra",
        variant: "success",
        title: "Đã hoàn tất bước nhập dữ liệu",
        description:
            "Draft đã sẵn sàng. Hệ thống không tự xuất bản hoặc tự chuyển màn hình.",
    },
    CANCELLED: {
        label: "Đã hủy",
        variant: "danger",
        title: "Job đã dừng theo yêu cầu",
        description:
            "Dữ liệu chapter đã hoàn tất được giữ lại để tiếp tục kiểm tra.",
    },
};

const CHAPTER_STATUS_META = {
    QUEUED: { label: "Đang chờ", variant: "warning" },
    RUNNING: { label: "Đang tải", variant: "info" },
    COMPLETED: { label: "Đã lưu", variant: "success" },
    FAILED: { label: "Lỗi nguồn", variant: "danger" },
};

function formatActivityTime(value) {
    if (!value) return "Chưa cập nhật";
    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    }).format(new Date(value));
}

function ProgressBar({ label, current, total, unit, tone = "accent" }) {
    const percent = total
        ? Math.min(100, Math.round((current / total) * 100))
        : 0;
    return (
        <div className="border border-line p-4">
            <div className="flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold text-muted">{label}</p>
                    <strong className="mt-1 block text-2xl">{percent}%</strong>
                </div>
                <p className="text-right text-xs leading-5 text-muted">
                    {current.toLocaleString("vi-VN")} /{" "}
                    {total.toLocaleString("vi-VN")} {unit}
                </p>
            </div>
            <div
                className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
                role="progressbar"
                aria-label={label}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={percent}
            >
                <div
                    className={
                        tone === "success"
                            ? "h-full rounded-full bg-success transition-[width] duration-500"
                            : "h-full rounded-full bg-accent transition-[width] duration-500"
                    }
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}

function JobActions({ state, onAction }) {
    if (state.jobStatus === "REVIEW_REQUIRED") {
        return (
            <Button onClick={() => onAction({ type: "OPEN_DRAFT" })}>
                <CheckCircle2 size={16} />
                Kiểm tra draft
            </Button>
        );
    }

    if (state.jobStatus === "CANCELLED") {
        return (
            <Button onClick={() => onAction({ type: "RESET_JOB" })}>
                <RotateCcw size={16} />
                Thiết lập job mới
            </Button>
        );
    }

    return (
        <p className="text-xs font-semibold text-muted">
            Pause, resume và cancel được giữ cho Phase 5.
        </p>
    );
}

export function ProgressStep({ state, counts, onAction }) {
    const status = STATUS_META[state.jobStatus] ?? STATUS_META.RUNNING;
    const catalogTotal =
        state.progressData?.catalogPageCount ||
        state.discovery?.catalog.pageCount ||
        0;
    const catalogCompleted =
        state.progressData?.completedCatalogPageCount || 0;
    const catalogReady =
        state.progressData?.stage === "CHAPTER_IMPORT" ||
        state.progressData?.stage === "REVIEW";
    const resolvedCatalogCompleted = catalogReady
        ? catalogTotal
        : catalogCompleted;

    return (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_320px]">
            <div className="space-y-6">
                <section className="border border-line-strong bg-surface">
                    <header className="flex flex-col gap-4 border-b border-line px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-base font-bold">
                                    {status.title}
                                </h2>
                                <Badge variant={status.variant}>
                                    {status.label}
                                </Badge>
                            </div>
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                                {status.description}
                            </p>
                        </div>
                        <JobActions state={state} onAction={onAction} />
                    </header>

                    <div className="p-5">
                        {state.jobError ? (
                            <div
                                className="mb-5 border border-danger bg-status-danger px-4 py-3"
                                role="alert"
                            >
                                <strong className="text-sm text-danger">
                                    {state.jobError.message}
                                </strong>
                                <p className="mt-1 text-xs text-muted">
                                    Mã lỗi: {state.jobError.code}
                                </p>
                            </div>
                        ) : null}
                        <div className="grid gap-3 md:grid-cols-2">
                            <ProgressBar
                                label="Đang chuẩn bị danh mục"
                                current={resolvedCatalogCompleted}
                                total={catalogTotal}
                                unit="trang"
                            />
                            <ProgressBar
                                label="Đang tải nội dung"
                                current={counts.processed}
                                total={counts.total}
                                unit="chương"
                                tone="success"
                            />
                        </div>

                        <dl className="mt-6 grid grid-cols-2 border border-line sm:grid-cols-5">
                            {[
                                ["Đã nhập", counts.imported],
                                ["Bỏ qua", counts.skipped],
                                ["Cần xem", counts.review],
                                ["Lỗi", counts.failed],
                                ["Còn lại", counts.total - counts.processed],
                            ].map(([label, value], index) => (
                                <div
                                    className={`px-4 py-3 ${
                                        index < 4
                                            ? "border-b border-line sm:border-b-0 sm:border-r"
                                            : ""
                                    }`}
                                    key={label}
                                >
                                    <dt className="text-[11px] font-semibold text-muted">
                                        {label}
                                    </dt>
                                    <dd className="mt-1 text-lg font-bold">
                                        {Math.max(0, value).toLocaleString(
                                            "vi-VN",
                                        )}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {state.cancelConfirmationOpen ? (
                        <div
                            className="border-t border-danger bg-status-danger px-5 py-4"
                            role="alert"
                        >
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle
                                        className="mt-0.5 shrink-0 text-danger"
                                        size={18}
                                    />
                                    <div>
                                        <strong className="text-sm">
                                            Xác nhận hủy job?
                                        </strong>
                                        <p className="mt-1 text-xs leading-5 text-muted">
                                            Chapter đã hoàn tất vẫn được giữ trong
                                            draft để kiểm tra.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <Button
                                        variant="secondary"
                                        onClick={() =>
                                            onAction({
                                                type: "DISMISS_CANCEL",
                                            })
                                        }
                                    >
                                        Tiếp tục job
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() =>
                                            onAction({ type: "CONFIRM_CANCEL" })
                                        }
                                    >
                                        Xác nhận hủy
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : null}
                </section>

                <section className="border border-line-strong bg-surface">
                    <header className="flex items-center justify-between border-b border-line px-5 py-4">
                        <div>
                            <h2 className="text-base font-bold">
                                Hoạt động gần nhất
                            </h2>
                            <p className="mt-1 text-xs text-muted">
                                Trạng thái được đồng bộ từ worker và PostgreSQL.
                            </p>
                        </div>
                        <ListFilter className="text-muted" size={18} />
                    </header>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead className="bg-surface-muted text-xs text-muted">
                                <tr>
                                    <th className="px-5 py-3 font-semibold">
                                        Chapter
                                    </th>
                                    <th className="px-5 py-3 font-semibold">
                                        Thời gian
                                    </th>
                                    <th className="px-5 py-3 text-right font-semibold">
                                        Kết quả
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-line">
                                {state.progressData?.recentChapters?.length ? (
                                    state.progressData.recentChapters.map(
                                        (chapter) => {
                                            const chapterStatus =
                                                CHAPTER_STATUS_META[
                                                    chapter.importStatus
                                                ] ||
                                                CHAPTER_STATUS_META.QUEUED;
                                            return (
                                                <tr key={chapter.id}>
                                                    <td className="px-5 py-4">
                                                        <strong className="block font-semibold">
                                                            Chương{" "}
                                                            {chapter.number}:{" "}
                                                            {chapter.title}
                                                        </strong>
                                                        <span className="mt-1 block text-xs text-muted">
                                                            {chapter.fetchTransport
                                                                ? `Tải bằng ${chapter.fetchTransport.toLowerCase()}`
                                                                : `Lần thử ${chapter.attemptCount}`}
                                                            {chapter.errorCode
                                                                ? ` · ${chapter.errorCode}`
                                                                : ""}
                                                        </span>
                                                    </td>
                                                    <td className="px-5 py-4 text-muted">
                                                        {formatActivityTime(
                                                            chapter.updatedAt,
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <Badge
                                                            variant={
                                                                chapterStatus.variant
                                                            }
                                                        >
                                                            {
                                                                chapterStatus.label
                                                            }
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            );
                                        },
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            className="px-5 py-8 text-center text-sm text-muted"
                                            colSpan={3}
                                        >
                                            Worker chưa xử lý chapter nào trong
                                            batch này.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            <aside className="space-y-4 self-start">
                <section className="border border-line-strong bg-surface p-5">
                    <CirclePause className="text-accent" size={20} />
                    <h2 className="mt-3 text-sm font-bold">
                        Giới hạn tải nguồn
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-muted">
                        Cấu hình đã chọn:{" "}
                        <strong className="text-foreground">
                            {state.concurrency} request đồng thời
                        </strong>
                        . Worker hiện giới hạn an toàn theo nguồn; job lỗi được
                        BullMQ retry tối đa 3 lần.
                    </p>
                </section>

                <section className="border border-line-strong bg-surface p-5">
                    <FileWarning className="text-warning" size={20} />
                    <h2 className="mt-3 text-sm font-bold">Lỗi không chặn job</h2>
                    <p className="mt-2 text-xs leading-5 text-muted">
                        Chapter lỗi được đánh dấu để retry hoặc kiểm tra thủ công;
                        job còn lại vẫn tiếp tục.
                    </p>
                </section>
            </aside>
        </div>
    );
}
