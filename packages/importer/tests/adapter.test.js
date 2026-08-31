import assert from "node:assert/strict";
import test, { afterEach } from "node:test";

import {
    discoverTruyenDichLiveStory,
    normalizeTruyenDichLiveUrl,
    parseTruyenDichLiveChapterHtml,
    prepareTruyenDichLiveCatalog,
    probeTruyenDichLiveStory,
} from "../truyendich-live-adapter.js";
import {
    hashChapterContent,
    normalizeChapterContent,
} from "../chapter-content.js";

const originalFetch = globalThis.fetch;

afterEach(() => {
    globalThis.fetch = originalFetch;
});

test("normalizeTruyenDichLiveUrl canonicalizes a supported story URL", () => {
    assert.deepEqual(
        normalizeTruyenDichLiveUrl(
            "https://www.truyendich.live/doc-truyen/Pham-Nhan-Tien-Duyen/",
        ),
        {
            provider: "TRUYENDICH_LIVE",
            sourceSlug: "pham-nhan-tien-duyen",
            sourceOrigin: "https://truyendich.live",
            canonicalUrl:
                "https://truyendich.live/doc-truyen/pham-nhan-tien-duyen",
        },
    );
});

test("normalizeTruyenDichLiveUrl accepts the supported .ai alias", () => {
    assert.deepEqual(
        normalizeTruyenDichLiveUrl(
            "https://truyendich.ai/doc-truyen/test-story",
        ),
        {
            provider: "TRUYENDICH_LIVE",
            sourceSlug: "test-story",
            sourceOrigin: "https://truyendich.ai",
            canonicalUrl:
                "https://truyendich.ai/doc-truyen/test-story",
        },
    );
});

test("normalizeTruyenDichLiveUrl rejects unsupported hosts", () => {
    assert.throws(
        () =>
            normalizeTruyenDichLiveUrl(
                "https://example.com/doc-truyen/test",
            ),
        { code: "UNSUPPORTED_SOURCE" },
    );
});

test("discoverTruyenDichLiveStory fetches and sorts every catalog page", async () => {
    const chapters = Array.from({ length: 201 }, (_, index) => ({
        id: index + 1000,
        chapter_number: index + 1,
        title: `Chương ${index + 1}`,
        status: "COMPLETED",
        update_time: "2026-07-24T08:00:00.000Z",
    }));
    const requests = [];

    globalThis.fetch = async (url) => {
        requests.push(String(url));
        if (String(url).endsWith("/api/novels/test-story")) {
            return Response.json({
                id: 10,
                title: "Test Story",
                slug: "test-story",
                image_url: "/cover.webp",
                status: "completed",
                author: "Test Author",
                latest_chapter_number: 201,
                description:
                    "<p>Đoạn một.</p><script>alert(1)</script><p>Đoạn hai.</p>",
                categories: [
                    { id: 1, name: "Tiên Hiệp", slug: "tien-hiep" },
                ],
                editions: [
                    {
                        id: 10,
                        edition_name: "convert",
                        first_chapter_slug: "1",
                    },
                ],
            });
        }

        const page = new URL(url).searchParams.get("page");
        return Response.json({
            total: 201,
            page: Number(page),
            size: 200,
            items:
                page === "1"
                    ? chapters.slice(0, 200).reverse()
                    : chapters.slice(200),
        });
    };

    const result = await discoverTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
    );

    assert.equal(result.chapters.length, 201);
    assert.equal(result.chapters[0].number, 1);
    assert.equal(result.chapters.at(-1).number, 201);
    assert.equal(result.story.description, "Đoạn một.\n\nĐoạn hai.");
    assert.equal(result.story.coverUrl, "https://truyendich.live/cover.webp");
    assert.equal(requests.length, 3);
});

