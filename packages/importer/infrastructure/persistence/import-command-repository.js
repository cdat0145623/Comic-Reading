import { randomUUID } from "node:crypto";

import { prisma } from "@mtc/database";

const COMMAND_NAMES = new Set([
    "DISCOVER_STORY",
    "PREPARE_CATALOG",
    "IMPORT_CHAPTER",
]);

function commandNamePrefix(name) {
    return {
        DISCOVER_STORY: "discovery",
        PREPARE_CATALOG: "catalog",
        IMPORT_CHAPTER: "chapter",
    }[name];
}

export function buildImportCommandDedupeKey({
    name,
    importJobId,
    chapterDraftId,
}) {
    if (!COMMAND_NAMES.has(name) || !importJobId) {
        throw new TypeError("Invalid import queue command.");
    }
    if (name === "IMPORT_CHAPTER") {
        if (!chapterDraftId) throw new TypeError("Chapter command needs a draft id.");
        return `${commandNamePrefix(name)}-${chapterDraftId}`;
    }
    return `${commandNamePrefix(name)}-${importJobId}`;
}

export function getImportCommandRetryDelayMs(attemptCount) {
    const attempt = Math.max(1, Number(attemptCount) || 1);
    return Math.min(60_000, 1_000 * 2 ** (attempt - 1));
}

function isoOrNull(value) {
    return value ? new Date(value).toISOString() : null;
}

export function normalizeImportQueueCommand(command) {
    return {
        id: command.id,
        dedupeKey: command.dedupeKey,
        name: command.name,
        importJobId: command.importJobId,
        chapterDraftId: command.chapterDraftId || null,
        status: command.status,
        attemptCount: command.attemptCount,
        availableAt: isoOrNull(command.availableAt),
        leaseExpiresAt: isoOrNull(command.leaseExpiresAt),
        publishedAt: isoOrNull(command.publishedAt),
        lastError: command.lastError || null,
    };
}

export async function createImportQueueCommand(
    client = prisma,
    { name, importJobId, chapterDraftId = null },
) {
    const dedupeKey = buildImportCommandDedupeKey({
        name,
        importJobId,
        chapterDraftId,
    });
    const rows = await client.$queryRawUnsafe(
        `INSERT INTO "StoryImportQueueCommand"
            ("id", "dedupeKey", "name", "importJobId", "chapterDraftId", "status", "attemptCount", "availableAt", "updatedAt")
         VALUES ($1, $2, $3::"ImportQueueCommandName", $4, $5, 'PENDING'::"ImportQueueCommandStatus", 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT ("dedupeKey") DO UPDATE SET "dedupeKey" = EXCLUDED."dedupeKey"
         RETURNING *`,
        randomUUID(),
        dedupeKey,
        name,
        importJobId,
        chapterDraftId,
    );
    return normalizeImportQueueCommand(rows[0]);
}

export async function claimImportQueueCommands(
    client = prisma,
    { limit = 100, leaseMs = 30_000 } = {},
) {
    if (client && typeof client.$queryRawUnsafe !== "function") {
        ({ limit = 100, leaseMs = 30_000 } = client);
        client = prisma;
    }
    const rows = await client.$queryRawUnsafe(
        `WITH candidates AS (
            SELECT "id"
            FROM "StoryImportQueueCommand"
            WHERE ("status" = 'PENDING' AND "availableAt" <= CURRENT_TIMESTAMP)
               OR ("status" = 'PUBLISHING' AND "leaseExpiresAt" < CURRENT_TIMESTAMP)
            ORDER BY "availableAt" ASC, "createdAt" ASC
            LIMIT $1
            FOR UPDATE SKIP LOCKED
         )
         UPDATE "StoryImportQueueCommand" AS command
         SET "status" = 'PUBLISHING'::"ImportQueueCommandStatus",
             "attemptCount" = command."attemptCount" + 1,
             "leaseExpiresAt" = CURRENT_TIMESTAMP + ($2 * INTERVAL '1 millisecond'),
             "updatedAt" = CURRENT_TIMESTAMP
         FROM candidates
         WHERE command."id" = candidates."id"
         RETURNING command.*`,
        Math.max(1, Math.min(100, limit)),
        Math.max(1_000, leaseMs),
    );
    return rows.map(normalizeImportQueueCommand);
}

export async function markImportQueueCommandPublished(client = prisma, commandId) {
    if (typeof client === "string" && commandId === undefined) {
        commandId = client;
        client = prisma;
    }
    const rows = await client.$queryRawUnsafe(
        `UPDATE "StoryImportQueueCommand"
         SET "status" = 'PUBLISHED'::"ImportQueueCommandStatus",
             "publishedAt" = CURRENT_TIMESTAMP,
             "leaseExpiresAt" = NULL,
             "lastError" = NULL,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $1 AND "status" = 'PUBLISHING'::"ImportQueueCommandStatus"
         RETURNING *`,
        commandId,
    );
    return rows[0] ? normalizeImportQueueCommand(rows[0]) : null;
}

export async function releaseImportQueueCommand(
    client = prisma,
    commandId,
    error,
) {
    if (typeof client === "string" && error === undefined) {
        error = commandId;
        commandId = client;
        client = prisma;
    }
    const message = String(error?.message || error || "Queue publish failed").slice(
        0,
        1_000,
    );
    const rows = await client.$queryRawUnsafe(
        `UPDATE "StoryImportQueueCommand"
         SET "status" = 'PENDING'::"ImportQueueCommandStatus",
             "availableAt" = CURRENT_TIMESTAMP +
                 (LEAST(60000, 1000 * POWER(2, GREATEST(0, "attemptCount" - 1))) * INTERVAL '1 millisecond'),
             "leaseExpiresAt" = NULL,
             "lastError" = $2,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $1 AND "status" = 'PUBLISHING'::"ImportQueueCommandStatus"
         RETURNING *`,
        commandId,
        message,
    );
    return rows[0] ? normalizeImportQueueCommand(rows[0]) : null;
}
