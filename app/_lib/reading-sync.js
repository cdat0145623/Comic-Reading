const READING_CHANNEL_NAME = "metruyenchu-reading-v1";
const READING_STORAGE_KEY = "metruyenchu:reading:event:v1";
const READING_EVENT_VERSION = 1;

let channel;
const listeners = new Set();

function getReadingTabId() {
    if (typeof window === "undefined") return "server";
    const key = "metruyenchu:reading:tab-id";
    let value = window.sessionStorage.getItem(key);
    if (!value) {
        value = crypto.randomUUID();
        window.sessionStorage.setItem(key, value);
    }
    return value;
}

function isChapterReadEvent(event) {
    return (
        event?.type === "chapter-read" &&
        event.version === READING_EVENT_VERSION &&
        Boolean(
            event.eventId &&
                event.userId &&
                event.storyId &&
                event.chapterId &&
                event.chapterNumber &&
                event.readAt,
        )
    );
}

function notifyListeners(event) {
    for (const listener of listeners) listener(event);
}

function ensureChannel() {
    if (typeof window === "undefined" || channel) return channel;
    if (!("BroadcastChannel" in window)) return null;

    channel = new BroadcastChannel(READING_CHANNEL_NAME);
    channel.addEventListener("message", ({ data }) => {
        if (isChapterReadEvent(data)) notifyListeners(data);
    });
    return channel;
}

function publishChapterReadEvent(read) {
    if (typeof window === "undefined") return null;

    const payload = {
        chapterId: read.chapterId,
        chapterNumber: read.chapterNumber,
        eventId: crypto.randomUUID(),
        readAt: read.readAt,
        sourceTabId: getReadingTabId(),
        storyId: read.storyId,
        type: "chapter-read",
        userId: read.userId,
        version: READING_EVENT_VERSION,
    };

    if (!isChapterReadEvent(payload)) return null;

    notifyListeners(payload);
    const currentChannel = ensureChannel();
    if (currentChannel) {
        currentChannel.postMessage(payload);
    } else {
        window.localStorage.setItem(
            READING_STORAGE_KEY,
            JSON.stringify(payload),
        );
    }

    return payload;
}

function subscribeChapterReadEvents(listener) {
    if (typeof window === "undefined") return () => {};

    listeners.add(listener);
    ensureChannel();

    const handleStorage = (event) => {
        if (event.key !== READING_STORAGE_KEY || !event.newValue) return;
        try {
            const payload = JSON.parse(event.newValue);
            if (isChapterReadEvent(payload)) listener(payload);
        } catch {
            // Ignore malformed cross-tab payloads.
        }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", handleStorage);
        if (listeners.size === 0 && channel) {
            channel.close();
            channel = undefined;
        }
    };
}

export {
    publishChapterReadEvent,
    subscribeChapterReadEvents,
};