test("probeTruyenDichLiveStory only fetches metadata plus the first catalog page", async () => {
    const chapters = Array.from({ length: 401 }, (_, index) => ({
        id: index + 1000,
        chapter_number: index + 1,
        title: `Chương ${index + 1}`,
        status: "COMPLETED",
        update_time: "2026-07-24T08:00:00.000Z",
    }));
    const requestedPages = [];

    globalThis.fetch = async (url) => {
        const requestUrl = String(url);
        if (requestUrl.endsWith("/api/novels/test-story")) {
            return Response.json({
                id: 10,
                title: "Test Story",
                slug: "test-story",
                image_url: "/cover.webp",
                status: "ongoing",
                author: "Test Author",
                latest_chapter_number: 401,
                description: "<p>Story description.</p>",
                categories: [],
                editions: [
                    {
                        id: 20,
                        edition_name: "convert",
                        first_chapter_slug: "1",
                    },
                ],
            });
        }

        const page = Number(new URL(requestUrl).searchParams.get("page"));
        requestedPages.push(page);
        const offset = (page - 1) * 200;
        return Response.json({
            total: chapters.length,
            page,
            size: 200,
            items: chapters.slice(offset, offset + 200),
        });
    };

    const result = await probeTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
    );

    assert.deepEqual(requestedPages, [1]);
    assert.equal(result.catalog.count, 401);
    assert.equal(result.catalog.pageCount, 3);
    assert.equal(result.catalog.first.number, 1);
    assert.equal(result.catalog.last, null);
    assert.equal(result.chapters, undefined);
});

test("probe falls back to the public story page when the JSON API denies access", async () => {
    globalThis.fetch = async () => new Response(null, { status: 403 });
    const catalog = {
        total: 2,
        page: 1,
        size: 50,
        items: [
            {
                id: 101,
                chapter_number: 1,
                title: "Chương đầu",
                status: "COMPLETED",
                update_time: "2026-07-24T08:00:00.000Z",
            },
            {
                id: 102,
                chapter_number: 2,
                title: "Chương hai",
                status: "COMPLETED",
                update_time: "2026-07-25T08:00:00.000Z",
            },
        ],
    };
    const html = `
        <html>
            <body>
                <h1>Test Story</h1>
                <div>Trạng thái Đang ra</div>
                <a href="/doc-truyen/cv/test-story">Convert</a>
                <script type="application/ld+json">
                    ${JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Book",
                        name: "Test Story",
                        description: "Story description.",
                        author: { "@type": "Person", name: "Test Author" },
                        genre: "Tiên Hiệp, Huyền Huyễn",
                        image: "/cover.webp",
                    })}
                </script>
                <script>
                    self.__next_f.push([1,${JSON.stringify(
                        `"initialData":${JSON.stringify(catalog)},"slug":"test-story"`,
                    )}])
                </script>
                <script>
                    self.__next_f.push([1,${JSON.stringify(
                        '"novelId":10,"novelSlug":"test-story"',
                    )}])
                </script>
            </body>
        </html>
    `;
    const calls = [];

    const result = await probeTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
        {
            browserTransport: {
                async fetch(url, options) {
                    calls.push({ url, options });
                    return {
                        data: html,
                        url,
                        transport: "HTTPCLOAK",
                    };
                },
            },
        },
    );

    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.responseType, "html");
    assert.equal(result.source.externalNovelId, "10");
    assert.equal(result.story.title, "Test Story");
    assert.equal(result.story.authorName, "Test Author");
    assert.equal(result.story.coverUrl, "https://truyendich.live/cover.webp");
    assert.equal(result.story.totalChapters, 2);
    assert.deepEqual(
        result.story.editions.map((edition) => edition.name),
        ["ai", "convert"],
    );
    assert.equal(result.catalog.count, 2);
    assert.equal(result.catalog.first.number, 1);
    assert.equal(result.fetchTransport, "HTTPCLOAK");
    assert.match(result.warnings[0], /trang truyện công khai/);
});

test("prepareTruyenDichLiveCatalog reports every catalog page and returns the full sorted catalog", async () => {
    const chapters = Array.from({ length: 401 }, (_, index) => ({
        id: index + 1000,
        chapter_number: index + 1,
        title: `Chương ${index + 1}`,
        status: "COMPLETED",
        update_time: "2026-07-24T08:00:00.000Z",
    }));
    const completedPages = [];

    globalThis.fetch = async (url) => {
        const requestUrl = String(url);
        if (requestUrl.endsWith("/api/novels/test-story")) {
            return Response.json({
                id: 10,
                title: "Test Story",
                slug: "test-story",
                image_url: null,
                status: "ongoing",
                author: "Test Author",
                latest_chapter_number: chapters.length,
                description: "<p>Story description.</p>",
                categories: [],
                editions: [
                    {
                        id: 20,
                        edition_name: "convert",
                        first_chapter_slug: "1",
                    },
                ],
            });
        }

        const page = Number(new URL(requestUrl).searchParams.get("page"));
        const offset = (page - 1) * 200;
        return Response.json({
            total: chapters.length,
            page,
            size: 200,
            items: chapters
                .slice(offset, offset + 200)
                .reverse(),
        });
    };

    const result = await prepareTruyenDichLiveCatalog(
        "https://truyendich.live/doc-truyen/test-story",
        {
            onPage(progress) {
                completedPages.push({
                    page: progress.page,
                    pageCount: progress.pageCount,
                    chapterCount: progress.chapters.length,
                });
            },
        },
    );

    assert.deepEqual(
        completedPages.map(({ page }) => page),
        [1, 2, 3],
    );
    assert.equal(completedPages.at(-1).pageCount, 3);
    assert.equal(result.chapters.length, 401);
    assert.equal(result.chapters[0].number, 1);
    assert.equal(result.chapters.at(-1).number, 401);
});

