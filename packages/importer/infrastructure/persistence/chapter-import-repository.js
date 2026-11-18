import { prisma } from "@mtc/database";

import { ImportDiscoveryError } from "../../domain/errors.js";
import { createImportQueueCommand } from "./import-command-repository.js";
import { reconcileImportJobProgress } from "./import-progress-repository.js";

export async function saveCatalogPage({
    jobId,
    page,
    pageCount,
    totalChapters,
    chapters,
}) {
    return prisma.$transaction(async (transaction) => {
        const job = await transaction.storyImportJob.findUnique({
            where: { id: jobId },
            select: { draft: { select: { id: true } } },
        });
        if (!job?.draft) {
            throw new ImportDiscoveryError(
                "IMPORT_NOT_FOUND",
                "Import job chưa có draft metadata.",
            );
        }
        await transaction.chapterImportDraft.createMany({
            data: chapters.map((chapter) => ({
                draftId: job.draft.id,
                externalChapterId: chapter.externalChapterId,
                number: chapter.number,
                title: chapter.title,
                sourceStatus: chapter.sourceStatus,
                sourceUpdatedAt: chapter.sourceUpdatedAt,
                sourceUrl: chapter.sourceUrl,
            })),
            skipDuplicates: true,
        });
        const discoveredChapterCount =
            await transaction.chapterImportDraft.count({
                where: { draftId: job.draft.id },
            });
        await transaction.storyImportJob.update({
            where: { id: jobId },
            data: {
                stage: "CATALOG",
                status: "RUNNING",
                catalogPageCount: pageCount,
                completedCatalogPageCount: page,
                sourceChapterCount: totalChapters,
                discoveredChapterCount,
            },
        });
    });
}

export async function prepareConfiguredChapterScope(jobId) {
    return prisma.$transaction(async (transaction) => {
        const job = await transaction.storyImportJob.findUnique({
            where: { id: jobId },
            include: { draft: { select: { id: true } } },
        });
        if (!job?.draft) {
            throw new ImportDiscoveryError(
                "IMPORT_NOT_FOUND",
                "Import job chưa có catalog để nhập.",
            );
        }
        const numberFilter =
            job.mode === "RANGE"
                ? { gte: job.rangeStart, lte: job.rangeEnd }
                : undefined;
        let chapters = await transaction.chapterImportDraft.findMany({
            where: {
                draftId: job.draft.id,
                number: numberFilter,
            },
            orderBy: [{ number: "asc" }, { id: "asc" }],
            select: { id: true, number: true },
        });

        if (job.mode === "MISSING" && job.targetStoryId) {
            const existing = await transaction.chapter.findMany({
                where: {
                    storyId: job.targetStoryId,
                    number: {
                        in: [
                            ...new Set(
                                chapters.map((chapter) => chapter.number),
                            ),
                        ],
                    },
                },
                select: { number: true },
            });
            const existingNumbers = new Set(
                existing.map((chapter) => chapter.number),
            );
            chapters = chapters.filter(
                (chapter) => !existingNumbers.has(chapter.number),
            );
        }
        if (!chapters.length) {
            throw new ImportDiscoveryError(
                "IMPORT_NO_CHAPTERS_TO_QUEUE",
                "Không có chapter phù hợp với phạm vi đã chọn.",
            );
        }

        await transaction.chapterImportDraft.updateMany({
            where: { id: { in: chapters.map((chapter) => chapter.id) } },
            data: {
                importStatus: "QUEUED",
                errorCode: null,
                errorMessage: null,
            },
        });
        await transaction.storyImportJob.update({
            where: { id: jobId },
            data: {
                stage: "CHAPTER_IMPORT",
                status: "QUEUED",
                queuedChapterCount: chapters.length,
                completedChapterCount: 0,
                failedChapterCount: 0,
            },
        });
        for (const chapter of chapters) {
            await createImportQueueCommand(transaction, {
                name: "IMPORT_CHAPTER",
                importJobId: jobId,
                chapterDraftId: chapter.id,
            });
        }
        return chapters;
    });
}

export async function findTargetChaptersByNumber(storyId, chapterNumber) {
    if (!storyId) return [];
    return prisma.chapter.findMany({
        where: { storyId, number: chapterNumber },
        orderBy: { id: "asc" },
        take: 2,
        select: {
            id: true,
            name: true,
            content: true,
        },
    });
}

