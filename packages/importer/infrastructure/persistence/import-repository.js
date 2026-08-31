import { prisma } from "@mtc/database";

import { countChapterWords } from "../../domain/chapter-content.js";
import { ImportDiscoveryError } from "../../domain/errors.js";
import { assertImportJobTransition } from "../../domain/import-job-state-machine.js";
import {
    createImportQueueCommand,
} from "./import-command-repository.js";

function serializeChapter(chapter) {
    return {
        id: chapter.id,
        externalChapterId: chapter.externalChapterId,
        number: chapter.number,
        title: chapter.title,
        sourceStatus: chapter.sourceStatus,
        sourceUpdatedAt:
            chapter.sourceUpdatedAt instanceof Date
                ? chapter.sourceUpdatedAt.toISOString()
                : chapter.sourceUpdatedAt || null,
        sourceUrl: chapter.sourceUrl,
    };
}

function serializeContentDraft(chapter) {
    if (!chapter?.content || !chapter.contentHash) return null;
    return {
        id: chapter.id,
        externalChapterId: chapter.externalChapterId,
        number: chapter.number,
        title: chapter.title,
        content: chapter.content,
        contentHash: chapter.contentHash,
        wordCount: countChapterWords(chapter.content),
        imageCount: 0,
        sourceUrl: chapter.sourceUrl,
        updatedAt: chapter.updatedAt.toISOString(),
        warnings: [],
    };
}

export async function findImportJobByRequestId(clientRequestId) {
    return prisma.storyImportJob.findUnique({
        where: { clientRequestId },
        select: {
            id: true,
            ownerId: true,
            status: true,
            errorCode: true,
            errorMessage: true,
        },
    });
}

export async function createDiscoveringJob({
    clientRequestId,
    ownerId,
    requestedSourceUrl,
}) {
    return prisma.storyImportJob.create({
        data: {
            clientRequestId,
            ownerId,
            requestedSourceUrl,
            status: "DISCOVERING",
            stage: "DISCOVERY",
            startedAt: new Date(),
        },
        select: { id: true },
    });
}

export async function createQueuedDiscoveryJob({
    clientRequestId,
    ownerId,
    requestedSourceUrl,
}) {
    return prisma.$transaction(async (transaction) => {
        const job = await transaction.storyImportJob.create({
            data: {
                clientRequestId,
                ownerId,
                requestedSourceUrl,
                status: "QUEUED",
                stage: "DISCOVERY",
            },
            select: { id: true, status: true },
        });
        await createImportQueueCommand(transaction, {
            name: "DISCOVER_STORY",
            importJobId: job.id,
        });
        return job;
    });
}

export async function queueCatalogPreparation(jobId, ownerId) {
    return prisma.$transaction(async (transaction) => {
        const job = await transaction.storyImportJob.findFirst({
            where: { id: jobId, ownerId },
            select: { id: true, status: true, stage: true, draft: { select: { id: true } } },
        });
        if (!job?.draft) {
            throw new ImportDiscoveryError(
                "IMPORT_JOB_NOT_CONFIGURABLE",
                "Import job chưa sẵn sàng để bắt đầu.",
            );
        }
        assertImportJobTransition({ from: job, to: {
            status: "QUEUED",
            stage: "CATALOG",
        } });
        const updated = await transaction.storyImportJob.updateMany({
            where: {
                id: jobId,
                ownerId,
                status: job.status,
                stage: job.stage,
            },
            data: { status: "QUEUED", stage: "CATALOG", errorCode: null, errorMessage: null, completedAt: null },
        });
        if (updated.count !== 1) {
            throw new ImportDiscoveryError(
                "IMPORT_JOB_STATE_CONFLICT",
                "Import job đã được thay đổi bởi tác vụ khác.",
                { category: "CONFLICT" },
            );
        }
        await createImportQueueCommand(transaction, {
            name: "PREPARE_CATALOG",
            importJobId: jobId,
        });
        return { jobId, status: "QUEUED", stage: "CATALOG" };
    });
}

export async function markImportJobFailed(jobId, error) {
    return prisma.storyImportJob.update({
        where: { id: jobId },
        data: {
            status: "FAILED",
            errorCode: error.code,
            errorMessage: error.message,
            completedAt: new Date(),
        },
    });
}

