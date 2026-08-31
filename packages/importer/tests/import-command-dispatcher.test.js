import assert from "node:assert/strict";
import test from "node:test";

import { createImportCommandDispatcher } from "../worker/import-command-dispatcher.js";

test("dispatcher publishes claimed commands and acknowledges them", async () => {
    const calls = [];
    const command = { id: "cmd-1", name: "DISCOVER_STORY" };
    const dispatcher = createImportCommandDispatcher({
        commandRepository: {
            async claimImportQueueCommands() {
                return [command];
            },
            async markImportQueueCommandPublished(id) {
                calls.push(["published", id]);
            },
            async releaseImportQueueCommand() {
                throw new Error("should not release");
            },
        },
        publisher: async (value) => calls.push(["publish", value]),
    });

    assert.equal(await dispatcher.poll(), 1);
    assert.deepEqual(calls, [
        ["publish", command],
        ["published", "cmd-1"],
    ]);
});

test("dispatcher releases a command when publishing fails", async () => {
    const calls = [];
    const dispatcher = createImportCommandDispatcher({
        commandRepository: {
            async claimImportQueueCommands() {
                return [{ id: "cmd-2", name: "PREPARE_CATALOG" }];
            },
            async markImportQueueCommandPublished() {},
            async releaseImportQueueCommand(id, error) {
                calls.push(["released", id, error.message]);
            },
        },
        publisher: async () => {
            throw new Error("redis down");
        },
    });

    assert.equal(await dispatcher.poll(), 1);
    assert.deepEqual(calls, [["released", "cmd-2", "redis down"]]);
});
