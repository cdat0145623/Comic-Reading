import {
    claimImportQueueCommands,
    markImportQueueCommandPublished,
    releaseImportQueueCommand,
} from "../infrastructure/persistence/import-command-repository.js";
import { publishImportQueueCommand } from "../infrastructure/queue/import-queue.js";

export function createImportCommandDispatcher({
    commandRepository = {
        claimImportQueueCommands,
        markImportQueueCommandPublished,
        releaseImportQueueCommand,
    },
    publisher = publishImportQueueCommand,
    batchSize = 100,
    leaseMs = 30_000,
    pollIntervalMs = 1_000,
} = {}) {
    let timer;
    let inFlight = null;

    async function poll() {
        if (inFlight) return inFlight;
        inFlight = (async () => {
            const commands = await commandRepository.claimImportQueueCommands({
                limit: batchSize,
                leaseMs,
            });
            for (const command of commands) {
                try {
                    await publisher(command);
                    await commandRepository.markImportQueueCommandPublished(
                        command.id,
                    );
                } catch (error) {
                    await commandRepository.releaseImportQueueCommand(
                        command.id,
                        error,
                    );
                }
            }
            return commands.length;
        })();
        try {
            return await inFlight;
        } finally {
            inFlight = null;
        }
    }

    return {
        poll,
        start() {
            if (!timer) {
                timer = setInterval(() => {
                    void poll().catch((error) =>
                        console.error("[import-dispatcher] poll failed", error),
                    );
                }, pollIntervalMs);
            }
            return this;
        },
        async stop() {
            if (timer) clearInterval(timer);
            timer = undefined;
            if (inFlight) await inFlight;
        },
    };
}