test("discovery uses a recently healthy fallback origin after requested origin fails", async () => {
    const requests = [];
    globalThis.fetch = async (url) => {
        const requestUrl = String(url);
        requests.push(requestUrl);

        if (requestUrl.startsWith("https://truyendich.live")) {
            throw new DOMException(
                "The operation timed out",
                "TimeoutError",
            );
        }
        if (requestUrl.endsWith("/api/novels/test-story")) {
            return Response.json({
                id: 10,
                title: "Test Story",
                slug: "test-story",
                image_url: "/cover.webp",
                status: "ongoing",
                author: "Test Author",
                latest_chapter_number: 1,
                description: "<p>Story description.</p>",
                categories: [],
                editions: [
                    {
                        id: 20,
                        edition_name: "ai",
                        first_chapter_slug: "1",
                    },
                ],
            });
        }
        return Response.json({
            total: 1,
            page: 1,
            size: 200,
            items: [
                {
                    id: 100,
                    chapter_number: 1,
                    title: "Chapter 1",
                    status: "COMPLETED",
                    update_time: "2026-07-24T08:00:00.000Z",
                },
            ],
        });
    };

    const result = await discoverTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
        {
            originHealth: {
                async getHealthyOrigin() {
                    return "https://truyendich.ai";
                },
                async isDirectOriginUnhealthy() {
                    return false;
                },
                async markOriginHealthy() {},
                async markDirectOriginUnhealthy() {},
            },
        },
    );

    assert.equal(
        result.source.canonicalUrl,
        "https://truyendich.ai/doc-truyen/test-story",
    );
    assert.equal(result.story.totalChapters, 1);
    assert.ok(
        requests.some((url) =>
            url.startsWith("https://truyendich.live"),
        ),
    );
    assert.ok(
        requests.some((url) =>
            url.startsWith("https://truyendich.ai"),
        ),
    );
});

test("discovery does not blindly probe another domain without health evidence", async () => {
    const requests = [];
    globalThis.fetch = async (url) => {
        requests.push(String(url));
        throw new DOMException("The operation timed out", "TimeoutError");
    };

    await assert.rejects(
        () =>
            probeTruyenDichLiveStory(
                "https://truyendich.live/doc-truyen/test-story",
            ),
        { code: "SOURCE_TIMEOUT" },
    );

    assert.equal(requests.length, 1);
    assert.ok(requests[0].startsWith("https://truyendich.live"));
});

test("discovery uses Chromium after the requested direct origin times out", async () => {
    globalThis.fetch = async () => {
        throw new DOMException("The operation timed out", "TimeoutError");
    };
    const browserRequests = [];
    const browserTransport = {
        async fetch(url) {
            browserRequests.push(url);
            if (url.endsWith("/api/novels/test-story")) {
                return {
                    url,
                    data: {
                        id: 10,
                        title: "Browser Story",
                        slug: "test-story",
                        image_url: null,
                        status: "ongoing",
                        author: "Browser Author",
                        latest_chapter_number: 1,
                        description: "<p>Browser fallback.</p>",
                        categories: [],
                        editions: [
                            {
                                id: 20,
                                edition_name: "ai",
                                first_chapter_slug: "1",
                            },
                        ],
                    },
                };
            }
            return {
                url,
                data: {
                    total: 1,
                    page: 1,
                    size: 200,
                    items: [
                        {
                            id: 100,
                            chapter_number: 1,
                            title: "Chapter 1",
                            status: "COMPLETED",
                            update_time:
                                "2026-07-24T08:00:00.000Z",
                        },
                    ],
                },
            };
        },
    };

    const result = await discoverTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
        { browserTransport },
    );

    assert.equal(result.fetchTransport, "CHROMIUM");
    assert.equal(result.story.title, "Browser Story");
    assert.equal(browserRequests.length, 2);
});

