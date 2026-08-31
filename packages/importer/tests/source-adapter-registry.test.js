import assert from "node:assert/strict";
import test from "node:test";

import {
    createSourceRegistry,
    createDefaultSourceRegistry,
    assertSourceAdapter,
} from "../infrastructure/sources/registry.js";
import { createTruyenDichLiveSourceAdapter } from "../infrastructure/sources/truyendich/adapter.js";

function adapter(provider = "TEST_SOURCE") {
    return {
        provider,
        canHandle: (url) => url.includes("example.test"),
        normalizeUrl: (url) => url,
        probeStory: async () => ({}),
        discoverStory: async () => ({}),
        prepareCatalog: async () => ({}),
        fetchChapter: async () => ({}),
    };
}

test("registry resolves an adapter by source URL", () => {
    const sourceAdapter = adapter();
    const registry = createSourceRegistry([sourceAdapter]);

    assert.equal(registry.resolve("https://example.test/story"), sourceAdapter);
    assert.equal(registry.get("TEST_SOURCE"), sourceAdapter);
});

test("registry rejects unsupported sources and duplicate providers", () => {
    const registry = createSourceRegistry([adapter()]);
    assert.throws(
        () => registry.resolve("https://unknown.test/story"),
        (error) => error.code === "UNSUPPORTED_SOURCE",
    );
    assert.throws(
        () => registry.register(adapter()),
        (error) => error.code === "SOURCE_ADAPTER_CONFLICT",
    );
});

test("adapter contract rejects missing operations", () => {
    assert.throws(
        () => assertSourceAdapter({ provider: "BROKEN" }),
        (error) => error.code === "SOURCE_ADAPTER_INVALID",
    );
});

test("default TruyenDich adapter satisfies the shared contract", () => {
    const sourceAdapter = createTruyenDichLiveSourceAdapter();
    assert.equal(sourceAdapter.provider, "TRUYENDICH_LIVE");
    assert.equal(
        createSourceRegistry([sourceAdapter]).resolve(
            "https://truyendich.live/doc-truyen/example",
        ),
        sourceAdapter,
    );
});

test("default registry includes the TruyenDich adapter", () => {
    assert.equal(
        createDefaultSourceRegistry().get("TRUYENDICH_LIVE")?.provider,
        "TRUYENDICH_LIVE",
    );
});
