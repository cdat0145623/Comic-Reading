import { ImportDiscoveryError } from "../../../domain/errors.js";
import { createSourceOriginPolicy } from "../origin-policy.js";
import {
    mapCatalogChapter,
    parseCatalogPage as parseCatalogPageModule,
} from "./parsers/catalog-parser.js";
import {
    chapterPathForEdition as chapterPathForEditionModule,
    parseChapterHtml,
} from "./parsers/chapter-parser.js";
import {
    buildStoryDiscovery as buildStoryDiscoveryModule,
    parsePublicStoryPage as parsePublicStoryPageModule,
    parseStoryPayload as parseStoryPayloadModule,
} from "./parsers/story-parser.js";

const SOURCE_PROVIDER = "TRUYENDICH_LIVE";
const DEFAULT_SOURCE_ORIGIN = "https://truyendich.live";
const SOURCE_HOSTS = new Set([
    "truyendich.live",
    "www.truyendich.live",
    "truyendich.ai",
    "www.truyendich.ai",
    "truyendich.fit",
]);
const CATALOG_PAGE_SIZE = 200;
const FETCH_TIMEOUT_MS = 6_000;
const MAX_REDIRECTS = 2;
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const ORIGIN_FALLBACK_ERROR_CODES = new Set([
    "SOURCE_TIMEOUT",
    "SOURCE_CONNECTION_FAILED",
    "SOURCE_TLS_FAILED",
    "SOURCE_SERVER_ERROR",
    "SOURCE_RATE_LIMITED",
]);
const BROWSER_FALLBACK_ERROR_CODES = new Set([
    "SOURCE_TIMEOUT",
    "SOURCE_CONNECTION_FAILED",
    "SOURCE_TLS_FAILED",
    "SOURCE_SERVER_ERROR",
    "SOURCE_BROWSER_TIMEOUT",
    "SOURCE_BROWSER_FAILED",
]);

export function shouldUseBrowserFallback(error) {
    return (
        error instanceof ImportDiscoveryError &&
        BROWSER_FALLBACK_ERROR_CODES.has(error.code)
    );
}
const MAX_HTML_SIZE = 5_000_000;

