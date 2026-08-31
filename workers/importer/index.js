import { Worker } from "bullmq";
import {
    executeChapterJob,
    executeCatalogJob,
    executeDiscoveryJob,
    recordFinalDiscoveryFailure,
    recordFinalChapterFailure,
} from "@mtc/importer/worker";
import {
    createSourceOriginHealthStore,
    DISCOVERY_QUEUE_NAME,
    getRedisConnection,
    IMPORT_JOB_NAMES,
    IMPORT_QUEUE_NAME,
} from "@mtc/importer/queue";
import { createChromiumSourceTransport } from "@mtc/importer/chromium";
import {
    createHttpCloakSourceTransport,
    shouldFallbackFromHttpCloak,
} from "@mtc/importer/httpcloak";

let discoveryBrowserTransportPromise;
let importBrowserTransportPromise;
let discoveryHttpCloakTransportPromise;
let importHttpCloakTransportPromise;
let shuttingDown = false;

function getDiscoveryBrowserTransport() {
    discoveryBrowserTransportPromise ||= createChromiumSourceTransport();
    return discoveryBrowserTransportPromise;
}

function getImportBrowserTransport() {
    importBrowserTransportPromise ||= createChromiumSourceTransport();
    return importBrowserTransportPromise;
}

function getDiscoveryHttpCloakTransport() {
    discoveryHttpCloakTransportPromise ||=
        createHttpCloakSourceTransport();
    return discoveryHttpCloakTransportPromise;
}

function getImportHttpCloakTransport() {
    importHttpCloakTransportPromise ||= createHttpCloakSourceTransport();
    return importHttpCloakTransportPromise;
}

function createTieredFallbackTransport({
    getHttpCloakTransport,
    getBrowserTransport,
    getActiveTransportPromises,
}) {
    return {
        async fetch(...args) {
            try {
                const httpCloakTransport =
                    await getHttpCloakTransport();
                return await httpCloakTransport.fetch(...args);
            } catch (error) {
                if (!shouldFallbackFromHttpCloak(error)) throw error;
                const browserTransport = await getBrowserTransport();
                const result = await browserTransport.fetch(...args);
                return { ...result, transport: "CHROMIUM" };
            }
        },
        async reset() {
            const activeTransports =
                getActiveTransportPromises().filter(Boolean);
            await Promise.all(
                activeTransports.map(async (transportPromise) => {
                    const transport = await transportPromise;
                    await transport.reset?.();
                }),
            );
        },
    };
}

const discoveryBrowserTransport = createTieredFallbackTransport({
    getHttpCloakTransport: getDiscoveryHttpCloakTransport,
    getBrowserTransport: getDiscoveryBrowserTransport,
    getActiveTransportPromises: () => [
        discoveryHttpCloakTransportPromise,
        discoveryBrowserTransportPromise,
    ],
});
const importBrowserTransport = createTieredFallbackTransport({
    getHttpCloakTransport: getImportHttpCloakTransport,
    getBrowserTransport: getImportBrowserTransport,
    getActiveTransportPromises: () => [
        importHttpCloakTransportPromise,
        importBrowserTransportPromise,
    ],
});
const originHealth = createSourceOriginHealthStore();

const discoveryWorker = new Worker(
    DISCOVERY_QUEUE_NAME,
    async (job) => {
        if (job.name !== IMPORT_JOB_NAMES.DISCOVER_STORY) {
            throw new Error(`Unsupported discovery job: ${job.name}`);
        }
        await executeDiscoveryJob(job.data.importJobId, {
            browserTransport: discoveryBrowserTransport,
            originHealth,
        });
    },
    {
        connection: getRedisConnection(),
        concurrency: 1,
        lockDuration: 60_000,
    },
);

const importWorker = new Worker(
    IMPORT_QUEUE_NAME,
    async (job) => {
        // Drain discovery jobs created before the queue split.
        if (job.name === IMPORT_JOB_NAMES.DISCOVER_STORY) {
            await executeDiscoveryJob(job.data.importJobId, {
                browserTransport: discoveryBrowserTransport,
                originHealth,
            });
            return;
        }
        if (job.name === IMPORT_JOB_NAMES.IMPORT_CHAPTER) {
            await executeChapterJob(job.data.chapterDraftId, {
                browserTransport: importBrowserTransport,
            });
            return;
        }
        if (job.name === IMPORT_JOB_NAMES.PREPARE_CATALOG) {
            await executeCatalogJob(job.data.importJobId, {
                browserTransport: importBrowserTransport,
                originHealth,
            });
            return;
        }
        throw new Error(`Unsupported import job: ${job.name}`);
    },
    {
        connection: getRedisConnection(),
        concurrency: 1,
        lockDuration: 60_000,
    },
);

const workers = [discoveryWorker, importWorker];

for (const activeWorker of workers) {
    activeWorker.on("completed", (job) => {
        console.info("[import-worker] completed", {
            id: job.id,
            name: job.name,
            queue: activeWorker.name,
        });
    });

    activeWorker.on("failed", async (job, error) => {
        console.error("[import-worker] failed", {
            id: job?.id,
            name: job?.name,
            queue: activeWorker.name,
            attemptsMade: job?.attemptsMade,
            message: error?.message,
        });
        if (
            [
                IMPORT_JOB_NAMES.DISCOVER_STORY,
                IMPORT_JOB_NAMES.PREPARE_CATALOG,
            ].includes(job?.name) &&
            job.attemptsMade >= (job.opts.attempts || 1)
        ) {
            await recordFinalDiscoveryFailure(
                job.data.importJobId,
                error,
            );
        }
        if (
            job?.name === IMPORT_JOB_NAMES.IMPORT_CHAPTER &&
            job.attemptsMade >= (job.opts.attempts || 1)
        ) {
            await recordFinalChapterFailure(
                job.data.chapterDraftId,
                error,
            );
        }
    });
}

async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(`[import-worker] shutting down (${signal})`);
    await Promise.all(workers.map((activeWorker) => activeWorker.close()));
    await Promise.all(
        [
            discoveryBrowserTransportPromise,
            importBrowserTransportPromise,
            discoveryHttpCloakTransportPromise,
            importHttpCloakTransportPromise,
        ]
            .filter(Boolean)
            .map(async (transportPromise) => {
                const transport = await transportPromise;
                await transport.close();
            }),
    );
    process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

console.info("[import-worker] ready", {
    queues: [DISCOVERY_QUEUE_NAME, IMPORT_QUEUE_NAME],
    concurrency: { discovery: 1, import: 1 },
});
