import { ImportDiscoveryError } from "./errors.js";

const REQUIRED_OPERATIONS = [
    "canHandle",
    "normalizeUrl",
    "probeStory",
    "discoverStory",
    "prepareCatalog",
    "fetchChapter",
];

export function assertSourceAdapter(sourceAdapter) {
    if (
        !sourceAdapter ||
        typeof sourceAdapter.provider !== "string" ||
        !sourceAdapter.provider.trim() ||
        REQUIRED_OPERATIONS.some(
            (operation) => typeof sourceAdapter[operation] !== "function",
        )
    ) {
        throw new ImportDiscoveryError(
            "SOURCE_ADAPTER_INVALID",
            "Source adapter chưa triển khai đầy đủ contract.",
            { category: "VALIDATION" },
        );
    }
    return sourceAdapter;
}
