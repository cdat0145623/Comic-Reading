import {
    configureImportInputSchema,
    discoverStoryInputSchema,
    importSingleChapterInputSchema,
    startChapterImportBatchInputSchema,
} from "../domain/schemas.js";
import {
    createDiscoveringJob,
    createQueuedDiscoveryJob,
    findImportJobByRequestId,
    findImportJobForOwner,
    findChapterImportContext,
    findLastDraftChapter,
    findLatestContentDraftChapter,
    findLatestImportJob,
    findOwnedStory,
    findTargetChaptersByNumber,
    findTargetStoryCandidates,
    markImportJobFailed,
    queueCatalogPreparation,
    saveSourceProbe,
    saveSingleChapterDraft,
    toChapterDraftDto,
    toImportDiscoveryDto,
    updateImportConfiguration,
    getImportJobProgressForOwner,
} from "../infrastructure/persistence/import-repository.js";
import { ImportDiscoveryError } from "../domain/errors.js";
import { defaultSourceRegistry } from "../infrastructure/sources/registry.js";
import { hashChapterContent } from "../domain/chapter-content.js";

async function buildJobDto(job, ownerId) {
    if (!job?.draft) return null;
    const [lastChapter, targetCandidates, sampleChapter] = await Promise.all([
        findLastDraftChapter(job.draft.id),
        findTargetStoryCandidates(ownerId, job.draft.title),
        findLatestContentDraftChapter(job.draft.id),
    ]);
    const dto = toImportDiscoveryDto({
        job,
        lastChapter,
        targetCandidates,
        sampleChapter,
    });
    if (!sampleChapter) return dto;

    const targetChapters = await findTargetChaptersByNumber(
        job.targetStoryId,
        sampleChapter.number,
    );
    dto.sampleChapter.duplicateStatus = getTargetDuplicateStatus(
        targetChapters,
        sampleChapter.contentHash,
    );
    dto.sampleChapter.editionName = job.selectedEditionName;
    return dto;
}

export async function discoverStorySource({ actor, input }) {
    const parsed = discoverStoryInputSchema.parse(input);
    const existing = await findImportJobByRequestId(
        parsed.clientRequestId,
    );
    if (existing) {
        if (existing.ownerId !== actor.id) {
            throw new ImportDiscoveryError(
                "IMPORT_REQUEST_CONFLICT",
                "Yêu cầu discovery không thuộc tài khoản hiện tại.",
            );
        }
        if (existing.status === "FAILED") {
            throw new ImportDiscoveryError(
                existing.errorCode || "DISCOVERY_FAILED",
                existing.errorMessage ||
                    "Không thể phân tích nguồn truyện. Vui lòng tạo yêu cầu mới.",
            );
        }
        const job = await findImportJobForOwner(existing.id, actor.id);
        return buildJobDto(job, actor.id);
    }

    const job = await createDiscoveringJob({
        clientRequestId: parsed.clientRequestId,
        ownerId: actor.id,
        requestedSourceUrl: parsed.sourceUrl,
    });

    try {
        const discovery = await defaultSourceRegistry
            .resolve(parsed.sourceUrl)
            .probeStory(parsed.sourceUrl);
        await saveSourceProbe({ jobId: job.id, discovery });
        const savedJob = await findImportJobForOwner(job.id, actor.id);
        return buildJobDto(savedJob, actor.id);
    } catch (error) {
        const persistedError =
            error instanceof ImportDiscoveryError
                ? { code: error.code, message: error.message }
                : {
                      code: "INTERNAL_IMPORT_ERROR",
                      message:
                          "Discovery gặp lỗi hệ thống. Kiểm tra server log để biết chi tiết.",
                  };
        try {
            await markImportJobFailed(job.id, persistedError);
        } catch {
            // Preserve the original error for the action-level mapper.
        }
        throw error;
    }
}

