import { prisma } from "@mtc/database";

import { ImportDiscoveryError } from "../../domain/errors.js";
import { assertImportJobTransition } from "../../domain/import-job-state-machine.js";
import { createImportQueueCommand } from "./import-command-repository.js";

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
            select: {
                id: true,
                status: true,
                stage: true,
                draft: { select: { id: true } },
            },
        });
        if (!job?.draft) {
            throw new ImportDiscoveryError(
                "IMPORT_JOB_NOT_CONFIGURABLE",
                "Import job chưa sẵn sàng để bắt đầu.",
            );
        }
        assertImportJobTransition({
            from: job,
            to: { status: "QUEUED", stage: "CATALOG" },
        });
        const updated = await transaction.storyImportJob.updateMany({
            where: {
                id: jobId,
                ownerId,
                status: job.status,
                stage: job.stage,
            },
            data: {
                status: "QUEUED",
                stage: "CATALOG",
                errorCode: null,
                errorMessage: null,
                completedAt: null,
            },
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
            throw new ImportDiscoveryError(
                "IMPORT_JOB_STATE_CONFLICT",
                "Import job đã được thay đổi bởi tác vụ khác.",
                { category: "CONFLICT" },
            );
        }
        await transaction.chapterImportDraft.deleteMany({
            where: { draftId: job.draft.id },
        });
        return transitioned;
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

export async function findImportJobForWorker(jobId) {
    return prisma.storyImportJob.findUnique({
        where: { id: jobId },
        include: {
            source: true,
            draft: true,
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
        if (
            current?.status === "DISCOVERING" &&
            current.stage === "DISCOVERY"
        ) {
            return current;
        }
        throw new ImportDiscoveryError(
            "IMPORT_JOB_STATE_CONFLICT",
            "Import job đã được thay đổi bởi tác vụ khác.",
            { category: "CONFLICT" },
        );
    }
    return transitioned;
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