export async function prepareChapterBatch({
    jobId,
    ownerId,
    limit = 10,
}) {
    return prisma.$transaction(async (transaction) => {
        const job = await transaction.storyImportJob.findFirst({
            where: {
                id: jobId,
                ownerId,
                status: "REVIEW_REQUIRED",
            },
            include: {
                draft: { select: { id: true } },
            },
        });
        if (!job?.draft) {
            throw new ImportDiscoveryError(
                "IMPORT_JOB_NOT_CONFIGURABLE",
                "Import job chưa sẵn sàng để tải chapter.",
            );
        }

        const numberFilter =
            job.mode === "RANGE"
                ? { gte: job.rangeStart, lte: job.rangeEnd }
                : undefined;
        const candidateWhere = {
            draftId: job.draft.id,
            number: numberFilter,
            importStatus: { in: ["PENDING", "FAILED"] },
        };
        let candidates = [];

        if (job.mode !== "MISSING" || !job.targetStoryId) {
            candidates = await transaction.chapterImportDraft.findMany({
                where: candidateWhere,
                orderBy: [{ number: "asc" }, { id: "asc" }],
                take: limit,
                select: { id: true, number: true },
            });
        } else {
            let cursor;
            const scanSize = Math.max(limit * 5, 50);

            while (candidates.length < limit) {
                const page =
                    await transaction.chapterImportDraft.findMany({
                        where: candidateWhere,
                        orderBy: [{ number: "asc" }, { id: "asc" }],
                        take: scanSize,
                        ...(cursor
                            ? {
                                  cursor: { id: cursor },
                                  skip: 1,
                              }
                            : {}),
                        select: { id: true, number: true },
                    });
                if (!page.length) break;

                const existing =
                    await transaction.chapter.findMany({
                        where: {
                            storyId: job.targetStoryId,
                            number: {
                                in: [
                                    ...new Set(
                                        page.map(
                                            (chapter) =>
                                                chapter.number,
                                        ),
                                    ),
                                ],
                            },
                        },
                        select: { number: true },
                    });
                const existingNumbers = new Set(
                    existing.map((chapter) => chapter.number),
                );
                candidates.push(
                    ...page.filter(
                        (chapter) =>
                            !existingNumbers.has(chapter.number),
                    ),
                );
                candidates = candidates.slice(0, limit);
                cursor = page.at(-1).id;
                if (page.length < scanSize) break;
            }
        }
        if (!candidates.length) {
            throw new ImportDiscoveryError(
                "IMPORT_NO_CHAPTERS_TO_QUEUE",
                "Không còn chapter phù hợp để đưa vào hàng đợi.",
            );
        }

        const ids = candidates.map((chapter) => chapter.id);
        const existingCompleted =
            await transaction.chapterImportDraft.count({
                where: {
                    draftId: job.draft.id,
                    importStatus: "COMPLETED",
                },
            });
        await transaction.chapterImportDraft.updateMany({
            where: { id: { in: ids } },
            data: {
                importStatus: "QUEUED",
                errorCode: null,
                errorMessage: null,
            },
        });
        await transaction.storyImportJob.update({
            where: { id: job.id },
            data: {
                stage: "CHAPTER_IMPORT",
                status: "QUEUED",
                queuedChapterCount:
                    existingCompleted + candidates.length,
                completedChapterCount: existingCompleted,
                failedChapterCount: 0,
                completedAt: null,
                errorCode: null,
                errorMessage: null,
            },
        });
        return candidates;
    });
}

export async function rollbackPreparedChapterBatch(jobId, chapterDraftIds) {
    return prisma.$transaction([
        prisma.chapterImportDraft.updateMany({
            where: {
                id: { in: chapterDraftIds },
                importStatus: "QUEUED",
            },
            data: { importStatus: "PENDING" },
        }),
        prisma.storyImportJob.update({
            where: { id: jobId },
            data: {
                stage: "REVIEW",
                status: "REVIEW_REQUIRED",
                queuedChapterCount: 0,
                completedChapterCount: 0,
                failedChapterCount: 0,
            },
        }),
    ]);
}

export async function findChapterDraftForWorker(chapterDraftId) {
    return prisma.chapterImportDraft.findUnique({
        where: { id: chapterDraftId },
        include: {
            draft: {
                include: {
                    job: {
                        include: { source: true },
                    },
                },
            },
        },
    });
}

export async function markChapterRunning(chapterDraftId) {
    const chapter = await prisma.chapterImportDraft.findUnique({
        where: { id: chapterDraftId },
        select: { importStatus: true, draft: { select: { jobId: true } } },
    });
    if (!chapter) {
        throw new ImportDiscoveryError(
            "IMPORT_CHAPTER_NOT_FOUND",
            "Chapter không còn tồn tại trong draft.",
        );
    }
    if (chapter.importStatus === "COMPLETED") return chapter;
    const updated = await prisma.chapterImportDraft.updateMany({
        where: {
            id: chapterDraftId,
            importStatus: { in: ["PENDING", "QUEUED", "FAILED"] },
        },
        data: {
            importStatus: "RUNNING",
            attemptCount: { increment: 1 },
            errorCode: null,
            errorMessage: null,
        },
    });
    await prisma.storyImportJob.updateMany({
        where: {
            id: chapter.draft.jobId,
            status: { in: ["QUEUED", "RUNNING"] },
            stage: "CHAPTER_IMPORT",
        },
        data: { status: "RUNNING" },
    });
    return updated;
}

export async function saveWorkerChapterDraft({
    chapterDraftId,
    chapter,
}) {
    const updated = await prisma.chapterImportDraft.update({
        where: { id: chapterDraftId },
        data: {
            externalChapterId: chapter.externalChapterId,
            title: chapter.title,
            sourceUrl: chapter.sourceUrl,
            content: chapter.content,
            contentHash: chapter.contentHash,
            importStatus: "COMPLETED",
            fetchTransport: chapter.fetchTransport || "DIRECT",
            fetchedAt: new Date(),
            errorCode: null,
            errorMessage: null,
        },
        select: { draft: { select: { jobId: true } } },
    });
    return reconcileImportJobProgress(updated.draft.jobId);
}

export async function markWorkerChapterFailed(
    chapterDraftId,
    { code, message },
) {
    const updated = await prisma.chapterImportDraft.update({
        where: { id: chapterDraftId },
        data: {
            importStatus: "FAILED",
            errorCode: code,
            errorMessage: message,
        },
        select: { draft: { select: { jobId: true } } },
    });
    return reconcileImportJobProgress(updated.draft.jobId);
}