export async function queueStoryDiscovery({ actor, input }) {
    const parsed = discoverStoryInputSchema.parse(input);
    const existing = await findImportJobByRequestId(
        parsed.clientRequestId,
    );
    if (existing) {
        if (existing.ownerId !== actor.id) {
            throw new ImportDiscoveryError(
                "IMPORT_REQUEST_CONFLICT",
                "Yêu cầu discovery không thuộc tài khoản hiện tại.",
            );
        }
        const existingJob = await findImportJobForOwner(
            existing.id,
            actor.id,
        );
        return {
            jobId: existing.id,
            status: existing.status,
            queued: !existingJob?.draft,
            discovery: existingJob?.draft
                ? await buildJobDto(existingJob, actor.id)
                : null,
        };
    }

    let job;
    try {
        job = await createQueuedDiscoveryJob({
            clientRequestId: parsed.clientRequestId,
            ownerId: actor.id,
            requestedSourceUrl: parsed.sourceUrl,
        });
    } catch (error) {
        const raced = await findImportJobByRequestId(parsed.clientRequestId);
        if (!raced) throw error;
        if (raced.ownerId !== actor.id) {
            throw new ImportDiscoveryError(
                "IMPORT_REQUEST_CONFLICT",
                "Yêu cầu discovery không thuộc tài khoản hiện tại.",
            );
        }
        return {
            jobId: raced.id,
            status: raced.status,
            queued: raced.status === "QUEUED",
            discovery: null,
        };
    }
    try {
        return {
            jobId: job.id,
            status: "QUEUED",
            queued: true,
            discovery: null,
        };
    } catch (error) {
        await markImportJobFailed(job.id, {
            code: error.code || "IMPORT_QUEUE_UNAVAILABLE",
            message: error.message,
        });
        throw error;
    }
}

export async function startChapterImportBatch({ actor, input }) {
    const parsed = startChapterImportBatchInputSchema.parse(input);
    const job = await findImportJobForOwner(parsed.jobId, actor.id);
    if (!job?.draft || job.status !== "DRAFT") {
        throw new ImportDiscoveryError(
            "IMPORT_JOB_NOT_CONFIGURABLE",
            "Import job chưa sẵn sàng để bắt đầu.",
        );
    }
    try {
        await queueCatalogPreparation(parsed.jobId, actor.id);
        return {
            jobId: parsed.jobId,
            queuedChapterCount: 0,
        };
    } catch (error) {
        throw error;
    }
}

export async function getImportJobProgress({ actor, jobId }) {
    const progress = await getImportJobProgressForOwner(
        jobId,
        actor.id,
    );
    if (!progress) {
        throw new ImportDiscoveryError(
            "IMPORT_NOT_FOUND",
            "Import job không còn tồn tại.",
        );
    }
    return progress;
}

export async function configureImportDiscovery({ actor, input }) {
    const parsed = configureImportInputSchema.parse(input);
    const job = await findImportJobForOwner(parsed.jobId, actor.id);
    if (!job?.draft || job.status !== "DRAFT") {
        throw new ImportDiscoveryError(
            "IMPORT_JOB_NOT_CONFIGURABLE",
            "Discovery không tồn tại hoặc không còn được phép cấu hình.",
        );
    }

    const editions = Array.isArray(job.draft.availableEditions)
        ? job.draft.availableEditions
        : [];
    const selectedEdition = editions.find(
        (edition) =>
            String(edition.externalId) ===
            parsed.selectedEditionExternalId,
    );
    if (!selectedEdition) {
        throw new ImportDiscoveryError(
            "INVALID_SOURCE_EDITION",
            "Phiên bản nguồn đã chọn không tồn tại.",
        );
    }

    if (parsed.targetStoryId !== null) {
        const targetStory = await findOwnedStory(
            parsed.targetStoryId,
            actor.id,
        );
        if (!targetStory) {
            throw new ImportDiscoveryError(
                "TARGET_STORY_FORBIDDEN",
                "Bạn không có quyền cập nhật truyện đích đã chọn.",
            );
        }
    }

    if (
        parsed.mode === "RANGE" &&
        parsed.rangeEnd > job.sourceChapterCount
    ) {
        throw new ImportDiscoveryError(
            "INVALID_IMPORT_RANGE",
            `Chương kết thúc không được vượt quá ${job.sourceChapterCount}.`,
        );
    }

    await updateImportConfiguration(job.id, {
        selectedEditionExternalId:
            parsed.selectedEditionExternalId,
        selectedEditionName: selectedEdition.name,
        targetStoryId: parsed.targetStoryId,
        mode: parsed.mode,
        rangeStart:
            parsed.mode === "RANGE" ? parsed.rangeStart : null,
        rangeEnd:
            parsed.mode === "RANGE" ? parsed.rangeEnd : null,
        requestedConcurrency: parsed.requestedConcurrency,
    });

    const updated = await findImportJobForOwner(job.id, actor.id);
    return buildJobDto(updated, actor.id);
}

