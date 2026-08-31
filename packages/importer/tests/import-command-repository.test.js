import assert from "node:assert/strict";
import test from "node:test";

import {
    buildImportCommandDedupeKey,
    getImportCommandRetryDelayMs,
    normalizeImportQueueCommand,
} from "../infrastructure/persistence/import-command-repository.js";

test("builds deterministic dedupe keys for every import command", () => {
    assert.equal(
        buildImportCommandDedupeKey({ name: "DISCOVER_STORY", importJobId: "job-1" }),
        "discovery-job-1",
    );
    assert.equal(
        buildImportCommandDedupeKey({ name: "PREPARE_CATALOG", importJobId: "job-1" }),
        "catalog-job-1",
    );
    assert.equal(
        buildImportCommandDedupeKey({
            name: "IMPORT_CHAPTER",
            importJobId: "job-1",
            chapterDraftId: "chapter-1",
        }),
        "chapter-chapter-1",
    );
});

test("caps queue command retry delay at one minute", () => {
    assert.equal(getImportCommandRetryDelayMs(1), 1_000);
    assert.equal(getImportCommandRetryDelayMs(2), 2_000);
    assert.equal(getImportCommandRetryDelayMs(7), 60_000);
});

test("normalizes persisted commands to a dispatcher-safe shape", () => {
    const command = normalizeImportQueueCommand({
        id: "command-1",
        dedupeKey: "catalog-job-1",
        name: "PREPARE_CATALOG",
        importJobId: "job-1",
        chapterDraftId: null,
        status: "PENDING",
        attemptCount: 2,
        availableAt: new Date("2026-09-01T00:00:00.000Z"),
        leaseExpiresAt: null,
        publishedAt: null,
        lastError: null,
    });

    assert.deepEqual(command, {
        id: "command-1",
        dedupeKey: "catalog-job-1",
        name: "PREPARE_CATALOG",
        importJobId: "job-1",
        chapterDraftId: null,
        status: "PENDING",
        attemptCount: 2,
        availableAt: "2026-09-01T00:00:00.000Z",
        leaseExpiresAt: null,
        publishedAt: null,
        lastError: null,
    });
});
