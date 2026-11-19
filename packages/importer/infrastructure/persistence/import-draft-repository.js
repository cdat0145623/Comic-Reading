import { prisma } from "@mtc/database";

import { ImportDiscoveryError } from "../../domain/errors.js";
import {
    serializeChapter,
    serializeContentDraft,
} from "./serialization.js";

function defaultEditionFor(discovery) {
    return (
        discovery.story.editions.find(
            (edition) => edition.name.toLowerCase() === "convert",
        ) || discovery.story.editions[0]
    );
}

export async function saveDiscovery({ jobId, discovery }) {
    const defaultEdition = defaultEditionFor(discovery);

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
    const defaultEdition = defaultEditionFor(discovery);

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
            throw new ImportDiscoveryError(
                "IMPORT_JOB_STATE_CONFLICT",
                "Import job đã được thay đổi bởi tác vụ khác.",
                { category: "CONFLICT" },
            );
        }
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
