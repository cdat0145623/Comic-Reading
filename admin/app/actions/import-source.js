"use server";

import {
    toPublicImportError,
} from "@mtc/importer";

import {
    configureStoryImport,
    createStoryDiscovery,
    getLatestStoryImport,
    importStoryChapter,
    startStoryImport,
} from "@/lib/dal/story-import";

async function runImportAction(operation, context, callback) {
    try {
        return { ok: true, data: await callback() };
    } catch (error) {
        return {
            ok: false,
            error: toPublicImportError(error, { operation, context }),
        };
    }
}

export async function discoverStorySourceAction(input) {
    return runImportAction(
        "DISCOVER_SOURCE",
        { sourceUrl: input?.sourceUrl },
        () => createStoryDiscovery(input),
    );
}

export async function startChapterImportBatchAction(input) {
    return runImportAction(
        "START_IMPORT_BATCH",
        { jobId: input?.jobId },
        () => startStoryImport(input),
    );
}

export async function configureImportDiscoveryAction(input) {
    return runImportAction(
        "CONFIGURE_IMPORT",
        { jobId: input?.jobId },
        () => configureStoryImport(input),
    );
}

export async function getLatestImportDiscoveryAction() {
    return runImportAction("RESTORE_IMPORT", {}, getLatestStoryImport);
}

export async function importSingleChapterDraftAction(input) {
    return runImportAction(
        "IMPORT_SINGLE_CHAPTER",
        {
            jobId: input?.jobId,
            chapterNumber: input?.chapterNumber,
        },
        () => importStoryChapter(input),
    );
}