export async function saveDiscovery({ jobId, discovery }) {
    const defaultEdition =
        discovery.story.editions.find(
            (edition) => edition.name.toLowerCase() === "convert",
        ) || discovery.story.editions[0];

    return prisma.$transaction(
        async (transaction) => {
            const source = await transaction.storyImportSource.upsert({
                where: {
                    provider_externalNovelId: {
                        provider: discovery.source.provider,
                        externalNovelId:
                            discovery.source.externalNovelId,
                    },
                },
                update: {
                    sourceSlug: discovery.source.sourceSlug,
                    canonicalUrl: discovery.source.canonicalUrl,
                    lastDiscoveredAt: new Date(),
                },
                create: {
                    provider: discovery.source.provider,
                    externalNovelId:
                        discovery.source.externalNovelId,
                    sourceSlug: discovery.source.sourceSlug,
                    canonicalUrl: discovery.source.canonicalUrl,
                    lastDiscoveredAt: new Date(),
                },
                select: { id: true },
            });

            await transaction.storyImportDraft.deleteMany({
                where: { jobId },
            });

            const draft = await transaction.storyImportDraft.create({
                data: {
                    jobId,
                    title: discovery.story.title,
                    authorName: discovery.story.authorName,
                    coverUrl: discovery.story.coverUrl,
                    description: discovery.story.description,
                    sourceStatus: discovery.story.sourceStatus,
                    categories: discovery.story.categories,
                    availableEditions: discovery.story.editions,
                    rawMetadata: discovery.rawMetadata,
                },
                select: { id: true },
            });

            for (
                let offset = 0;
                offset < discovery.chapters.length;
                offset += 500
            ) {
                const chunk = discovery.chapters.slice(offset, offset + 500);
                await transaction.chapterImportDraft.createMany({
                    data: chunk.map((chapter) => ({
                        draftId: draft.id,
                        externalChapterId:
                            chapter.externalChapterId,
                        number: chapter.number,
                        title: chapter.title,
                        sourceStatus: chapter.sourceStatus,
                        sourceUpdatedAt: chapter.sourceUpdatedAt,
                        sourceUrl: chapter.sourceUrl,
                    })),
                });
            }

            await transaction.storyImportJob.update({
                where: { id: jobId },
                data: {
                    sourceId: source.id,
                    selectedEditionExternalId:
                        defaultEdition.externalId,
                    selectedEditionName: defaultEdition.name,
                    status: "REVIEW_REQUIRED",
                    stage: "REVIEW",
                    discoveredChapterCount:
                        discovery.chapters.length,
                    sourceChapterCount:
                        discovery.story.totalChapters,
                    warningMessages: discovery.warnings,
                    errorCode: null,
                    errorMessage: null,
                    discoveredAt: new Date(),
                    completedAt: null,
                },
            });
            return { draftId: draft.id };
        },
        { timeout: 20_000 },
    );
}

export async function saveSourceProbe({ jobId, discovery }) {
    const defaultEdition =
        discovery.story.editions.find(
            (edition) => edition.name.toLowerCase() === "convert",
        ) || discovery.story.editions[0];

    return prisma.$transaction(async (transaction) => {
        const source = await transaction.storyImportSource.upsert({
            where: {
                provider_externalNovelId: {
                    provider: discovery.source.provider,
                    externalNovelId: discovery.source.externalNovelId,
                },
            },
            update: {
                sourceSlug: discovery.source.sourceSlug,
                canonicalUrl: discovery.source.canonicalUrl,
                lastDiscoveredAt: new Date(),
            },
            create: {
                provider: discovery.source.provider,
                externalNovelId: discovery.source.externalNovelId,
                sourceSlug: discovery.source.sourceSlug,
                canonicalUrl: discovery.source.canonicalUrl,
                lastDiscoveredAt: new Date(),
            },
            select: { id: true },
        });

        await transaction.storyImportDraft.deleteMany({ where: { jobId } });
        await transaction.storyImportDraft.create({
            data: {
                jobId,
                title: discovery.story.title,
                authorName: discovery.story.authorName,
                coverUrl: discovery.story.coverUrl,
                description: discovery.story.description,
                sourceStatus: discovery.story.sourceStatus,
                categories: discovery.story.categories,
                availableEditions: discovery.story.editions,
                catalogPreview: {
                    ...discovery.catalog,
                    fetchTransport: discovery.fetchTransport,
                    first: discovery.catalog.first
                        ? serializeChapter(discovery.catalog.first)
                        : null,
                    last: discovery.catalog.last
                        ? serializeChapter(discovery.catalog.last)
                        : null,
                },
                rawMetadata: discovery.rawMetadata,
            },
        });
        const transitioned = await transaction.storyImportJob.updateMany({
            where: { id: jobId, status: "DISCOVERING", stage: "DISCOVERY" },
            data: {
                sourceId: source.id,
                selectedEditionExternalId: defaultEdition?.externalId || null,
                selectedEditionName: defaultEdition?.name || null,
                status: "DRAFT",
                stage: "DISCOVERY",
                catalogPageCount: discovery.catalog.pageCount,
                completedCatalogPageCount: 0,
                discoveredChapterCount: 0,
                sourceChapterCount: discovery.story.totalChapters,
                warningMessages: discovery.warnings,
                errorCode: null,
                errorMessage: null,
                discoveredAt: new Date(),
                completedAt: null,
            },
        });
        if (transitioned.count !== 1) {
            throw new ImportDiscoveryError("IMPORT_JOB_STATE_CONFLICT", "Import job đã được thay đổi bởi tác vụ khác.", { category: "CONFLICT" });
        }
    });
}

