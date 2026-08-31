import assert from "node:assert/strict";
import test from "node:test";

import { z } from "zod";

import {
    ImportDiscoveryError,
    toPublicImportError,
} from "../errors.js";

test("public importer errors preserve stable source metadata", () => {
    const result = toPublicImportError(
        new ImportDiscoveryError(
            "SOURCE_TIMEOUT",
            "Website nguồn phản hồi quá thời gian.",
            { retryable: true },
        ),
    );

    assert.deepEqual(result, {
        code: "SOURCE_TIMEOUT",
        category: "SOURCE",
        message: "Website nguồn phản hồi quá thời gian.",
        retryable: true,
        supportId: null,
    });
});

test("zod errors become safe validation errors", () => {
    const schema = z.object({
        sourceUrl: z.string().url(),
    });
    const parsed = schema.safeParse({ sourceUrl: "not-a-url" });

    assert.equal(parsed.success, false);
    const result = toPublicImportError(parsed.error);

    assert.equal(result.code, "INVALID_IMPORT_INPUT");
    assert.equal(result.category, "VALIDATION");
    assert.equal(result.retryable, false);
    assert.match(result.message, /sourceUrl/);
});

test("database connectivity errors expose a support id but not raw details", () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        const error = new Error(
            "postgresql://secret-user:secret-password@db/internal",
        );
        error.code = "P1001";

        const result = toPublicImportError(error, {
            operation: "DISCOVER_SOURCE",
        });

        assert.equal(result.code, "DATABASE_UNAVAILABLE");
        assert.equal(result.category, "DATABASE");
        assert.equal(result.retryable, true);
        assert.match(result.supportId, /^IMP-\d{8}-[A-F0-9]{8}$/);
        assert.doesNotMatch(result.message, /secret-password/);
    } finally {
        console.error = originalConsoleError;
    }
});

test("unexpected errors use the operation fallback and support id", () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
        const result = toPublicImportError(
            new Error("private implementation detail"),
            { operation: "IMPORT_SINGLE_CHAPTER" },
        );

        assert.equal(result.code, "INTERNAL_IMPORT_ERROR");
        assert.equal(result.category, "INTERNAL");
        assert.equal(result.retryable, true);
        assert.equal(result.message, "Không thể tải chapter mẫu.");
        assert.ok(result.supportId);
        assert.doesNotMatch(
            result.message,
            /private implementation detail/,
        );
    } finally {
        console.error = originalConsoleError;
    }
});