test("discovery preserves the HTTPCloak fallback transport", async () => {
    globalThis.fetch = async () => {
        throw new DOMException("The operation timed out", "TimeoutError");
    };
    const browserTransport = {
        async fetch(url) {
            if (url.endsWith("/api/novels/test-story")) {
                return {
                    url,
                    transport: "HTTPCLOAK",
                    data: {
                        id: 10,
                        title: "HTTP3 Story",
                        slug: "test-story",
                        image_url: null,
                        status: "ongoing",
                        author: "HTTP3 Author",
                        latest_chapter_number: 1,
                        description: null,
                        categories: [],
                        editions: [
                            {
                                id: 20,
                                edition_name: "ai",
                                first_chapter_slug: "1",
                            },
                        ],
                    },
                };
            }
            return {
                url,
                transport: "HTTPCLOAK",
                data: {
                    total: 1,
                    page: 1,
                    size: 200,
                    items: [
                        {
                            id: 100,
                            chapter_number: 1,
                            title: "Chapter 1",
                            status: "COMPLETED",
                            update_time:
                                "2026-07-24T08:00:00.000Z",
                        },
                    ],
                },
            };
        },
    };

    const result = await discoverTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
        { browserTransport },
    );

    assert.equal(result.fetchTransport, "HTTPCLOAK");
    assert.equal(result.story.title, "HTTP3 Story");
});

test("discovery skips direct fetch while the requested origin circuit is open", async () => {
    let directCalls = 0;
    globalThis.fetch = async () => {
        directCalls += 1;
        throw new Error("Direct fetch must be skipped");
    };
    const browserRequests = [];
    const browserTransport = {
        async fetch(url) {
            browserRequests.push(url);
            if (url.endsWith("/api/novels/test-story")) {
                return {
                    url,
                    data: {
                        id: 10,
                        title: "Circuit Story",
                        slug: "test-story",
                        image_url: null,
                        status: "ongoing",
                        author: "Browser Author",
                        latest_chapter_number: 1,
                        description: null,
                        categories: [],
                        editions: [
                            {
                                id: 20,
                                edition_name: "convert",
                                first_chapter_slug: "1",
                            },
                        ],
                    },
                };
            }
            return {
                url,
                data: {
                    total: 1,
                    page: 1,
                    size: 200,
                    items: [
                        {
                            id: 100,
                            chapter_number: 1,
                            title: "Chapter 1",
                            status: "COMPLETED",
                            update_time: "2026-07-24T08:00:00.000Z",
                        },
                    ],
                },
            };
        },
    };

    const result = await probeTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
        {
            browserTransport,
            originHealth: {
                async getHealthyOrigin() {
                    return null;
                },
                async isDirectOriginUnhealthy() {
                    return true;
                },
                async markOriginHealthy() {},
                async markDirectOriginUnhealthy() {},
            },
        },
    );

    assert.equal(directCalls, 0);
    assert.equal(browserRequests.length, 2);
    assert.equal(result.fetchTransport, "CHROMIUM");
});

test("discovery follows an allowlisted redirect and persists its final origin", async () => {
    const requests = [];
    globalThis.fetch = async (url) => {
        const requestUrl = String(url);
        requests.push(requestUrl);
        if (requestUrl.startsWith("https://truyendich.live")) {
            return new Response(null, {
                status: 307,
                headers: {
                    location: requestUrl.replace(
                        "https://truyendich.live",
                        "https://truyendich.ai",
                    ),
                },
            });
        }
        if (requestUrl.endsWith("/api/novels/test-story")) {
            return Response.json({
                id: 10,
                title: "Redirected Story",
                slug: "test-story",
                image_url: null,
                status: "ongoing",
                author: "Author",
                latest_chapter_number: 1,
                description: null,
                categories: [],
                editions: [
                    {
                        id: 20,
                        edition_name: "convert",
                        first_chapter_slug: "1",
                    },
                ],
            });
        }
        return Response.json({
            total: 1,
            page: 1,
            size: 200,
            items: [
                {
                    id: 100,
                    chapter_number: 1,
                    title: "Chapter 1",
                    status: "COMPLETED",
                    update_time: "2026-07-24T08:00:00.000Z",
                },
            ],
        });
    };

    const result = await probeTruyenDichLiveStory(
        "https://truyendich.live/doc-truyen/test-story",
    );

    assert.equal(
        result.source.canonicalUrl,
        "https://truyendich.ai/doc-truyen/test-story",
    );
    assert.ok(
        requests.some((url) => url.startsWith("https://truyendich.ai")),
    );
});

