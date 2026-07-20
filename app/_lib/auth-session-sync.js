const AUTH_CHANNEL_NAME = "metruyenchu-auth-session-v1";
const AUTH_STORAGE_KEY = "metruyenchu:auth-session:event:v1";
const AUTH_EVENT_VERSION = 1;

let channel;

function getAuthTabId() {
    if (typeof window === "undefined") return "server";
    const key = "metruyenchu:auth-session:tab-id";
    let value = window.sessionStorage.getItem(key);
    if (!value) {
        value = crypto.randomUUID();
        window.sessionStorage.setItem(key, value);
    }
    return value;
}

function isAuthInvalidationEvent(event) {
    return (
        event?.type === "auth-session-invalidated" &&
        event.version === AUTH_EVENT_VERSION &&
        typeof event.eventId === "string" &&
        typeof event.reason === "string" &&
        typeof event.sourceTabId === "string"
    );
}

function ensureChannel() {
    if (typeof window === "undefined" || channel) return channel;
    if (!("BroadcastChannel" in window)) return null;
    channel = new BroadcastChannel(AUTH_CHANNEL_NAME);
    return channel;
}

function publishAuthInvalidation(reason) {
    if (typeof window === "undefined") return null;
    const payload = {
        eventId: crypto.randomUUID(),
        reason,
        sourceTabId: getAuthTabId(),
        type: "auth-session-invalidated",
        version: AUTH_EVENT_VERSION,
    };
    const currentChannel = ensureChannel();
    if (currentChannel) {
        currentChannel.postMessage(payload);
    } else {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    }
    return payload;
}

function subscribeAuthInvalidation(listener) {
    if (typeof window === "undefined") return () => {};
    const currentChannel = ensureChannel();
    const handleMessage = ({ data }) => {
        if (isAuthInvalidationEvent(data)) listener(data);
    };
    const handleStorage = (event) => {
        if (event.key !== AUTH_STORAGE_KEY || !event.newValue) return;
        try {
            const payload = JSON.parse(event.newValue);
            if (isAuthInvalidationEvent(payload)) listener(payload);
        } catch {
            // Ignore malformed cross-tab payloads.
        }
    };

    currentChannel?.addEventListener("message", handleMessage);
    window.addEventListener("storage", handleStorage);
    return () => {
        currentChannel?.removeEventListener("message", handleMessage);
        window.removeEventListener("storage", handleStorage);
    };
}

export {
    getAuthTabId,
    isAuthInvalidationEvent,
    publishAuthInvalidation,
    subscribeAuthInvalidation,
};
