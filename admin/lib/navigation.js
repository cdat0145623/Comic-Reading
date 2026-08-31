import {
    Activity,
    BadgeDollarSign,
    Bell,
    BookOpen,
    ChartNoAxesCombined,
    CircleGauge,
    ClipboardCheck,
    FileClock,
    Flag,
    Image,
    Import,
    ListChecks,
    ScrollText,
    ShieldCheck,
    Users,
    WalletCards,
} from "lucide-react";

export const ROLES = {
    ADMIN: "ADMIN",
    UPLOADER: "UPLOADER",
};

export const roleLabels = {
    ADMIN: "Quản trị viên",
    UPLOADER: "Người đăng truyện",
};

export const adminNavigation = [
    { id: "overview", href: "/dashboard", label: "Tổng quan", icon: CircleGauge, count: 6 },
    { label: "Báo cáo", icon: Flag, count: 12 },
    { label: "Truyện và chương", icon: BookOpen },
    { label: "Trang chủ và banner", icon: Image },
    { label: "Người dùng", icon: Users },
    { label: "Ranking và jobs", icon: Activity, count: 1 },
    { label: "Thông báo", icon: Bell, count: 3 },
    { label: "Nhật ký quản trị", icon: ScrollText },
];

export const contributorNavigation = [
    { id: "overview", href: "/dashboard", label: "Tổng quan", icon: CircleGauge, count: 4 },
    { label: "Truyện của tôi", icon: BookOpen },
    {
        id: "import-source",
        href: "/dashboard/imports/new",
        label: "Nhập từ nguồn",
        icon: Import,
    },
    { label: "Quản lý chương", icon: ListChecks, count: 2 },
    { label: "Lịch xuất bản", icon: FileClock },
    { label: "Người đọc", icon: ChartNoAxesCombined },
    { label: "Chapter trả phí", icon: BadgeDollarSign },
    { label: "Giao dịch", icon: WalletCards },
    { label: "Thông báo", icon: Bell, count: 2 },
];

export const overviewMeta = {
    ADMIN: {
        kicker: "Vận hành hôm nay",
        title: "Tổng quan quản trị",
        description:
            "Ưu tiên công việc cần quyết định, tình trạng xuất bản và sức khỏe hệ thống.",
        scope: "Toàn hệ thống",
        icon: ShieldCheck,
    },
    UPLOADER: {
        kicker: "Không gian xuất bản",
        title: "Tổng quan nội dung",
        description:
            "Theo dõi tiến độ truyện, độc giả và hiệu suất chapter trả phí của bạn.",
        scope: "Truyện của tôi",
        icon: ClipboardCheck,
    },
};
