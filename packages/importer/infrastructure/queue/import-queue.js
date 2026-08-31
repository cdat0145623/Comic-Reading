import { Queue } from "bullmq";

import { ImportDiscoveryError } from "../../domain/errors.js";

export const IMPORT_QUEUE_NAME = "mtc-story-import";
export const DISCOVERY_QUEUE_NAME = "mtc-story-discovery";
export const IMPORT_JOB_NAMES = {
    DISCOVER_STORY: "discover-story",
    PREPARE_CATALOG: "prepare-catalog",
    IMPORT_CHAPTER: "import-chapter",
};

const ACTIVE_ORIGIN_TTL_SECONDS = 10 * 60;
const UNHEALTHY_ORIGIN_TTL_SECONDS = 2 * 60;

export function getRedisConnection() {
    const value = process.env.REDIS_URL || "redis://127.0.0.1:6379";
    const url = new URL(value);
    return {
        host: url.hostname,
        port: Number(url.port || 6379),
        username: url.username || undefined,
        password: url.password || undefined,
        db: Number(url.pathname.slice(1) || 0),
        ...(url.protocol === "rediss:" ? { tls: {} } : {}),
    };
}

let importQueue;
let discoveryQueue;

export function getImportQueue() {
    importQueue ||= new Queue(IMPORT_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 3,
            backoff: { type: "exponential", delay: 2_000 },
            removeOnComplete: { age: 86_400, count: 1_000 },
            removeOnFail: { age: 604_800, count: 2_000 },
        },
    });
    return importQueue;
}

export function getDiscoveryQueue() {
    discoveryQueue ||= new Queue(DISCOVERY_QUEUE_NAME, {
        connection: getRedisConnection(),
        defaultJobOptions: {
            attempts: 2,
            backoff: { type: "exponential", delay: 2_000 },
            removeOnComplete: { age: 86_400, count: 1_000 },
            removeOnFail: { age: 604_800, count: 2_000 },
        },
    });
    return discoveryQueue;
}

export async function enqueueDiscoveryJob(importJobId) {
    try {
        await getDiscoveryQueue().add(
            IMPORT_JOB_NAMES.DISCOVER_STORY,
            { importJobId },
            { jobId: `discovery-${importJobId}` },
        );
    } catch (error) {
        throw new ImportDiscoveryError(
            "IMPORT_QUEUE_UNAVAILABLE",
            "Hàng đợi import hiện không khả dụng.",
            { cause: error, category: "QUEUE", retryable: true },
        );
    }
}

function sourceHealthKey(type, value) {
    return `mtc:source-health:${type}:${encodeURIComponent(value)}`;
}

async function getHealthRedis() {
    return getDiscoveryQueue().client;
}

export function createSourceOriginHealthStore() {
    return {
        async getHealthyOrigin(provider) {
            const redis = await getHealthRedis();
            return redis.get(sourceHealthKey("active-origin", provider));
        },
        async isDirectOriginUnhealthy(origin) {
            const redis = await getHealthRedis();
            return Boolean(
                await redis.get(sourceHealthKey("direct-unhealthy", origin)),
            );
        },
        async markOriginHealthy(provider, origin) {
            const redis = await getHealthRedis();
            await Promise.all([
                redis.set(
                    sourceHealthKey("active-origin", provider),
                    origin,
                    "EX",
                    ACTIVE_ORIGIN_TTL_SECONDS,
                ),
                redis.del(sourceHealthKey("direct-unhealthy", origin)),
            ]);
        },
        async markDirectOriginUnhealthy(origin) {
            const redis = await getHealthRedis();
            await redis.set(
                sourceHealthKey("direct-unhealthy", origin),
                "1",
                "EX",
                UNHEALTHY_ORIGIN_TTL_SECONDS,
            );
        },
    };
}

export async function enqueueChapterJobs(importJobId, chapters) {
    try {
        await getImportQueue().addBulk(
            chapters.map((chapter) => ({
                name: IMPORT_JOB_NAMES.IMPORT_CHAPTER,
                data: {
                    importJobId,
                    chapterDraftId: chapter.id,
                },
                opts: {
                    jobId: `chapter-${chapter.id}-${Date.now()}`,
                },
            })),
        );
    } catch (error) {
        throw new ImportDiscoveryError(
            "IMPORT_QUEUE_UNAVAILABLE",
            "Không thể đưa chapter vào hàng đợi import.",
            { cause: error, category: "QUEUE", retryable: true },
        );
    }
}

export async function enqueueCatalogJob(importJobId) {
    try {
        await getImportQueue().add(
            IMPORT_JOB_NAMES.PREPARE_CATALOG,
            { importJobId },
            { jobId: `catalog-${importJobId}-${Date.now()}` },
        );
    } catch (error) {
        throw new ImportDiscoveryError(
            "IMPORT_QUEUE_UNAVAILABLE",
            "Không thể đưa bước chuẩn bị catalog vào hàng đợi.",
            { cause: error, category: "QUEUE", retryable: true },
        );
    }
}
