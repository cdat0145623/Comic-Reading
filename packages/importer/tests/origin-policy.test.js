import assert from "node:assert/strict";
import test from "node:test";

import { ImportDiscoveryError } from "../domain/errors.js";
import { createSourceOriginPolicy } from "../infrastructure/sources/origin-policy.js";
import { assertSourceTransport } from "../infrastructure/sources/transport-contract.js";

test("origin policy uses direct transport for an allowed origin", async () => {
    const calls = [];
    const policy = createSourceOriginPolicy({
        allowedOrigins: ["https://source.test"],
        directTransport: {
            async fetch(url, options) {
                calls.push([url, options]);
                return { data: { ok: true }, url };
            },
        },
    });

    const result = await policy.fetch({
        preferredOrigin: "https://source.test",
        pathname: "/api/story",
        responseType: "json",
    });

    assert.deepEqual(result.data, { ok: true });
    assert.equal(calls[0][0], "https://source.test/api/story");
    assert.equal(result.transport, "DIRECT");
});

test("origin policy falls back on retryable direct transport errors", async () => {
    const calls = [];
    const policy = createSourceOriginPolicy({
        allowedOrigins: ["https://source.test"],
        directTransport: {
            async fetch() {
                throw new ImportDiscoveryError("SOURCE_TIMEOUT", "timeout");
            },
        },
        fallbackTransports: [
            {
                async fetch(url) {
                    calls.push(url);
                    return { data: "html", url, transport: "CHROMIUM" };
                },
            },
        ],
    });

    const result = await policy.fetch({
        preferredOrigin: "https://source.test",
        pathname: "/story",
        responseType: "html",
    });

    assert.equal(result.data, "html");
    assert.equal(result.transport, "CHROMIUM");
    assert.deepEqual(calls, ["https://source.test/story"]);
});

test("origin policy does not fallback for non-retryable source errors", async () => {
    const fallback = { async fetch() { throw new Error("must not call"); } };
    const policy = createSourceOriginPolicy({
        allowedOrigins: ["https://source.test"],
        directTransport: {
            async fetch() {
                throw new ImportDiscoveryError("SOURCE_NOT_FOUND", "missing");
            },
        },
        fallbackTransports: [fallback],
    });

    await assert.rejects(
        policy.fetch({
            preferredOrigin: "https://source.test",
            pathname: "/missing",
            responseType: "json",
        }),
        (error) => error.code === "SOURCE_NOT_FOUND",
    );
});

test("transport contract rejects an implementation without fetch", () => {
    assert.throws(
        () => assertSourceTransport({}),
        (error) => error.code === "SOURCE_TRANSPORT_INVALID",
    );
});
