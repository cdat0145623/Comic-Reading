import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import { prisma } from "@mtc/database";

import {
    markChapterRunning,
    prepareChapterBatch,
    saveWorkerChapterDraft,
} from "../import-repository.js";

const runDatabaseTests = process.env.RUN_DB_INTEGRATION === "1";

test(
    "missing mode skips production chapters and checkpoints the same draft",
    { skip: !runDatabaseTests },
    async (context) => {
        const targetStory = await prisma.story.findFirst({
            where: { chapters: { some: {} } },
            select: {
                id: true,
                uploaderId: true,
                chapters: {
                    orderBy: { number: "asc" },
                    take: 1,
                    select: { number: true },
                },
            },
        });
        assert.ok(targetStory, "Database cần ít nhất một truyện có chapter.");

        const existingNumber = targetStory.chapters[0].number;
        const latestChapter = await prisma.chapter.findFirst({
            where: { storyId: targetStory.id },
            orderBy: { number: "desc" },
            select: { number: true },
        });
        const missingNumbers = [
            latestChapter.number + 10_001,
            latestChapter.number + 10_002,
        ];

        const job = await prisma.storyImportJob.create({
            data: {
                clientRequestId: randomUUID(),
                ownerId: targetStory.uploaderId,
                targetStoryId: targetStory.id,
                mode: "MISSING",
                status: "REVIEW_REQUIRED",
                stage: "REVIEW",
                selectedEditionExternalId: "integration-edition",
                selectedEditionName: "convert",
                draft: {
                    create: {
                        title: "Phase 4 integration draft",
                        authorName: "Integration",
                        description: "Temporary integration data",
                        categories: [],
                        availableEditions: [],
                        chapters: {
                            create: [
                                {
                                    externalChapterId: `existing-${randomUUID()}`,
                                    number: existingNumber,
                                    title: "Existing chapter",
                                },
                                ...missingNumbers.map((number) => ({
                                    externalChapterId: `missing-${number}-${randomUUID()}`,
                                    number,
                                    title: `Missing chapter ${number}`,
                                })),
                            ],
                        },
                    },
                },
            },
            select: { id: true },
        });

        context.after(async () => {
            await prisma.storyImportJob.delete({
                where: { id: job.id },
            });
            await prisma.$disconnect();
        });

        const firstBatch = await prepareChapterBatch({
            jobId: job.id,
            ownerId: targetStory.uploaderId,
            limit: 1,
        });
        assert.deepEqual(
            firstBatch.map((chapter) => chapter.number),
            [missingNumbers[0]],
        );

        await markChapterRunning(firstBatch[0].id);
        const fetchedChapter = {
            externalChapterId: `fetched-${missingNumbers[0]}`,
            title: "Fetched integration chapter",
            sourceUrl: "https://truyendich.live/integration",
            content: "Integration chapter content",
            contentHash: "integration-hash",
            fetchTransport: "DIRECT",
        };
        await saveWorkerChapterDraft({
            chapterDraftId: firstBatch[0].id,
            chapter: fetchedChapter,
        });
        await saveWorkerChapterDraft({
            chapterDraftId: firstBatch[0].id,
            chapter: fetchedChapter,
        });

        const savedDrafts = await prisma.chapterImportDraft.findMany({
            where: {
                id: firstBatch[0].id,
                importStatus: "COMPLETED",
            },
            select: { id: true },
        });
        assert.equal(savedDrafts.length, 1);

        const secondBatch = await prepareChapterBatch({
            jobId: job.id,
            ownerId: targetStory.uploaderId,
            limit: 1,
        });
        assert.deepEqual(
            secondBatch.map((chapter) => chapter.number),
            [missingNumbers[1]],
        );
    },
);
