import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { prisma } from "@mtc/database";

import { discoverStorySource } from "../story-import-service.js";

const enabled = process.env.RUN_DB_INTEGRATION === "1";

test(
    "persists a quick source probe without creating the full chapter catalog",
    { skip: !enabled, timeout: 30_000 },
    async (context) => {
        const originalFetch = globalThis.fetch;
        const owner = await prisma.user.findFirst({
            where: { role: { in: ["UPLOADER", "ADMIN"] } },
            select: { id: true, role: true },
        });
        assert.ok(owner, "A local uploader/admin account is required");

        const chapters = Array.from({ length: 401 }, (_, index) => ({
            id: index + 1000,
            chapter_number: index + 1,
            title: `Chương ${index + 1}`,
            status: "COMPLETED",
            update_time: "2026-07-24T08:00:00.000Z",
        }));
        const requestedPages = [];
        const requestId = randomUUID();
        let jobId;

        context.after(async () => {
            globalThis.fetch = originalFetch;
            const cleanupJob = jobId
                ? await prisma.storyImportJob.findUnique({
                      where: { id: jobId },
                      select: { id: true, sourceId: true },
                  })
                : await prisma.storyImportJob.findUnique({
                      where: { clientRequestId: requestId },
                      select: { id: true, sourceId: true },
                  });
            if (cleanupJob) {
                await prisma.storyImportJob.delete({
                    where: { id: cleanupJob.id },
                });
                if (cleanupJob.sourceId) {
                    await prisma.storyImportSource.deleteMany({
                        where: {
                            id: cleanupJob.sourceId,
                            jobs: { none: {} },
                        },
                    });
                }
            }
            await prisma.$disconnect();
        });

        globalThis.fetch = async (url) => {
            const requestUrl = String(url);
            if (requestUrl.endsWith("/api/novels/integration-story")) {
                return Response.json({
                    id: 910_000,
                    title: "Integration Story",
                    slug: "integration-story",
                    image_url: "/integration-cover.webp",
                    status: "ongoing",
                    author: "Integration Author",
                    latest_chapter_number: chapters.length,
                    description: "<p>Integration description.</p>",
                    categories: [
                        {
                            id: 1,
                            name: "Tiên Hiệp",
                            slug: "tien-hiep",
                        },
                    ],
                    editions: [
                        {
                            id: 77,
                            edition_name: "convert",
                            first_chapter_slug: "1",
                        },
                    ],
                });
            }

            const page = Number(
                new URL(requestUrl).searchParams.get("page"),
            );
            requestedPages.push(page);
            const offset = (page - 1) * 200;
            return Response.json({
                total: chapters.length,
                page,
                size: 200,
                items: chapters.slice(offset, offset + 200),
            });
        };

        const result = await discoverStorySource({
            actor: owner,
            input: {
                sourceUrl:
                    "https://truyendich.live/doc-truyen/integration-story",
                clientRequestId: requestId,
            },
        });
        jobId = result.jobId;

        const persisted = await prisma.storyImportJob.findUnique({
            where: { id: jobId },
            include: {
                draft: {
                    include: {
                        chapters: true,
                    },
                },
            },
        });

        assert.deepEqual(requestedPages, [1]);
        assert.equal(result.story.title, "Integration Story");
        assert.equal(result.catalog.count, 401);
        assert.equal(result.catalog.first.number, 1);
        assert.equal(result.catalog.last, null);
        assert.equal(persisted.status, "DRAFT");
        assert.equal(persisted.stage, "DISCOVERY");
        assert.equal(persisted.catalogPageCount, 3);
        assert.equal(persisted.completedCatalogPageCount, 0);
        assert.equal(persisted.discoveredChapterCount, 0);
        assert.equal(persisted.draft.chapters.length, 0);
        assert.equal(persisted.draft.catalogPreview.count, 401);
    },
);
