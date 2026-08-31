import assert from "node:assert/strict";
import test from "node:test";

import {
    assertImportJobTransition,
    isTerminalImportJobState,
} from "../domain/import-job-state-machine.js";

const state = (status, stage) => ({ status, stage });

test("accepts the import lifecycle transitions", () => {
    const transitions = [
        [state("QUEUED", "DISCOVERY"), state("DISCOVERING", "DISCOVERY")],
        [state("DISCOVERING", "DISCOVERY"), state("DRAFT", "DISCOVERY")],
        [state("DRAFT", "DISCOVERY"), state("QUEUED", "CATALOG")],
        [state("QUEUED", "CATALOG"), state("RUNNING", "CATALOG")],
        [state("RUNNING", "CATALOG"), state("QUEUED", "CHAPTER_IMPORT")],
        [
            state("QUEUED", "CHAPTER_IMPORT"),
            state("RUNNING", "CHAPTER_IMPORT"),
        ],
        [
            state("RUNNING", "CHAPTER_IMPORT"),
            state("REVIEW_REQUIRED", "REVIEW"),
        ],
        [state("RUNNING", "CHAPTER_IMPORT"), state("PARTIAL_FAILED", "REVIEW")],
        [state("RUNNING", "CATALOG"), state("FAILED", "CATALOG")],
    ];

    for (const [from, to] of transitions) {
        assert.doesNotThrow(() => assertImportJobTransition({ from, to }));
    }
});

test("same-state transitions are idempotent", () => {
    assert.doesNotThrow(() =>
        assertImportJobTransition({
            from: state("QUEUED", "CATALOG"),
            to: state("QUEUED", "CATALOG"),
        }),
    );
});

test("rejects invalid lifecycle transitions with a stable conflict", () => {
    assert.throws(
        () =>
            assertImportJobTransition({
                from: state("DRAFT", "DISCOVERY"),
                to: state("RUNNING", "CHAPTER_IMPORT"),
            }),
        (error) => error.code === "IMPORT_JOB_STATE_CONFLICT" && !error.retryable,
    );
});

test("terminal states cannot transition again", () => {
    assert.equal(isTerminalImportJobState(state("REVIEW_REQUIRED", "REVIEW")), true);
    assert.equal(isTerminalImportJobState(state("PARTIAL_FAILED", "REVIEW")), true);
    assert.equal(isTerminalImportJobState(state("FAILED", "CATALOG")), true);
    assert.throws(() =>
        assertImportJobTransition({
            from: state("REVIEW_REQUIRED", "REVIEW"),
            to: state("FAILED", "REVIEW"),
        }),
    );
});
