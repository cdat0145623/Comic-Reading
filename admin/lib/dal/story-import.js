import "server-only";

import { hasAdminAccess } from "@mtc/auth/policy";
import {
    configureImportDiscovery,
    getImportJobProgress,
    getLatestImportDiscovery,
    importSingleChapterDraft,
    queueStoryDiscovery,
    startChapterImportBatch,
    ImportDiscoveryError,
} from "@mtc/importer";

import { getAdminSession } from "@/lib/authorization";

async function getImportActor() {
    const session = await getAdminSession();
    if (!hasAdminAccess(session)) {
        throw new ImportDiscoveryError(
            "SESSION_EXPIRED",
            "Phiên đăng nhập đã hết hạn.",
        );
    }
    return {
        id: session.user.id,
        role: session.user.role,
    };
}

export async function createStoryDiscovery(input) {
    return queueStoryDiscovery({ actor: await getImportActor(), input });
}

export async function configureStoryImport(input) {
    return configureImportDiscovery({ actor: await getImportActor(), input });
}

export async function startStoryImport(input) {
    return startChapterImportBatch({ actor: await getImportActor(), input });
}

export async function getLatestStoryImport() {
    return getLatestImportDiscovery({ actor: await getImportActor() });
}

export async function getStoryImportProgress(jobId) {
    return getImportJobProgress({ actor: await getImportActor(), jobId });
}

export async function importStoryChapter(input) {
    return importSingleChapterDraft({ actor: await getImportActor(), input });
}