export async function beginCatalogPreparation(jobId) {
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
        const transitioned = await transaction.storyImportJob.updateMany({
            where: { id: jobId, status: "QUEUED", stage: "CATALOG" },
            data: {
                status: "RUNNING",
                stage: "CATALOG",
                completedCatalogPageCount: 0,
                discoveredChapterCount: 0,
                queuedChapterCount: 0,
                completedChapterCount: 0,
                failedChapterCount: 0,
                errorCode: null,
                errorMessage: null,
                completedAt: null,
            },
        });
        if (transitioned.count !== 1) {
            throw new ImportDiscoveryError("IMPORT_JOB_STATE_CONFLICT", "Import job đã được thay đổi bởi tác vụ khác.", { category: "CONFLICT" });
        }
        await transaction.chapterImportDraft.deleteMany({
            where: { draftId: job.draft.id },
        });
        return transitioned;
    });
}

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
                        in: [...new Set(chapters.map((chapter) => chapter.number))],
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

export async function findTargetStoryCandidates(ownerId, title) {
    return prisma.story.findMany({
        where: {
            uploaderId: ownerId,
            title: {
                contains: title,
                mode: "insensitive",
            },
        },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
        take: 8,
        select: {
            id: true,
            title: true,
            totalChapters: true,
            updatedAt: true,
        },
    });
}

export async function findImportJobForOwner(jobId, ownerId) {
    return prisma.storyImportJob.findFirst({
        where: { id: jobId, ownerId },
        include: {
            source: true,
            draft: {
                include: {
                    chapters: {
                        orderBy: { number: "asc" },
                        take: 1,
                    },
                },
            },
        },
    });
}

export async function findLatestImportJob(ownerId) {
    return prisma.storyImportJob.findFirst({
        where: {
            ownerId,
            status: {
                in: [
                    "DRAFT",
                    "DISCOVERING",
                    "QUEUED",
                    "RUNNING",
                    "REVIEW_REQUIRED",
                    "PARTIAL_FAILED",
                    "FAILED",
                ],
            },
        },
        orderBy: { updatedAt: "desc" },
        include: {
            source: true,
            draft: {
                include: {
                    chapters: {
                        orderBy: { number: "asc" },
                        take: 1,
                    },
                },
            },
        },
    });
}

export async function findLastDraftChapter(draftId) {
    return prisma.chapterImportDraft.findFirst({
        where: { draftId },
        orderBy: { number: "desc" },
    });
}

export async function findLatestContentDraftChapter(draftId) {
    return prisma.chapterImportDraft.findFirst({
        where: {
            draftId,
            content: { not: null },
            contentHash: { not: null },
        },
        orderBy: [{ updatedAt: "desc" }, { number: "desc" }],
    });
}

