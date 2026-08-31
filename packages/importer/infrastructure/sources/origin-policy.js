import { ImportDiscoveryError } from "../../domain/errors.js";

const DEFAULT_RETRYABLE_CODES = new Set([
    "SOURCE_TIMEOUT",
    "SOURCE_CONNECTION_FAILED",
    "SOURCE_TLS_FAILED",
    "SOURCE_SERVER_ERROR",
    "SOURCE_RATE_LIMITED",
    "SOURCE_HTTPCLOAK_TIMEOUT",
    "SOURCE_HTTPCLOAK_FAILED",
    "SOURCE_RESPONSE_INVALID",
    "SOURCE_BROWSER_TIMEOUT",
    "SOURCE_BROWSER_FAILED",
]);

function normalizeOrigins(origins) {
    return new Set(
        origins.map((origin) => {
            try {
                return new URL(origin).origin;
            } catch {
                return String(origin).replace(/\/$/, "");
            }
        }),
    );
}

export function createSourceOriginPolicy({
    allowedOrigins = [],
    directTransport,
    fallbackTransports = [],
    isRetryable = (error) =>
        error instanceof ImportDiscoveryError &&
        DEFAULT_RETRYABLE_CODES.has(error.code),
    originHealth,
    provider,
    shouldSkipOrigin = async () => false,
    preferFallback = false,
} = {}) {
    if (!directTransport?.fetch) {
        throw new TypeError("Origin policy requires a direct transport.");
    }
    const allowed = normalizeOrigins(allowedOrigins);

    function assertAllowedOrigin(value) {
        let origin;
        try {
            origin = new URL(value).origin;
        } catch {
            throw new ImportDiscoveryError(
                "INVALID_SOURCE_URL",
                "URL nguồn không hợp lệ.",
            );
        }
        if (allowed.size && !allowed.has(origin)) {
            throw new ImportDiscoveryError(
                "UNSUPPORTED_SOURCE",
                "Origin nguồn không nằm trong allowlist.",
                { category: "VALIDATION" },
            );
        }
        return origin;
    }

    async function fetch({ preferredOrigin, pathname, responseType }) {
        const origin = assertAllowedOrigin(preferredOrigin);
        const url = new URL(pathname, origin).toString();
        let lastError;

        const healthyFallback = await originHealth?.getHealthyOrigin?.(provider);
        const origins = [
            origin,
            ...(healthyFallback && healthyFallback !== origin
                ? [assertAllowedOrigin(healthyFallback)]
                : []),
        ];

        for (const candidateOrigin of origins) {
            if (preferFallback || await shouldSkipOrigin(candidateOrigin)) continue;
            try {
                const result = await directTransport.fetch(
                    new URL(pathname, candidateOrigin).toString(),
                    { responseType },
                );
                const finalOrigin = assertAllowedOrigin(result.url || candidateOrigin);
                await originHealth?.markOriginHealthy?.(provider, finalOrigin).catch?.(() => undefined);
                return { ...result, origin: finalOrigin, transport: result.transport || "DIRECT" };
            } catch (error) {
                lastError = error;
                if (!isRetryable(error)) throw error;
                await originHealth?.markDirectOriginUnhealthy?.(candidateOrigin).catch?.(() => undefined);
            }
        }

        for (const transport of fallbackTransports) {
            try {
                const result = await transport.fetch(
                    new URL(pathname, origin).toString(),
                    { responseType },
                );
                const finalOrigin = assertAllowedOrigin(result.url || origin);
                await originHealth?.markOriginHealthy?.(provider, finalOrigin).catch?.(() => undefined);
                return { ...result, origin: finalOrigin };
            } catch (error) {
                lastError = error;
                if (!isRetryable(error)) throw error;
            }
        }

        throw lastError || new ImportDiscoveryError(
            "SOURCE_CONNECTION_FAILED",
            "Không có transport khả dụng để kết nối website nguồn.",
            { category: "SOURCE", retryable: true },
        );
    }

    return { fetch, assertAllowedOrigin };
}