export async function getLatestImportDiscovery({ actor }) {
    const job = await findLatestImportJob(actor.id);
    return buildJobDto(job, actor.id);
}

function ensureChapterIsInConfiguredRange(job, chapterNumber) {
    if (
        job.mode === "RANGE" &&
        (chapterNumber < job.rangeStart || chapterNumber > job.rangeEnd)
    ) {
        throw new ImportDiscoveryError(
            "IMPORT_CHAPTER_OUTSIDE_RANGE",
            `Chương mẫu phải nằm trong khoảng ${job.rangeStart}–${job.rangeEnd}.`,
        );
    }
}

function getTargetDuplicateStatus(targetChapters, contentHash) {
    if (targetChapters.length > 1) {
        throw new ImportDiscoveryError(
            "TARGET_CHAPTER_NUMBER_AMBIGUOUS",
            "Truyện đích có nhiều chapter cùng số. Cần sửa dữ liệu trước khi import.",
        );
    }
    if (!targetChapters.length) return "NEW";
    return hashChapterContent(targetChapters[0].content) === contentHash
        ? "UNCHANGED"
        : "CHANGED";
}

export async function importSingleChapterDraft({ actor, input }) {
    const parsed = importSingleChapterInputSchema.parse(input);
    const job = await findChapterImportContext({
        jobId: parsed.jobId,
        ownerId: actor.id,
        chapterNumber: parsed.chapterNumber,
    });

    if (
        !job?.source ||
        !job.draft ||
        job.status !== "REVIEW_REQUIRED"
    ) {
        throw new ImportDiscoveryError(
            "IMPORT_JOB_NOT_CONFIGURABLE",
            "Discovery không tồn tại hoặc không còn được phép tải chapter.",
        );
    }
    if (
        !job.selectedEditionExternalId ||
        !job.selectedEditionName
    ) {
        throw new ImportDiscoveryError(
            "INVALID_SOURCE_EDITION",
            "Import job chưa có phiên bản nguồn hợp lệ.",
        );
    }
    if (job.draft.chapters.length !== 1) {
        throw new ImportDiscoveryError(
            job.draft.chapters.length
                ? "IMPORT_CHAPTER_AMBIGUOUS"
                : "IMPORT_CHAPTER_NOT_FOUND",
            job.draft.chapters.length
                ? "Catalog có nhiều chapter cùng số."
                : "Số chương không tồn tại trong catalog đã discovery.",
        );
    }
    ensureChapterIsInConfiguredRange(job, parsed.chapterNumber);

    const draftChapter = job.draft.chapters[0];
    const fetched = await defaultSourceRegistry
        .resolve(job.source.canonicalUrl)
        .fetchChapter({
        sourceSlug: job.source.sourceSlug,
        sourceCanonicalUrl: job.source.canonicalUrl,
        chapterNumber: parsed.chapterNumber,
        editionExternalId: job.selectedEditionExternalId,
        editionName: job.selectedEditionName,
        });
    const targetChapters = await findTargetChaptersByNumber(
        job.targetStoryId,
        parsed.chapterNumber,
    );
    const duplicateStatus =
        draftChapter.contentHash === fetched.contentHash
            ? "DUPLICATE_DRAFT"
            : getTargetDuplicateStatus(
                  targetChapters,
                  fetched.contentHash,
              );

    const saved = await saveSingleChapterDraft({
        jobId: job.id,
        ownerId: actor.id,
        chapterDraftId: draftChapter.id,
        chapter: fetched,
    });

    return toChapterDraftDto(saved, {
        duplicateStatus,
        editionName: job.selectedEditionName,
        imageCount: fetched.imageCount,
        warnings: fetched.warnings,
    });
}
