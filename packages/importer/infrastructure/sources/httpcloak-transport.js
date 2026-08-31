import { ImportDiscoveryError } from "../../domain/errors.js";

const DEFAULT_TIMEOUT_SECONDS = 15;
const MAX_RESPONSE_SIZE = 5_000_000;
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
            "HTTPCloak chỉ được truy cập domain nguồn đã cho phép.",
        );
    }
    return url;
}

function throwSourceHttpError(status, { responseType }) {
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
    if (status === 429) {
        throw new ImportDiscoveryError(
            "SOURCE_RATE_LIMITED",
            "Website nguồn đang giới hạn số lượt truy cập. Vui lòng thử lại sau.",
            { category: "SOURCE", retryable: true },
        );
    }
    throw new ImportDiscoveryError(
        "SOURCE_SERVER_ERROR",
        `Website nguồn trả về HTTP ${status}.`,
        {
            category: "SOURCE",
            retryable: status >= 500,
        },
    );
}

function toTransportError(error, timeoutSeconds) {
    if (error instanceof ImportDiscoveryError) return error;
    if (/timeout|timed out/i.test(error?.message || "")) {
        return new ImportDiscoveryError(
            "SOURCE_HTTPCLOAK_TIMEOUT",
            `Kết nối HTTP/3 tới nguồn không phản hồi trong ${timeoutSeconds} giây.`,
            { cause: error, category: "SOURCE", retryable: true },
        );
    }
    return new ImportDiscoveryError(
        "SOURCE_HTTPCLOAK_FAILED",
        "Không thể tải website nguồn bằng kết nối HTTP/3 dự phòng.",
        { cause: error, category: "SOURCE", retryable: true },
    );
}

export function shouldFallbackFromHttpCloak(error) {
    return (
        error instanceof ImportDiscoveryError &&
        [
            "SOURCE_HTTPCLOAK_TIMEOUT",
            "SOURCE_HTTPCLOAK_FAILED",
            "SOURCE_RESPONSE_INVALID",
            "SOURCE_ACCESS_DENIED",
        ].includes(error.code)
    );
}

export async function createHttpCloakSourceTransport({
    timeoutSeconds = DEFAULT_TIMEOUT_SECONDS,
    sessionFactory,
} = {}) {
    let session;

    async function ensureSession() {
        if (session) return session;
        if (sessionFactory) {
            session = await sessionFactory();
            return session;
        }

        const { Session } = await import("httpcloak");
        session = new Session({
            preset: "chrome-latest",
            httpVersion: "h3",
            timeout: timeoutSeconds,
            allowRedirects: true,
            maxRedirects: 2,
            retry: 0,
        });
        return session;
    }

    async function reset() {
        session?.close?.();
        session = undefined;
    }

    return {
        async fetch(urlValue, { responseType }) {
            const requestedUrl = assertSupportedUrl(urlValue);
            try {
                const activeSession = await ensureSession();
                const response = await activeSession.get(
                    requestedUrl.toString(),
                    {
                        headers: {
                            Accept:
                                responseType === "json"
                                    ? "application/json"
                                    : "text/html,application/xhtml+xml",
                        },
                        fetchMode:
                            responseType === "json" ? "cors" : "navigate",
                        timeout: timeoutSeconds,
                        disableConditionalCache: true,
                    },
                );

                const finalUrl = assertSupportedUrl(
                    response.url || requestedUrl,
                );
                if (!response.ok) {
                    throwSourceHttpError(response.statusCode, {
                        responseType,
                    });
                }
                if (response.body.length > MAX_RESPONSE_SIZE) {
                    throw new ImportDiscoveryError(
                        "SOURCE_RESPONSE_TOO_LARGE",
                        "Dữ liệu nguồn vượt quá giới hạn cho phép.",
                        { category: "SOURCE" },
                    );
                }

                let data = response.text;
                if (responseType === "json") {
                    try {
                        data = JSON.parse(data);
                    } catch (error) {
                        throw new ImportDiscoveryError(
                            "SOURCE_RESPONSE_INVALID",
                            "Nguồn trả về JSON không hợp lệ qua HTTP/3.",
                            { cause: error, category: "SOURCE" },
                        );
                    }
                }

                return {
                    data,
                    url: finalUrl.toString(),
                    transport: "HTTPCLOAK",
                    protocol: response.protocol,
                };
            } catch (error) {
                throw toTransportError(error, timeoutSeconds);
            }
        },
        reset,
        close: reset,
    };
}
