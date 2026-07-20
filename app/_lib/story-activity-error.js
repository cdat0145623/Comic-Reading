const PUBLIC_ACTIVITY_ERROR_PREFIXES = [
    "Bạn chưa đăng nhập",
    "Bình luận cha",
    "Thread thảo luận",
    "Thiếu thông tin",
    "Mã submission",
    "Nội dung",
    "Không thể",
];

function getPublicActivityErrorMessage(error, fallback) {
    const message =
        typeof error === "string" ? error : error?.message?.trim();
    if (
        !message ||
        message.length > 180 ||
        !PUBLIC_ACTIVITY_ERROR_PREFIXES.some((prefix) =>
            message.startsWith(prefix),
        )
    ) {
        return fallback;
    }
    return message;
}

export { getPublicActivityErrorMessage };
