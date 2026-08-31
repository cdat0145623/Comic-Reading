import { ImportDiscoveryError } from "./errors.js";

const TERMINAL_STATUSES = new Set([
    "FAILED",
    "PARTIAL_FAILED",
    "REVIEW_REQUIRED",
]);

const TRANSITIONS = new Map([
    ["QUEUED/DISCOVERY", new Set(["DISCOVERING/DISCOVERY"])],
    ["DISCOVERING/DISCOVERY", new Set(["DRAFT/DISCOVERY"])],
    ["DRAFT/DISCOVERY", new Set(["QUEUED/CATALOG"])],
    ["QUEUED/CATALOG", new Set(["RUNNING/CATALOG"])],
    ["RUNNING/CATALOG", new Set(["QUEUED/CHAPTER_IMPORT", "FAILED/CATALOG"])],
    [
        "QUEUED/CHAPTER_IMPORT",
        new Set(["RUNNING/CHAPTER_IMPORT"]),
    ],
    [
        "RUNNING/CHAPTER_IMPORT",
        new Set([
            "RUNNING/CHAPTER_IMPORT",
            "REVIEW_REQUIRED/REVIEW",
            "PARTIAL_FAILED/REVIEW",
            "FAILED/CHAPTER_IMPORT",
        ]),
    ],
]);

function stateKey({ status, stage }) {
    return `${status}/${stage}`;
}

export function isTerminalImportJobState(state) {
    return TERMINAL_STATUSES.has(state?.status);
}

export function assertImportJobTransition({ from, to }) {
    if (stateKey(from) === stateKey(to)) {
        if (isTerminalImportJobState(from)) {
            throw new ImportDiscoveryError(
                "IMPORT_JOB_STATE_CONFLICT",
                "Import job đã kết thúc và không thể cập nhật thêm.",
                { category: "CONFLICT" },
            );
        }
        return;
    }

    if (isTerminalImportJobState(from)) {
        throw new ImportDiscoveryError(
            "IMPORT_JOB_STATE_CONFLICT",
            "Import job đã kết thúc và không thể chuyển trạng thái.",
            { category: "CONFLICT" },
        );
    }

    const allowed = TRANSITIONS.get(stateKey(from));
    if (!allowed?.has(stateKey(to))) {
        throw new ImportDiscoveryError(
            "IMPORT_JOB_STATE_CONFLICT",
            `Không thể chuyển import job từ ${stateKey(from)} sang ${stateKey(to)}.`,
            { category: "CONFLICT" },
        );
    }
}
