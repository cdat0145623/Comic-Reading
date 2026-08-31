import {
    AlertTriangle,
    ArrowRight,
    CheckCircle2,
    Clock3,
    FileWarning,
    ServerCog,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricStrip } from "./metric-strip";

const metrics = [
    {
        label: "Report chưa xử lý",
        value: "12",
        change: "+3 hôm nay",
        positive: false,
        note: "4 report đã vượt SLA 30 phút",
        status: "bg-danger",
    },
    {
        label: "Chapter cần Admin duyệt",
        value: "18",
        change: "-6",
        positive: true,
        note: "9 chapter có đầy đủ metadata",
        status: "bg-warning",
    },
    {
        label: "Tự xuất bản thành công",
        value: "98.6%",
        change: "+0.8%",
        positive: true,
        note: "Trong 24 giờ gần nhất",
        status: "bg-success",
    },
    {
        label: "Job cần kiểm tra",
        value: "3",
        change: "+1",
        positive: false,
        note: "Ranking realtime đang retry",
        status: "bg-danger",
    },
];

const queue = [
    {
        icon: FileWarning,
        title: "Chapter 105 có 4 báo cáo nội dung",
        meta: "Tụ Bảo Tiên Bồn · chờ 36 phút",
        label: "Khẩn",
        variant: "danger",
    },
    {
        icon: ServerCog,
        title: "Realtime ranking không tạo snapshot",
        meta: "Job top-story-realtime · lỗi gần nhất 09:12",
        label: "Kiểm tra",
        variant: "warning",
    },
    {
        icon: Clock3,
        title: "9 chapter đang chờ quyết định xuất bản",
        meta: "3 truyện · đã vượt qua kiểm tra kỹ thuật",
        label: "Chờ duyệt",
        variant: "info",
    },
    {
        icon: AlertTriangle,
        title: "3 notification gửi thất bại",
        meta: "SMTP timeout · có thể retry an toàn",
        label: "Thông thường",
        variant: "neutral",
    },
];

const activity = [
    ["Minh Admin", "giải quyết report #RP-1842", "4 phút trước"],
    ["Nguyễn Đạt", "xuất bản chapter 98", "18 phút trước"],
    ["System", "hoàn thành job daily-stats", "31 phút trước"],
    ["Lan Convert", "cập nhật chapter 56", "42 phút trước"],
];

export function AdminOverview() {
    return (
        <>
            <MetricStrip items={metrics} />

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
                <section className="overflow-hidden rounded-md border border-line-strong bg-surface">
                    <header className="flex items-start justify-between gap-4 border-b border-line p-5">
                        <div>
                            <h2 className="text-xl font-bold">Hàng đợi công việc</h2>
                            <p className="mt-1 text-sm text-muted">
                                Xếp theo mức ảnh hưởng và thời gian chờ
                            </p>
                        </div>
                        <Button variant="secondary" size="sm">
                            Mở hàng đợi
                        </Button>
                    </header>
                    <div className="divide-y divide-line">
                        {queue.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    type="button"
                                    className="group flex w-full items-center gap-4 p-5 text-left hover:bg-surface-muted"
                                    key={item.title}
                                >
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                                        <Icon size={19} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <strong className="block truncate text-sm">
                                            {item.title}
                                        </strong>
                                        <span className="mt-1 block truncate text-xs text-muted">
                                            {item.meta}
                                        </span>
                                    </span>
                                    <Badge variant={item.variant}>{item.label}</Badge>
                                    <ArrowRight
                                        className="text-muted opacity-0 transition-[opacity,transform] group-hover:translate-x-0.5 group-hover:opacity-100"
                                        size={17}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section className="rounded-md border border-line-strong bg-surface">
                    <header className="border-b border-line p-5">
                        <h2 className="text-xl font-bold">Hoạt động gần đây</h2>
                        <p className="mt-1 text-sm text-muted">
                            Audit log của hệ thống
                        </p>
                    </header>
                    <ol className="divide-y divide-line">
                        {activity.map(([actor, action, time]) => (
                            <li className="flex gap-3 p-5" key={`${actor}-${action}`}>
                                <CheckCircle2
                                    className="mt-0.5 shrink-0 text-accent"
                                    size={17}
                                />
                                <div className="min-w-0 text-sm">
                                    <p className="leading-5">
                                        <strong>{actor}</strong> {action}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {time}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            </div>
        </>
    );
}
