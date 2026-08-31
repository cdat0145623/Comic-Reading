import { ImportDiscoveryError } from "../../domain/errors.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const SUPPORTED_HOSTS = new Set([
    "truyendich.live",
    "www.truyendich.live",
    "truyendich.ai",
    "www.truyendich.ai",
]);

function assertSupportedUrl(value) {
    const url = new URL(value);
    if (
        url.protocol !== "https:" ||
        !SUPPORTED_HOSTS.has(url.hostname.toLowerCase())
    ) {
        throw new ImportDiscoveryError(
            "UNSUPPORTED_SOURCE",
            "Chromium chỉ được truy cập domain nguồn đã cho phép.",
        );
    }
    return url;
}

function browserError(error) {
    if (/timeout/i.test(error?.message || "")) {
        return new ImportDiscoveryError(
            "SOURCE_BROWSER_TIMEOUT",
            "Trình duyệt nguồn phản hồi quá thời gian cho phép.",
            { cause: error, category: "SOURCE", retryable: true },
        );
    }
    return new ImportDiscoveryError(
        "SOURCE_BROWSER_FAILED",
        "Không thể tải website nguồn bằng trình duyệt dự phòng.",
        { cause: error, category: "SOURCE", retryable: true },
    );
}

export async function createChromiumSourceTransport({
    timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
    const { chromium } = await import("playwright");
    let browser;
    let context;

    async function ensureContext() {
        if (context) return context;
        browser ||= await chromium.launch({ headless: true });
        context = await browser.newContext({
            locale: "vi-VN",
            userAgent:
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) " +
                "AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/131.0.0.0 Safari/537.36",
        });
        await context.route("**/*", async (route) => {
            const type = route.request().resourceType();
            if (["image", "font", "media"].includes(type)) {
                await route.abort();
                return;
            }
            await route.continue();
        });
        return context;
    }

    async function reset() {
        if (context) {
            await context.close().catch(() => undefined);
            context = undefined;
        }
        if (browser) {
            await browser.close().catch(() => undefined);
            browser = undefined;
        }
    }

    return {
        async fetch(urlValue, { responseType }) {
            const requestedUrl = assertSupportedUrl(urlValue);
            const activeContext = await ensureContext();
            const page = await activeContext.newPage();

            try {
                const response = await page.goto(requestedUrl.toString(), {
                    waitUntil: "domcontentloaded",
                    timeout: timeoutMs,
                });
                if (!response) {
                    throw new ImportDiscoveryError(
                        "SOURCE_BROWSER_FAILED",
                        "Trình duyệt không nhận được phản hồi từ website nguồn.",
                        { category: "SOURCE", retryable: true },
                    );
                }

                const finalUrl = assertSupportedUrl(page.url());
                const status = response.status();
                if (status === 404) {
                    throw new ImportDiscoveryError(
                        responseType === "html"
                            ? "SOURCE_CHAPTER_NOT_FOUND"
                            : "SOURCE_NOT_FOUND",
                        responseType === "html"
                            ? "Không tìm thấy chương tại nguồn."
                            : "Không tìm thấy truyện tại nguồn.",
                        { category: "SOURCE" },
                    );
                }
                if (status === 401 || status === 403) {
                    throw new ImportDiscoveryError(
                        "SOURCE_ACCESS_DENIED",
                        "Website nguồn từ chối quyền truy cập.",
                        { category: "SOURCE" },
                    );
                }
                if (status >= 400) {
                    throw new ImportDiscoveryError(
                        "SOURCE_SERVER_ERROR",
                        `Website nguồn trả về HTTP ${status}.`,
                        {
                            category: "SOURCE",
                            retryable: status >= 500 || status === 429,
                        },
                    );
                }

                let body = await response.text();
                if (
                    responseType === "json" &&
                    !body.trim().startsWith("{") &&
                    !body.trim().startsWith("[")
                ) {
                    body = await page.locator("body").innerText();
                }

                return {
                    data:
                        responseType === "json"
                            ? JSON.parse(body)
                            : body,
                    url: finalUrl.toString(),
                };
            } catch (error) {
                if (error instanceof ImportDiscoveryError) throw error;
                if (error instanceof SyntaxError) {
                    throw new ImportDiscoveryError(
                        "SOURCE_RESPONSE_INVALID",
                        "Nguồn trả về dữ liệu không hợp lệ qua Chromium.",
                        { cause: error, category: "SOURCE" },
                    );
                }
                throw browserError(error);
            } finally {
                await page.close();
            }
        },
        reset,
        async close() {
            await reset();
        },
    };
}
