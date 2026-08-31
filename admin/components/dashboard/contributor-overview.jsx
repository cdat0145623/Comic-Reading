import {
    ArrowRight,
    BookOpenCheck,
    CalendarClock,
    CircleDollarSign,
    Eye,
    UsersRound,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MetricStrip } from "./metric-strip";

const metrics = [
    {
        label: "Độc giả trong 7 ngày",
        value: "24.8K",
        change: "+12.4%",
        positive: true,
        note: "18.2K độc giả duy nhất",
        status: "bg-success",
    },
    {
        label: "Chapter đã mở khóa",
        value: "1,284",
        change: "+8.1%",
        positive: true,
        note: "Conversion rate 6.9%",
        status: "bg-success",
    },
    {
        label: "Doanh thu tạm tính",
        value: "38.5K",
        change: "+4.6%",
        positive: true,
        note: "Linh thạch · chưa trừ phí nền tảng",
        status: "bg-warning",
    },
    {
        label: "Chapter cần bổ sung",
        value: "2",
        change: "-1",
        positive: true,
        note: "Thiếu ảnh hoặc metadata xuất bản",
        status: "bg-danger",
    },
];

const stories = [
    {
        title: "Thái Hư Chí Tôn 3",
        method: "Convert",
        readers: "12.4K",
        unlocks: "786",
        revenue: "23,580",
        progress: 84,
    },
    {
        title: "Tự Trọng Trò Chơi Rút Ra Kỹ Năng",
        method: "Dịch",
        readers: "8.7K",
        unlocks: "412",
        revenue: "12,360",
        progress: 66,
    },
    {
        title: "Quang Âm Chi Ngoại 4",
        method: "AI dịch",
        readers: "3.7K",
        unlocks: "86",
        revenue: "2,580",
        progress: 38,
    },
];

const schedule = [
    {
        icon: CalendarClock,
        title: "Chapter 99 · Thái Hư Chí Tôn 3",
        detail: "Tự xuất bản lúc 20:00 hôm nay",
        status: "Đã lên lịch",
        variant: "info",
    },
    {
        icon: BookOpenCheck,
        title: "Chapter 57 · Quang Âm Chi Ngoại 4",
        detail: "Đang chờ Admin duyệt",
        status: "Chờ duyệt",
        variant: "warning",
    },
    {
        icon: CircleDollarSign,
        title: "Bảng giá chapter 100–120",
        detail: "90 linh thạch · áp dụng từ ngày mai",
        status: "Bản nháp",
        variant: "neutral",
    },
];

export function ContributorOverview() {
    return (
        <>
            <MetricStrip items={metrics} />

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.8fr)]">
                <section className="overflow-hidden rounded-md border border-line-strong bg-surface">
                    <header className="flex items-start justify-between gap-4 border-b border-line p-5">
                        <div>
                            <h2 className="text-xl font-bold">Hiệu suất truyện</h2>
                            <p className="mt-1 text-sm text-muted">
                                Độc giả và doanh thu trong 7 ngày
                            </p>
                        </div>
                        <Button variant="secondary" size="sm">
                            Xem phân tích
                        </Button>
                    </header>

                    <div className="hidden grid-cols-[minmax(0,1.4fr)_90px_90px_100px] gap-4 border-b border-line bg-surface-muted px-5 py-3 text-xs font-semibold text-muted md:grid">
                        <span>Truyện</span>
                        <span>Độc giả</span>
                        <span>Mở khóa</span>
                        <span>Doanh thu</span>
                    </div>

                    <div className="divide-y divide-line">
                        {stories.map((story) => (
                            <button
                                type="button"
                                className="group block w-full p-5 text-left hover:bg-surface-muted md:grid md:grid-cols-[minmax(0,1.4fr)_90px_90px_100px] md:items-center md:gap-4"
                                key={story.title}
                            >
                                <span className="min-w-0">
                                    <span className="flex items-center gap-2">
                                        <strong className="truncate text-sm">
                                            {story.title}
                                        </strong>
                                        <Badge>{story.method}</Badge>
                                    </span>
                                    <span className="mt-3 block h-1.5 overflow-hidden rounded-full bg-line">
                                        <span
                                            className="block h-full rounded-full bg-accent"
                                            style={{ width: `${story.progress}%` }}
                                        />
                                    </span>
                                </span>
                                <span className="mt-4 flex items-center justify-between text-sm md:mt-0 md:block">
                                    <span className="text-xs text-muted md:hidden">
                                        Độc giả
                                    </span>
                                    {story.readers}
                                </span>
                                <span className="mt-2 flex items-center justify-between text-sm md:mt-0 md:block">
                                    <span className="text-xs text-muted md:hidden">
                                        Mở khóa
                                    </span>
                                    {story.unlocks}
                                </span>
                                <span className="mt-2 flex items-center justify-between text-sm font-semibold md:mt-0 md:block">
                                    <span className="text-xs font-normal text-muted md:hidden">
                                        Doanh thu
                                    </span>
                                    {story.revenue}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <section className="rounded-md border border-line-strong bg-surface">
                    <header className="border-b border-line p-5">
                        <h2 className="text-xl font-bold">Cần chú ý</h2>
                        <p className="mt-1 text-sm text-muted">
                            Lịch xuất bản và cấu hình giá
                        </p>
                    </header>
                    <div className="divide-y divide-line">
                        {schedule.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    type="button"
                                    className="group flex w-full items-start gap-3 p-5 text-left hover:bg-surface-muted"
                                    key={item.title}
                                >
                                    <Icon
                                        className="mt-0.5 shrink-0 text-accent"
                                        size={18}
                                    />
                                    <span className="min-w-0 flex-1">
                                        <strong className="block text-sm leading-5">
                                            {item.title}
                                        </strong>
                                        <span className="mt-1.5 block text-xs leading-5 text-muted">
                                            {item.detail}
                                        </span>
                                        <Badge
                                            className="mt-3"
                                            variant={item.variant}
                                        >
                                            {item.status}
                                        </Badge>
                                    </span>
                                    <ArrowRight
                                        className="mt-1 text-muted opacity-0 group-hover:opacity-100"
                                        size={16}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <section className="mt-6 flex flex-col gap-4 border-y border-line bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-accent">
                        <UsersRound size={19} />
                    </span>
                    <div>
                        <h2 className="text-sm font-bold">
                            146 độc giả mới trong 24 giờ
                        </h2>
                        <p className="mt-1 text-xs text-muted">
                            Chapter 98 đang có tốc độ chuyển đổi cao nhất.
                        </p>
                    </div>
                </div>
                <Button variant="secondary" size="sm">
                    <Eye size={16} />
                    Xem người đọc
                </Button>
            </section>
        </>
    );
}