test("discovery does not use Chromium for a source 404", async () => {
    globalThis.fetch = async () => new Response(null, { status: 404 });
    let browserCalls = 0;

    await assert.rejects(
        () =>
            discoverTruyenDichLiveStory(
                "https://truyendich.live/doc-truyen/missing",
                {
                    browserTransport: {
                        async fetch() {
                            browserCalls += 1;
                        },
                    },
                },
            ),
        { code: "SOURCE_NOT_FOUND" },
    );
    assert.equal(browserCalls, 0);
});

test("discovery maps denied source access to a stable error code", async () => {
    globalThis.fetch = async () =>
        new Response(null, { status: 403 });

    await assert.rejects(
        () =>
            discoverTruyenDichLiveStory(
                "https://truyendich.live/doc-truyen/test-story",
            ),
        {
            code: "SOURCE_ACCESS_DENIED",
            retryable: false,
        },
    );
});

test("discovery reports source schema changes without exposing parser details", async () => {
    globalThis.fetch = async () =>
        Response.json({
            id: 10,
            slug: "test-story",
            editions: [],
        });

    await assert.rejects(
        () =>
            discoverTruyenDichLiveStory(
                "https://truyendich.live/doc-truyen/test-story",
            ),
        {
            code: "SOURCE_SCHEMA_CHANGED",
            message:
                "Website nguồn đã thay đổi cấu trúc metadata truyện.",
        },
    );
});

function chapterFixture({
    chapterNumber = 7,
    editionId = 13050,
    editionName = "ai",
    content = `
        <p><content></p>
        <p> Đoạn&nbsp; một. </p>
        <p>Đoạn hai.</p>
    `,
} = {}) {
    return `
        <!doctype html>
        <html>
            <body>
                <h1>Tiêu Đề Chapter</h1>
                <article itemprop="text">
                    <div id="original-content-tab">
                        ${content}
                    </div>
                </article>
                <script>
                    {"chapter":{"id":123,"chapter_number":${chapterNumber},"title":"Tiêu Đề Chapter","content":"$22","novel_edition_id":${editionId},"edition_name":"${editionName}"}}
                </script>
            </body>
        </html>
    `;
}

test("parseTruyenDichLiveChapterHtml normalizes plain text and hashes it", () => {
    const result = parseTruyenDichLiveChapterHtml(chapterFixture(), {
        expectedChapterNumber: 7,
        expectedEditionExternalId: "13050",
        expectedEditionName: "ai",
        sourceUrl:
            "https://truyendich.live/doc-truyen/test/chuong-7",
    });

    assert.equal(result.externalChapterId, "123");
    assert.equal(result.title, "Tiêu Đề Chapter");
    assert.equal(result.content, "Đoạn một.\n\nĐoạn hai.");
    assert.equal(result.wordCount, 4);
    assert.equal(result.contentHash, hashChapterContent(result.content));
});

test("parseTruyenDichLiveChapterHtml rejects an edition mismatch", () => {
    assert.throws(
        () =>
            parseTruyenDichLiveChapterHtml(chapterFixture(), {
                expectedChapterNumber: 7,
                expectedEditionExternalId: "459",
                expectedEditionName: "convert",
                sourceUrl:
                    "https://truyendich.live/doc-truyen/cv/test/chuong-7",
            }),
        { code: "SOURCE_EDITION_MISMATCH" },
    );
});

test("chapter normalization creates stable hashes", () => {
    const first = "Dòng một.\r\n\r\n  Dòng   hai.  ";
    const second = "Dòng một.\n\nDòng hai.";

    assert.equal(
        normalizeChapterContent(first),
        normalizeChapterContent(second),
    );
    assert.equal(hashChapterContent(first), hashChapterContent(second));
});
