import assert from "node:assert/strict";
import test from "node:test";

import {
    createHttpCloakSourceTransport,
    shouldFallbackFromHttpCloak,
} from "../httpcloak-source-transport.js";
import { ImportDiscoveryError } from "../errors.js";

function createSessionFactory(response, calls) {
    return async () => ({
        async get(url, options) {
            calls.push({ url, options });
            return response;
        },
        close() {
            calls.push({ close: true });
        },
    });
}

test("HTTPCloak transport parses JSON and reports its protocol", async () => {
    const calls = [];
    const transport = await createHttpCloakSourceTransport({
        sessionFactory: createSessionFactory(
            {
                ok: true,
                statusCode: 200,
                body: Buffer.from('{"title":"Test"}'),
                text: '{"title":"Test"}',
                protocol: "h3",
                url: "https://truyendich.live/api/novels/test",
            },
            calls,
        ),
    });

    const result = await transport.fetch(
        "https://truyendich.live/api/novels/test",
        { responseType: "json" },
    );

    assert.deepEqual(result.data, { title: "Test" });
    assert.equal(result.transport, "HTTPCLOAK");
    assert.equal(result.protocol, "h3");
    assert.equal(calls[0].options.fetchMode, "cors");
    await transport.close();
    assert.deepEqual(calls.at(-1), { close: true });
});

test("HTTPCloak transport rejects a host outside the source allowlist", async () => {
    let created = false;
    const transport = await createHttpCloakSourceTransport({
        sessionFactory: async () => {
            created = true;
            return {};
        },
    });

    await assert.rejects(
        () =>
            transport.fetch("https://example.com/api/novels/test", {
                responseType: "json",
            }),
        { code: "UNSUPPORTED_SOURCE" },
    );
    assert.equal(created, false);
});

test("HTTPCloak transport exposes invalid JSON as a fallback-safe error", async () => {
    const transport = await createHttpCloakSourceTransport({
        sessionFactory: createSessionFactory(
            {
                ok: true,
                statusCode: 200,
                body: Buffer.from("<html>blocked</html>"),
                text: "<html>blocked</html>",
                protocol: "h3",
                url: "https://truyendich.live/api/novels/test",
            },
            [],
        ),
    });

    await assert.rejects(
        () =>
            transport.fetch(
                "https://truyendich.live/api/novels/test",
                { responseType: "json" },
            ),
        (error) => {
            assert.equal(error.code, "SOURCE_RESPONSE_INVALID");
            assert.equal(shouldFallbackFromHttpCloak(error), true);
            return true;
        },
    );
});

test("HTTPCloak access denial can fall through to the browser tier", () => {
    assert.equal(
        shouldFallbackFromHttpCloak(
            new ImportDiscoveryError(
                "SOURCE_ACCESS_DENIED",
                "Denied",
            ),
        ),
        true,
    );
});