function sleep(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function canonicalOriginForHost(hostname) {
    return hostname.endsWith(".ai")
        ? "https://truyendich.ai"
        : "https://truyendich.live";
}

function isSupportedOrigin(value) {
    try {
        const url = new URL(value);
        return (
            url.protocol === "https:" &&
            SOURCE_HOSTS.has(url.hostname.toLowerCase())
        );
    } catch {
        return false;
    }
}

async function readHealthyFallback(originHealth, preferredOrigin) {
    if (!originHealth) return null;
    try {
        const activeOrigin =
            await originHealth.getHealthyOrigin(SOURCE_PROVIDER);
        return activeOrigin !== preferredOrigin &&
            isSupportedOrigin(activeOrigin)
            ? activeOrigin
            : null;
    } catch {
        return null;
    }
}

async function isDirectOriginUnhealthy(originHealth, origin) {
    if (!originHealth) return false;
    try {
        return await originHealth.isDirectOriginUnhealthy(origin);
    } catch {
        return false;
    }
}

async function markOriginHealthy(originHealth, origin) {
    try {
        await originHealth?.markOriginHealthy(SOURCE_PROVIDER, origin);
    } catch {
        // Source health is an optimization, not authoritative state.
    }
}

async function markDirectOriginUnhealthy(originHealth, origin) {
    try {
        await originHealth?.markDirectOriginUnhealthy(origin);
    } catch {
        // Source health is an optimization, not authoritative state.
    }
}

function toSourceNetworkError(error) {
    const causeCode = String(error?.cause?.code || "");
    const causeMessage = `${error?.message || ""} ${error?.cause?.message || ""}`;
    if (
        error?.name === "TimeoutError" ||
        error?.name === "AbortError" ||
        causeCode.includes("TIMEOUT") ||
        /timed?\s*out|timeout/i.test(causeMessage)
    ) {
        return new ImportDiscoveryError(
            "SOURCE_TIMEOUT",
            `Website nguồn không phản hồi trong ${FETCH_TIMEOUT_MS / 1000} giây.`,
            {
                cause: error,
                category: "SOURCE",
                retryable: true,
            },
        );
    }

    if (
        causeCode.startsWith("ERR_TLS") ||
        causeCode.includes("CERT") ||
        /TLS|SSL|certificate/i.test(causeMessage)
    ) {
        return new ImportDiscoveryError(
            "SOURCE_TLS_FAILED",
            "Không thể thiết lập kết nối bảo mật tới website nguồn.",
            {
                cause: error,
                category: "SOURCE",
                retryable: true,
            },
        );
    }

    return new ImportDiscoveryError(
        "SOURCE_CONNECTION_FAILED",
        "Không thể kết nối tới website nguồn.",
        {
            cause: error,
            category: "SOURCE",
            retryable: true,
        },
    );
}

async function fetchSource(url, options) {
    try {
        return await fetch(url, options);
    } catch (error) {
        throw toSourceNetworkError(error);
    }
}

function throwSourceHttpError(response, { chapter = false } = {}) {
    if (response.status === 404) {
        throw new ImportDiscoveryError(
            chapter ? "SOURCE_CHAPTER_NOT_FOUND" : "SOURCE_NOT_FOUND",
            chapter
                ? "Không tìm thấy chương tại nguồn."
                : "Không tìm thấy truyện tại nguồn.",
            { category: "SOURCE" },
        );
    }
    if (response.status === 401 || response.status === 403) {
        throw new ImportDiscoveryError(
            "SOURCE_ACCESS_DENIED",
            "Website nguồn từ chối quyền truy cập.",
            { category: "SOURCE" },
        );
    }
    if (response.status === 429) {
        throw new ImportDiscoveryError(
            "SOURCE_RATE_LIMITED",
            "Website nguồn đang giới hạn số lượt truy cập. Vui lòng thử lại sau.",
            {
                category: "SOURCE",
                retryable: true,
            },
        );
    }
    if (response.status >= 500) {
        throw new ImportDiscoveryError(
            "SOURCE_SERVER_ERROR",
            `Website nguồn đang gặp lỗi (HTTP ${response.status}).`,
            {
                category: "SOURCE",
                retryable: true,
            },
        );
    }
    throw new ImportDiscoveryError(
        "SOURCE_UNAVAILABLE",
        `Website nguồn không phản hồi hợp lệ (HTTP ${response.status}).`,
        {
            category: "SOURCE",
            retryable: true,
        },
    );
}

async function fetchJson(url, { attempt = 0 } = {}) {
    const response = await fetchSource(url, {
        headers: {
            Accept: "application/json",
            "User-Agent": "MTC-Importer/1.0 (+https://metruyenchu.local)",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
        if (attempt >= MAX_REDIRECTS) {
            throw new ImportDiscoveryError(
                "SOURCE_REDIRECT_LIMIT",
                "Nguồn chuyển hướng quá nhiều lần.",
            );
        }

        const location = response.headers.get("location");
        if (!location) {
            throw new ImportDiscoveryError(
                "SOURCE_INVALID_REDIRECT",
                "Nguồn trả về chuyển hướng không hợp lệ.",
            );
        }
        const redirectUrl = new URL(location, url);
        if (!SOURCE_HOSTS.has(redirectUrl.hostname.toLowerCase())) {
            throw new ImportDiscoveryError(
                "SOURCE_INVALID_REDIRECT",
                "Nguồn chuyển hướng sang domain không được hỗ trợ.",
            );
        }
        return fetchJson(redirectUrl, { attempt: attempt + 1 });
    }

    if (RETRYABLE_STATUS.has(response.status) && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(
            Number.isFinite(retryAfter) && retryAfter > 0
                ? Math.min(retryAfter * 1000, 5000)
                : 500 * 2 ** attempt,
        );
        return fetchJson(url, { attempt: attempt + 1 });
    }

    if (!response.ok) {
        throwSourceHttpError(response);
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > 5_000_000) {
        throw new ImportDiscoveryError(
            "SOURCE_RESPONSE_TOO_LARGE",
            "Dữ liệu nguồn vượt quá giới hạn cho phép.",
        );
    }

    try {
        return {
            data: await response.json(),
            url: response.url || String(url),
        };
    } catch (error) {
        throw new ImportDiscoveryError(
            "SOURCE_RESPONSE_INVALID",
            "Nguồn trả về dữ liệu không hợp lệ.",
            { cause: error },
        );
    }
}

async function fetchHtml(url, { attempt = 0 } = {}) {
    const response = await fetchSource(url, {
        headers: {
            Accept: "text/html,application/xhtml+xml",
            "User-Agent": "MTC-Importer/1.0 (+https://metruyenchu.local)",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        cache: "no-store",
    });

    if (response.status >= 300 && response.status < 400) {
        if (attempt >= MAX_REDIRECTS) {
            throw new ImportDiscoveryError(
                "SOURCE_REDIRECT_LIMIT",
                "Nguồn chuyển hướng quá nhiều lần.",
            );
        }

        const location = response.headers.get("location");
        const redirectUrl = location ? new URL(location, url) : null;
        if (
            !redirectUrl ||
            !SOURCE_HOSTS.has(redirectUrl.hostname.toLowerCase())
        ) {
            throw new ImportDiscoveryError(
                "SOURCE_INVALID_REDIRECT",
                "Nguồn chuyển hướng sang domain không được hỗ trợ.",
            );
        }
        return fetchHtml(redirectUrl, { attempt: attempt + 1 });
    }

    if (RETRYABLE_STATUS.has(response.status) && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await sleep(
            Number.isFinite(retryAfter) && retryAfter > 0
                ? Math.min(retryAfter * 1000, 5000)
                : 500 * 2 ** attempt,
        );
        return fetchHtml(url, { attempt: attempt + 1 });
    }

    if (!response.ok) {
        throwSourceHttpError(response, { chapter: true });
    }

    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_HTML_SIZE) {
        throw new ImportDiscoveryError(
            "SOURCE_RESPONSE_TOO_LARGE",
            "Trang chapter vượt quá giới hạn cho phép.",
        );
    }

    const html = await response.text();
    if (Buffer.byteLength(html, "utf8") > MAX_HTML_SIZE) {
        throw new ImportDiscoveryError(
            "SOURCE_RESPONSE_TOO_LARGE",
            "Trang chapter vượt quá giới hạn cho phép.",
        );
    }
    return {
        data: html,
        url: response.url || String(url),
    };
}

async function fetchFromSourceOrigins({
    preferredOrigin,
    pathname,
    responseType,
    browserTransport,
    transportState,
    originHealth,
}) {
    const policy = createSourceOriginPolicy({
        provider: SOURCE_PROVIDER,
        allowedOrigins: [
            "https://truyendich.live",
            "https://truyendich.ai",
            "https://truyendich.fit",
        ],
        directTransport: {
            fetch: (url, options) =>
                options.responseType === "html"
                    ? fetchHtml(url)
                    : fetchJson(url),
        },
        fallbackTransports: browserTransport
            ? [
                  {
                      fetch: async (url, options) => {
                          const result = await browserTransport.fetch(url, options);
                          if (transportState) transportState.preferBrowser = true;
                          return { ...result, transport: result.transport || "CHROMIUM" };
                      },
                  },
              ]
            : [],
        originHealth,
        shouldSkipOrigin: (origin) =>
            isDirectOriginUnhealthy(originHealth, origin),
        preferFallback: transportState?.preferBrowser,
    });
    return policy.fetch({ preferredOrigin, pathname, responseType });
    /*
    const healthyFallback = await readHealthyFallback(
        originHealth,
        preferredOrigin,
    );
    const origins = [
        preferredOrigin,
        ...(healthyFallback ? [healthyFallback] : []),
    ];
    let lastError;
    let directSkipped = false;

    if (!transportState?.preferBrowser) {
        for (const origin of origins) {
            if (await isDirectOriginUnhealthy(originHealth, origin)) {
                directSkipped = true;
                continue;
            }
            try {
                const url = new URL(pathname, origin).toString();
                const result =
                    responseType === "html"
                        ? await fetchHtml(url)
                        : await fetchJson(url);
                const activeOrigin = new URL(result.url).origin;
                await markOriginHealthy(originHealth, activeOrigin);
                return {
                    data: result.data,
                    origin: activeOrigin,
                    url: result.url,
                    transport: "DIRECT",
                };
            } catch (error) {
                lastError = error;
                if (
                    !(error instanceof ImportDiscoveryError) ||
                    !ORIGIN_FALLBACK_ERROR_CODES.has(error.code)
                ) {
                    throw error;
                }
                await markDirectOriginUnhealthy(originHealth, origin);
            }
        }
    }

    if (
        browserTransport &&
        (transportState?.preferBrowser ||
            directSkipped ||
            (lastError instanceof ImportDiscoveryError &&
                BROWSER_FALLBACK_ERROR_CODES.has(lastError.code)))
    ) {
        for (const origin of origins) {
            try {
                const url = new URL(pathname, origin).toString();
                const result = await browserTransport.fetch(url, {
                    responseType,
                });
                if (transportState) transportState.preferBrowser = true;
                const activeOrigin = new URL(result.url).origin;
                await markOriginHealthy(originHealth, activeOrigin);
                return {
                    data: result.data,
                    origin: activeOrigin,
                    url: result.url,
                    transport: result.transport || "CHROMIUM",
                };
            } catch (error) {
                lastError = error;
                if (
                    !(error instanceof ImportDiscoveryError) ||
                    !BROWSER_FALLBACK_ERROR_CODES.has(error.code)
                ) {
                    throw error;
                }
            }
        }
    }

    throw (
        lastError ||
        new ImportDiscoveryError(
            "SOURCE_CONNECTION_FAILED",
            "Không có transport khả dụng để kết nối website nguồn.",
            { category: "SOURCE", retryable: true },
        )
    );
    */
}

export function normalizeTruyenDichLiveUrl(value) {
    let url;
    try {
        url = new URL(value);
    } catch {
        throw new ImportDiscoveryError(
            "INVALID_SOURCE_URL",
            "URL nguồn không hợp lệ.",
        );
    }

    if (url.protocol !== "https:") {
        throw new ImportDiscoveryError(
            "INVALID_SOURCE_URL",
            "URL nguồn phải sử dụng HTTPS.",
        );
    }
    if (!SOURCE_HOSTS.has(url.hostname.toLowerCase())) {
        throw new ImportDiscoveryError(
            "UNSUPPORTED_SOURCE",
            "Phase này chỉ hỗ trợ nguồn truyendich.live hoặc truyendich.ai.",
        );
    }

    const match = url.pathname.match(/^\/doc-truyen\/([^/]+)\/?$/);
    if (!match) {
        throw new ImportDiscoveryError(
            "INVALID_SOURCE_URL",
            "URL phải trỏ tới trang chi tiết của một truyện.",
        );
    }

    const sourceSlug = decodeURIComponent(match[1]).trim().toLowerCase();
    const sourceOrigin = canonicalOriginForHost(url.hostname.toLowerCase());
    return {
        provider: "TRUYENDICH_LIVE",
        sourceSlug,
        sourceOrigin,
        canonicalUrl: `${sourceOrigin}/doc-truyen/${encodeURIComponent(sourceSlug)}`,
    };
}

async function mapConcurrent(values, concurrency, mapper) {
    const results = new Array(values.length);
    let cursor = 0;

    async function worker() {
        while (cursor < values.length) {
            const index = cursor;
            cursor += 1;
            results[index] = await mapper(values[index], index);
        }
    }

    await Promise.all(
        Array.from({ length: Math.min(concurrency, values.length) }, () =>
            worker(),
        ),
    );
    return results;
}

async function fetchCatalogPage({
    sourceSlug,
    preferredOrigin,
    page,
    browserTransport,
    transportState,
    originHealth,
}) {
    const result = await fetchFromSourceOrigins({
        preferredOrigin,
        pathname: `/api/novels/${sourceSlug}/chapters?page=${page}&size=${CATALOG_PAGE_SIZE}`,
        responseType: "json",
        browserTransport,
        transportState,
        originHealth,
    });
    return {
        ...result,
        page: parseCatalogPageModule(result.data, page),
    };
}

async function probePublicStoryPage({
    source,
    browserTransport,
    transportState,
    originHealth,
}) {
    if (!browserTransport) {
        throw new ImportDiscoveryError(
            "SOURCE_ACCESS_DENIED",
            "Website nguồn từ chối quyền truy cập.",
            { category: "SOURCE" },
        );
    }

    transportState.preferBrowser = true;
    const pageResult = await fetchFromSourceOrigins({
        preferredOrigin: source.sourceOrigin,
        pathname: `/doc-truyen/${encodeURIComponent(source.sourceSlug)}`,
        responseType: "html",
        browserTransport,
        transportState,
        originHealth,
    });
    const parsed = parsePublicStoryPageModule(pageResult.data, {
        source,
        activeOrigin: pageResult.origin,
    });

    return {
        ...parsed,
        transport: pageResult.transport,
    };
}

export async function probeTruyenDichLiveStory(
    sourceUrl,
    { browserTransport, originHealth } = {},
) {
    const source = normalizeTruyenDichLiveUrl(sourceUrl);
    const transportState = { preferBrowser: false };
    let metadataResult;
    let storyPayload;
    let firstPage;
    let pageCount;
    let fetchTransport;
    let usedPublicPageFallback = false;

    try {
        metadataResult = await fetchFromSourceOrigins({
            preferredOrigin: source.sourceOrigin,
            pathname: `/api/novels/${source.sourceSlug}`,
            responseType: "json",
            browserTransport,
            transportState,
            originHealth,
        });
        storyPayload = parseStoryPayloadModule(metadataResult.data);
        const firstPageResult = await fetchCatalogPage({
            sourceSlug: source.sourceSlug,
            preferredOrigin: metadataResult.origin,
            page: 1,
            browserTransport,
            transportState,
            originHealth,
        });
        firstPage = firstPageResult.page;
        pageCount = Math.ceil(firstPage.total / CATALOG_PAGE_SIZE);
        fetchTransport =
            metadataResult.transport !== "DIRECT"
                ? metadataResult.transport
                : firstPageResult.transport;
    } catch (error) {
        if (
            !(error instanceof ImportDiscoveryError) ||
            error.code !== "SOURCE_ACCESS_DENIED"
        ) {
            throw error;
        }

        const publicPage = await probePublicStoryPage({
            source,
            browserTransport,
            transportState,
            originHealth,
        });
        metadataResult = {
            origin: publicPage.activeOrigin,
            transport: publicPage.transport,
        };
        storyPayload = publicPage.storyPayload;
        firstPage = publicPage.catalogPage;
        pageCount = Math.ceil(firstPage.total / firstPage.size);
        fetchTransport = publicPage.transport;
        usedPublicPageFallback = true;
    }

    const shared = buildStoryDiscoveryModule({
        source,
        activeOrigin: metadataResult.origin,
        storyPayload,
        totalChapters: firstPage.total,
    });
    const firstChapter = firstPage.items[0]
        ? mapCatalogChapter(firstPage.items[0], shared.canonicalUrl)
        : null;
    const warnings = [];
    if (usedPublicPageFallback) {
        warnings.push(
            "API metadata bị nguồn từ chối; discovery đã dùng trang truyện công khai.",
        );
    }
    if (storyPayload.latest_chapter_number !== firstPage.total) {
        warnings.push(
            `Metadata báo ${storyPayload.latest_chapter_number} chương nhưng catalog có ${firstPage.total}.`,
        );
    }

    return {
        ...shared,
        catalog: {
            count: firstPage.total,
            pageCount,
            first: firstChapter,
            last: null,
        },
        warnings,
        fetchTransport,
    };
}

export async function prepareTruyenDichLiveCatalog(
    sourceUrl,
    { browserTransport, originHealth, onPage } = {},
) {
    const source = normalizeTruyenDichLiveUrl(sourceUrl);
    const transportState = { preferBrowser: false };
    const firstPageResult = await fetchCatalogPage({
        sourceSlug: source.sourceSlug,
        preferredOrigin: source.sourceOrigin,
        page: 1,
        browserTransport,
        transportState,
        originHealth,
    });
    const activeOrigin = firstPageResult.origin;
    const canonicalUrl = `${activeOrigin}/doc-truyen/${encodeURIComponent(source.sourceSlug)}`;
    const pageCount = Math.ceil(firstPageResult.page.total / CATALOG_PAGE_SIZE);
    const pages = [firstPageResult.page];
    await onPage?.({
        page: 1,
        pageCount,
        totalChapters: firstPageResult.page.total,
        chapters: firstPageResult.page.items.map((chapter) =>
            mapCatalogChapter(chapter, canonicalUrl),
        ),
    });

    for (let page = 2; page <= pageCount; page += 1) {
        const pageResult = await fetchCatalogPage({
            sourceSlug: source.sourceSlug,
            preferredOrigin: activeOrigin,
            page,
            browserTransport,
            transportState,
            originHealth,
        });
        pages.push(pageResult.page);
        await onPage?.({
            page,
            pageCount,
            totalChapters: firstPageResult.page.total,
            chapters: pageResult.page.items.map((chapter) =>
                mapCatalogChapter(chapter, canonicalUrl),
            ),
        });
    }

    const chapters = pages
        .flatMap((page) => page.items)
        .map((chapter) => mapCatalogChapter(chapter, canonicalUrl))
        .sort((left, right) => left.number - right.number);
    return {
        chapters,
        pageCount,
        totalChapters: firstPageResult.page.total,
        activeOrigin,
    };
}

export async function fetchTruyenDichLiveChapter({
    sourceSlug,
    sourceCanonicalUrl,
    chapterNumber,
    editionExternalId,
    editionName,
    browserTransport,
}) {
    const pathname = chapterPathForEditionModule({
        sourceSlug,
        chapterNumber,
        editionName,
    });
    const preferredOrigin = sourceCanonicalUrl
        ? new URL(sourceCanonicalUrl).origin
        : DEFAULT_SOURCE_ORIGIN;
    const {
        data: html,
        url: sourceUrl,
        transport,
    } = await fetchFromSourceOrigins({
        preferredOrigin,
        pathname,
        responseType: "html",
        browserTransport,
    });

    return {
        ...parseChapterHtml(html, {
            expectedChapterNumber: chapterNumber,
            expectedEditionExternalId: editionExternalId,
            expectedEditionName: editionName,
            sourceUrl,
        }),
        fetchTransport: transport,
    };
}

export async function discoverTruyenDichLiveStory(
    sourceUrl,
    { browserTransport, originHealth } = {},
) {
    const source = normalizeTruyenDichLiveUrl(sourceUrl);
    const transportState = { preferBrowser: false };
    const metadataResult = await fetchFromSourceOrigins({
        preferredOrigin: source.sourceOrigin,
        pathname: `/api/novels/${source.sourceSlug}`,
        responseType: "json",
        browserTransport,
        transportState,
        originHealth,
    });
    const activeOrigin = metadataResult.origin;

    const storyPayload = parseStoryPayloadModule(metadataResult.data);

    const firstPageResult = await fetchFromSourceOrigins({
        preferredOrigin: activeOrigin,
        pathname: `/api/novels/${source.sourceSlug}/chapters?page=1&size=${CATALOG_PAGE_SIZE}`,
        responseType: "json",
        browserTransport,
        transportState,
        originHealth,
    });
    const firstPage = parseCatalogPageModule(firstPageResult.data, 1);

    const pageCount = Math.ceil(firstPage.total / CATALOG_PAGE_SIZE);
    const remainingPages = Array.from(
        { length: Math.max(0, pageCount - 1) },
        (_, index) => index + 2,
    );
    const pages = await mapConcurrent(remainingPages, 1, async (page) => {
        const pageResult = await fetchFromSourceOrigins({
            preferredOrigin: activeOrigin,
            pathname: `/api/novels/${source.sourceSlug}/chapters?page=${page}&size=${CATALOG_PAGE_SIZE}`,
            responseType: "json",
            browserTransport,
            transportState,
            originHealth,
        });
        return parseCatalogPageModule(pageResult.data, page);
    });
    const canonicalUrl = `${activeOrigin}/doc-truyen/${encodeURIComponent(source.sourceSlug)}`;
    const chapters = [firstPage, ...pages]
        .flatMap((page) => page.items)
        .map((chapter) => mapCatalogChapter(chapter, canonicalUrl))
        .sort((left, right) => left.number - right.number);

    const warnings = [];
    if (chapters.length !== firstPage.total) {
        warnings.push(
            `Catalog trả về ${chapters.length}/${firstPage.total} chương.`,
        );
    }
    const uniqueExternalIds = new Set(
        chapters.map((chapter) => chapter.externalChapterId),
    );
    if (uniqueExternalIds.size !== chapters.length) {
        throw new ImportDiscoveryError(
            "CATALOG_DUPLICATE_ID",
            "Catalog nguồn chứa chapter ID bị trùng.",
        );
    }
    if (storyPayload.latest_chapter_number !== firstPage.total) {
        warnings.push(
            `Metadata báo ${storyPayload.latest_chapter_number} chương nhưng catalog có ${firstPage.total}.`,
        );
    }

    return {
        ...buildStoryDiscoveryModule({
            source,
            activeOrigin,
            storyPayload,
            totalChapters: firstPage.total,
        }),
        chapters,
        warnings,
        fetchTransport: metadataResult.transport,
    };
}

export function parseTruyenDichLiveChapterHtml(html, options) {
    return parseChapterHtml(html, options);
}

export function createTruyenDichLiveSourceAdapter() {
    return {
        provider: SOURCE_PROVIDER,
        canHandle(value) {
            try {
                normalizeTruyenDichLiveUrl(value);
                return true;
            } catch {
                return false;
            }
        },
        normalizeUrl(value) {
            return normalizeTruyenDichLiveUrl(value);
        },
        probeStory(value, context) {
            return probeTruyenDichLiveStory(value, context);
        },
        discoverStory(value, context) {
            return discoverTruyenDichLiveStory(value, context);
        },
        prepareCatalog(value, context) {
            return prepareTruyenDichLiveCatalog(value, context);
        },
        fetchChapter(input, context = {}) {
            return fetchTruyenDichLiveChapter({ ...input, ...context });
        },
    };
}
