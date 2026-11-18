import { prisma } from "@mtc/database";

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