export async function findChapterImportContext({
    jobId,
    ownerId,
    chapterNumber,
}) {
    return prisma.storyImportJob.findFirst({
        where: { id: jobId, ownerId },
        include: {
            source: true,
            draft: {
                include: {
                    chapters: {
                        where: { number: chapterNumber },
                        orderBy: { id: "asc" },
                        take: 2,
                    },
                },
            },
        },
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

export async function saveSingleChapterDraft({
    jobId,
    ownerId,
    chapterDraftId,
    chapter,
}) {
    return prisma.$transaction(async (transaction) => {
        const job = await transaction.storyImportJob.findFirst({
            where: {
                id: jobId,
                ownerId,
                status: "REVIEW_REQUIRED",
            },
            select: {
                id: true,
                draft: { select: { id: true } },
            },
        });
        if (!job?.draft) {
            throw new ImportDiscoveryError(
                "IMPORT_JOB_NOT_CONFIGURABLE",
                "Import job không còn được phép cập nhật draft.",
            );
        }

        const currentDraft = await transaction.chapterImportDraft.findFirst({
            where: {
                id: chapterDraftId,
                draftId: job.draft.id,
            },
            select: { id: true },
        });
        if (!currentDraft) {
            throw new ImportDiscoveryError(
                "IMPORT_CHAPTER_NOT_FOUND",
                "Chapter không còn tồn tại trong draft.",
            );
        }

        return transaction.chapterImportDraft.update({
            where: { id: currentDraft.id },
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
        });
    });
}

export async function findImportJobForWorker(jobId) {
    return prisma.storyImportJob.findUnique({
        where: { id: jobId },
        include: {
            source: true,
            draft: true,
        },
    });
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

export async function markImportJobQueued(jobId) {
    return prisma.storyImportJob.update({
        where: { id: jobId },
        data: {
            status: "QUEUED",
            errorCode: null,
            errorMessage: null,
            completedAt: null,
        },
    });
}

export async function markDiscoveryRunning(jobId) {
    const transitioned = await prisma.storyImportJob.updateMany({
        where: { id: jobId, status: "QUEUED", stage: "DISCOVERY" },
        data: {
            status: "DISCOVERING",
            stage: "DISCOVERY",
            startedAt: new Date(),
            errorCode: null,
            errorMessage: null,
        },
    });
    if (transitioned.count !== 1) {
        const current = await prisma.storyImportJob.findUnique({
            where: { id: jobId },
            select: { status: true, stage: true },
        });
        if (current?.status === "DISCOVERING" && current.stage === "DISCOVERY") {
            return current;
        }
        throw new ImportDiscoveryError("IMPORT_JOB_STATE_CONFLICT", "Import job đã được thay đổi bởi tác vụ khác.", { category: "CONFLICT" });
    }
    return transitioned;
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
            candidates =
                await transaction.chapterImportDraft.findMany({
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

export async function markChapterRunning(chapterDraftId) {
    const chapter = await prisma.chapterImportDraft.findUnique({
        where: { id: chapterDraftId },
        select: { importStatus: true, draft: { select: { jobId: true } } },
    });
    if (!chapter) throw new ImportDiscoveryError("IMPORT_CHAPTER_NOT_FOUND", "Chapter không còn tồn tại trong draft.");
    if (chapter.importStatus === "COMPLETED") return chapter;
    const updated = await prisma.chapterImportDraft.updateMany({
        where: { id: chapterDraftId, importStatus: { in: ["PENDING", "QUEUED", "FAILED"] } },
        data: {
            importStatus: "RUNNING",
            attemptCount: { increment: 1 },
            errorCode: null,
            errorMessage: null,
        },
    });
    await prisma.storyImportJob.updateMany({
        where: { id: chapter.draft.jobId, status: { in: ["QUEUED", "RUNNING"] }, stage: "CHAPTER_IMPORT" },
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

export async function reconcileImportJobProgress(jobId) {
    const job = await prisma.storyImportJob.findUnique({
        where: { id: jobId },
        select: {
            queuedChapterCount: true,
            draft: { select: { id: true } },
        },
    });
    if (!job?.draft) return null;

    const grouped = await prisma.chapterImportDraft.groupBy({
        by: ["importStatus"],
        where: { draftId: job.draft.id },
        _count: { _all: true },
    });
    const counts = Object.fromEntries(
        grouped.map((item) => [item.importStatus, item._count._all]),
    );
    const completed = counts.COMPLETED || 0;
    const failed = counts.FAILED || 0;
    const finished =
        job.queuedChapterCount > 0 &&
        completed + failed >= job.queuedChapterCount;

    const transitioned = await prisma.storyImportJob.updateMany({
        where: { id: jobId, status: "RUNNING", stage: "CHAPTER_IMPORT" },
        data: {
            completedChapterCount: completed,
            failedChapterCount: failed,
            status: finished
                ? failed
                    ? "PARTIAL_FAILED"
                    : "REVIEW_REQUIRED"
                : "RUNNING",
            stage: finished ? "REVIEW" : "CHAPTER_IMPORT",
            completedAt: finished ? new Date() : null,
        },
    });
    return transitioned;
}

export async function getImportJobProgressForOwner(jobId, ownerId) {
    const job = await prisma.storyImportJob.findFirst({
        where: { id: jobId, ownerId },
        select: {
            id: true,
            status: true,
            stage: true,
            catalogPageCount: true,
            completedCatalogPageCount: true,
            discoveredChapterCount: true,
            queuedChapterCount: true,
            completedChapterCount: true,
            failedChapterCount: true,
            errorCode: true,
            errorMessage: true,
            startedAt: true,
            discoveredAt: true,
            completedAt: true,
            updatedAt: true,
            draft: {
                select: {
                    chapters: {
                        where: {
                            importStatus: {
                                in: [
                                    "QUEUED",
                                    "RUNNING",
                                    "COMPLETED",
                                    "FAILED",
                                ],
                            },
                        },
                        orderBy: { updatedAt: "desc" },
                        take: 8,
                        select: {
                            id: true,
                            number: true,
                            title: true,
                            importStatus: true,
                            attemptCount: true,
                            fetchTransport: true,
                            errorCode: true,
                            updatedAt: true,
                        },
                    },
                },
            },
        },
    });
    if (!job) return null;
    const recentChapters = job.draft?.chapters || [];
    return {
        ...job,
        currentChapter:
            recentChapters.find(
                (chapter) => chapter.importStatus === "RUNNING",
            ) || null,
        recentChapters: recentChapters.map((chapter) => ({
            ...chapter,
            updatedAt: chapter.updatedAt.toISOString(),
        })),
        startedAt: job.startedAt?.toISOString() || null,
        discoveredAt: job.discoveredAt?.toISOString() || null,
        completedAt: job.completedAt?.toISOString() || null,
        updatedAt: job.updatedAt.toISOString(),
        draft: undefined,
    };
}

export async function findOwnedStory(storyId, ownerId) {
    return prisma.story.findFirst({
        where: { id: storyId, uploaderId: ownerId },
        select: { id: true },
    });
}

export async function updateImportConfiguration(jobId, data) {
    return prisma.storyImportJob.update({
        where: { id: jobId },
        data,
    });
}

export function toImportDiscoveryDto({
    job,
    lastChapter,
    targetCandidates,
    sampleChapter = null,
}) {
    if (!job?.draft || !job.source) return null;

    const preview =
        job.draft.catalogPreview &&
        typeof job.draft.catalogPreview === "object"
            ? job.draft.catalogPreview
            : null;
    const firstChapter = job.draft.chapters[0] || preview?.first || null;
    const resolvedLastChapter = lastChapter || preview?.last || null;
    return {
        jobId: job.id,
        status: job.status,
        sourceUrl: job.source.canonicalUrl,
        source: {
            provider: job.source.provider,
            externalNovelId: job.source.externalNovelId,
            sourceSlug: job.source.sourceSlug,
        },
        fetchTransport: preview?.fetchTransport || null,
        story: {
            title: job.draft.title,
            authorName: job.draft.authorName,
            coverUrl: job.draft.coverUrl,
            description: job.draft.description,
            sourceStatus: job.draft.sourceStatus,
            categories: job.draft.categories,
            editions: job.draft.availableEditions,
            totalChapters:
                job.sourceChapterCount ||
                job.discoveredChapterCount,
        },
        catalog: {
            count:
                job.sourceChapterCount ||
                preview?.count ||
                job.discoveredChapterCount,
            pageCount: job.catalogPageCount || preview?.pageCount || 0,
            first: firstChapter
                ? serializeChapter(firstChapter)
                : null,
            last: resolvedLastChapter
                ? serializeChapter(resolvedLastChapter)
                : null,
            warnings: job.warningMessages || [],
        },
        configuration: {
            selectedEditionExternalId:
                job.selectedEditionExternalId,
            selectedEditionName: job.selectedEditionName,
            targetStoryId: job.targetStoryId,
            mode: job.mode,
            rangeStart: job.rangeStart,
            rangeEnd: job.rangeEnd,
            requestedConcurrency:
                job.requestedConcurrency,
        },
        targetCandidates: targetCandidates.map((story) => ({
            ...story,
            updatedAt: story.updatedAt.toISOString(),
        })),
        sampleChapter: serializeContentDraft(sampleChapter),
    };
}

export function toChapterDraftDto(chapter, extras = {}) {
    return {
        ...serializeContentDraft(chapter),
        duplicateStatus: extras.duplicateStatus || "NEW",
        imageCount: extras.imageCount || 0,
        warnings: extras.warnings || [],
        editionName: extras.editionName || null,
    };
}
