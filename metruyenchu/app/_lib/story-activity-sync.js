const ACTIVITY_CHANNEL_NAME = "metruyenchu-story-activity-v1";
const ACTIVITY_STORAGE_KEY = "metruyenchu:story-activity:submissions:v1";
const SUBMISSION_TTL = 24 * 60 * 60 * 1000;
const EMPTY_SUBMISSIONS = [];

let cachedRaw;
let cachedSubmissions = EMPTY_SUBMISSIONS;
let channel;
const listeners = new Set();

function getTabId() {
    if (typeof window === "undefined") return "server";
    const key = "metruyenchu:story-activity:tab-id";
    let value = window.sessionStorage.getItem(key);
    if (!value) {
        value = crypto.randomUUID();
        window.sessionStorage.setItem(key, value);
    }
    return value;
}

function parseSubmissions(raw) {
    if (!raw) return EMPTY_SUBMISSIONS;
    try {
        const value = JSON.parse(raw);
        if (!Array.isArray(value)) return EMPTY_SUBMISSIONS;
        const minimumTimestamp = Date.now() - SUBMISSION_TTL;
        return value.filter(
            (item) =>
                item?.clientSubmissionId &&
                item?.userId &&
                item?.updatedAt >= minimumTimestamp,
        );
    } catch {
        return EMPTY_SUBMISSIONS;
    }
}

function readSubmissions() {
    if (typeof window === "undefined") return EMPTY_SUBMISSIONS;
    const raw = window.localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (raw !== cachedRaw) {
        cachedRaw = raw;
        cachedSubmissions = parseSubmissions(raw);
    }
    return cachedSubmissions;
}

function notifyListeners(event) {
    for (const listener of listeners) listener(event);
}

function ensureChannel() {
    if (typeof window === "undefined" || channel) return channel;
    if (!("BroadcastChannel" in window)) return null;
    channel = new BroadcastChannel(ACTIVITY_CHANNEL_NAME);
    channel.addEventListener("message", ({ data }) => {
        if (data?.version === 1) notifyListeners(data);
    });
    return channel;
}

function publishEvent(event) {
    const payload = {
        ...event,
        sourceTabId: getTabId(),
        version: 1,
    };
    notifyListeners(payload);
    ensureChannel()?.postMessage(payload);
}

function writeSubmissions(nextSubmissions, event) {
    if (typeof window === "undefined") return;
    cachedSubmissions = nextSubmissions;
    cachedRaw = JSON.stringify(nextSubmissions);
    window.localStorage.setItem(ACTIVITY_STORAGE_KEY, cachedRaw);
    publishEvent(event);
}

function subscribeActivityEvents(listener) {
    if (typeof window === "undefined") return () => {};
    listeners.add(listener);
    ensureChannel();
    const handleStorage = (event) => {
        if (event.key !== ACTIVITY_STORAGE_KEY) return;
        cachedRaw = undefined;
        readSubmissions();
        listener({ type: "submissions-changed", version: 1 });
    };
    window.addEventListener("storage", handleStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", handleStorage);
    };
}

function upsertActivitySubmission({
    error,
    mutationKey,
    status,
    userId,
    variables,
}) {
    if (!userId || !variables?.clientSubmissionId) return;
    const now = Date.now();
    const next = readSubmissions().filter(
        (item) =>
            item.clientSubmissionId !== variables.clientSubmissionId ||
            item.userId !== userId,
    );
    next.push({
        clientSubmissionId: variables.clientSubmissionId,
        error: error ? { message: error.message || String(error) } : null,
        mutationKey,
        sourceTabId: getTabId(),
        status,
        submittedAt: now,
        updatedAt: now,
        userId,
        variables,
    });
    writeSubmissions(next, { type: "submission-upsert" });
}

function removeActivitySubmission({ clientSubmissionId, userId }) {
    const next = readSubmissions().filter(
        (item) =>
            item.clientSubmissionId !== clientSubmissionId ||
            item.userId !== userId,
    );
    writeSubmissions(next, { type: "submission-remove" });
}

function commitActivitySubmission({ context, variables, userId }) {
    removeActivitySubmission({
        clientSubmissionId: variables.clientSubmissionId,
        userId,
    });
    publishEvent({
        context,
        type: "activity-committed",
        userId,
    });
}

function getActivitySubmissionsSnapshot() {
    return readSubmissions();
}

function getServerActivitySubmissionsSnapshot() {
    return EMPTY_SUBMISSIONS;
}

export {
    commitActivitySubmission,
    getActivitySubmissionsSnapshot,
    getServerActivitySubmissionsSnapshot,
    getTabId,
    removeActivitySubmission,
    subscribeActivityEvents,
    upsertActivitySubmission,
};
