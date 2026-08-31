import {
    beginCatalogPreparation,
    findChapterDraftForWorker,
    findImportJobForWorker,
    markChapterRunning,
    markDiscoveryRunning,
    markWorkerChapterFailed,
    markImportJobFailed,
    prepareConfiguredChapterScope,
    saveCatalogPage,
    saveSourceProbe,
    saveWorkerChapterDraft,
} from "../infrastructure/persistence/import-repository.js";
import { ImportDiscoveryError } from "../domain/errors.js";
import {
    prepareTruyenDichLiveCatalog,
    probeTruyenDichLiveStory,
    fetchTruyenDichLiveChapter,
} from "../infrastructure/sources/truyendich/adapter.js";
import { enqueueChapterJobs } from "../infrastructure/queue/import-queue.js";

export async function executeDiscoveryJob(
    importJobId,
    { browserTransport, originHealth } = {},
) {
    const job = await findImportJobForWorker(importJobId);
    if (!job) {
        throw new ImportDiscoveryError(
            "IMPORT_NOT_FOUND",
            "Import job không còn tồn tại.",
        );
    }
    if (job.status === "DRAFT" && job.draft) return;
    if (!job.requestedSourceUrl) {
        throw new ImportDiscoveryError(
            "INVALID_SOURCE_URL",
            "Import job không lưu URL nguồn.",
        );
    }

    await markDiscoveryRunning(job.id);
    try {
        const discovery = await probeTruyenDichLiveStory(
            job.requestedSourceUrl,
            { browserTransport, originHealth },
        );
        await saveSourceProbe({ jobId: job.id, discovery });
    } catch (error) {
        if (error?.code === "SOURCE_BROWSER_TIMEOUT") {
            await browserTransport?.reset?.();
        }
        throw error;
    }
}

export async function executeCatalogJob(
    importJobId,
    { browserTransport, originHealth } = {},
) {
    const job = await findImportJobForWorker(importJobId);
    if (!job?.source || !job.requestedSourceUrl) {
        throw new ImportDiscoveryError(
            "IMPORT_NOT_FOUND",
            "Import job chưa có nguồn để chuẩn bị catalog.",
        );
    }
    await beginCatalogPreparation(job.id);
    await prepareTruyenDichLiveCatalog(job.requestedSourceUrl, {
        browserTransport,
        originHealth,
        onPage: (page) => saveCatalogPage({ jobId: job.id, ...page }),
    });
    const chapters = await prepareConfiguredChapterScope(job.id);
    await enqueueChapterJobs(job.id, chapters);
}

export async function executeChapterJob(
    chapterDraftId,
    { browserTransport } = {},
) {
    const chapterDraft =
        await findChapterDraftForWorker(chapterDraftId);
    const job = chapterDraft?.draft?.job;
    if (!chapterDraft || !job?.source) {
        throw new ImportDiscoveryError(
            "IMPORT_CHAPTER_NOT_FOUND",
            "Chapter draft không còn tồn tại.",
        );
    }
    if (chapterDraft.importStatus === "COMPLETED") return;
    if (
        !job.selectedEditionExternalId ||
        !job.selectedEditionName
    ) {
        throw new ImportDiscoveryError(
            "INVALID_SOURCE_EDITION",
            "Import job chưa chọn phiên bản nguồn.",
        );
    }

    await markChapterRunning(chapterDraft.id);
    const fetched = await fetchTruyenDichLiveChapter({
        sourceSlug: job.source.sourceSlug,
        sourceCanonicalUrl: job.source.canonicalUrl,
        chapterNumber: chapterDraft.number,
        editionExternalId: job.selectedEditionExternalId,
        editionName: job.selectedEditionName,
        browserTransport,
    });
    await saveWorkerChapterDraft({
        chapterDraftId: chapterDraft.id,
        chapter: fetched,
    });
}

export async function recordFinalChapterFailure(
    chapterDraftId,
    error,
) {
    return markWorkerChapterFailed(chapterDraftId, {
        code: error?.code || "IMPORT_CHAPTER_FAILED",
        message:
            error instanceof ImportDiscoveryError
                ? error.message
                : "Không thể tải chapter sau các lần thử lại.",
    });
}

export async function recordFinalDiscoveryFailure(importJobId, error) {
    return markImportJobFailed(importJobId, {
        code: error?.code || "DISCOVERY_FAILED",
        message:
            error instanceof ImportDiscoveryError
                ? error.message
                : "Discovery gặp lỗi hệ thống.",
    });
}
