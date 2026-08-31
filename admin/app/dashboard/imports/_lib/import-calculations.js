export const SOURCE_URL =
    "https://truyendich.live/doc-truyen/pham-nhan-tien-duyen";

export const SOURCE_HOSTS = new Set([
    "truyendich.live",
    "www.truyendich.live",
    "truyendich.ai",
    "www.truyendich.ai",
    "truyendich.fit",
]);

export const IMPORT_MODES = [
    {
        id: "all",
        label: "Tất cả chương",
        description:
            "Chuẩn bị import toàn bộ chapter đã discovery ở phase sau.",
    },
    {
        id: "missing",
        label: "Chương chưa có",
        description: "Chỉ nhập chapter chưa tồn tại trong truyện đích.",
    },
    {
        id: "range",
        label: "Theo khoảng",
        description: "Giới hạn từ chương bắt đầu đến chương kết thúc.",
    },
];

export const CONCURRENCY_OPTIONS = [
    {
        value: 1,
        label: "An toàn",
        description: "1 request đồng thời",
    },
    {
        value: 2,
        label: "Cân bằng",
        description: "2 request đồng thời",
    },
];

export function validateSourceUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== "https:") {
            return "URL nguồn phải sử dụng giao thức HTTPS.";
        }

        if (!SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
            return "Phase này chỉ hỗ trợ nguồn truyendich.live hoặc truyendich.ai.";
        }

        if (!url.pathname.startsWith("/doc-truyen/")) {
            return "URL phải trỏ tới trang chi tiết của một truyện.";
        }

        return null;
    } catch {
        return "URL nguồn không hợp lệ.";
    }
}

export function getRangeError(range, totalChapters) {
    const from = Number(range.from);
    const to = Number(range.to);

    if (!Number.isInteger(totalChapters) || totalChapters < 1) {
        return "Cần phân tích nguồn trước khi chọn khoảng chương.";
    }

    if (!Number.isInteger(from) || !Number.isInteger(to)) {
        return "Số chương phải là số nguyên.";
    }

    if (from < 1 || to < 1) {
        return "Số chương phải lớn hơn hoặc bằng 1.";
    }

    if (from > to) {
        return "Chương bắt đầu không được lớn hơn chương kết thúc.";
    }

    if (to > totalChapters) {
        return `Chương kết thúc không được vượt quá ${totalChapters.toLocaleString("vi-VN")}.`;
    }

    return null;
}

export function getEstimatedTotal(mode, range, totalChapters) {
    if (!Number.isInteger(totalChapters) || totalChapters < 1) {
        return 0;
    }

    if (mode === "all") return totalChapters;
    if (mode === "missing") return totalChapters;

    const rangeError = getRangeError(range, totalChapters);
    if (rangeError) return 0;

    return Number(range.to) - Number(range.from) + 1;
}

export function getProgressCounts({ mode, progress, range, totalChapters }) {
    const total = getEstimatedTotal(mode, range, totalChapters);
    const processed = Math.floor((progress / 100) * total);
    const skipped =
        mode === "missing" || processed === 0 ? 0 : Math.min(8, processed);
    const failed = processed >= 4 ? 1 : 0;
    const review = processed >= 3 ? Math.min(3, processed - failed) : 0;
    const imported = Math.max(0, processed - skipped - failed - review);

    return {
        total,
        processed,
        imported,
        skipped,
        review,
        failed,
    };
}
