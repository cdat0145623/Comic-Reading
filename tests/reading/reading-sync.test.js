import { beforeEach, describe, expect, it, vi } from "vitest";

function createStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
    };
}

function createWindow(overrides = {}) {
    return {
        addEventListener: vi.fn(),
        localStorage: createStorage(),
        removeEventListener: vi.fn(),
        sessionStorage: createStorage(),
        ...overrides,
    };
}

beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
});

describe("reading cross-tab events", () => {
    it("notifies the current tab and writes a storage fallback", async () => {
        const windowMock = createWindow();
        vi.stubGlobal("window", windowMock);
        const { publishChapterReadEvent, subscribeChapterReadEvents } =
            await import("@/app/_lib/reading-sync");
        const listener = vi.fn();
        const unsubscribe = subscribeChapterReadEvents(listener);

        const payload = publishChapterReadEvent({
            chapterId: 53,
            chapterNumber: 53,
            readAt: "2026-07-17T08:00:00.000Z",
            storyId: 90,
            userId: "user-a",
        });

        expect(listener).toHaveBeenCalledWith(payload);
        expect(windowMock.localStorage.getItem(
            "metruyenchu:reading:event:v1",
        )).toContain('"type":"chapter-read"');
        unsubscribe();
    });

    it("receives a storage fallback event from another tab", async () => {
        const windowMock = createWindow();
        vi.stubGlobal("window", windowMock);
        const { subscribeChapterReadEvents } = await import(
            "@/app/_lib/reading-sync"
        );
        const listener = vi.fn();
        const unsubscribe = subscribeChapterReadEvents(listener);
        const storageListener = windowMock.addEventListener.mock.calls.find(
            ([type]) => type === "storage",
        )[1];
        const event = {
            chapterId: 53,
            chapterNumber: 53,
            eventId: "event-storage",
            readAt: "2026-07-17T08:00:00.000Z",
            sourceTabId: "another-tab",
            storyId: 90,
            type: "chapter-read",
            userId: "user-a",
            version: 1,
        };

        storageListener({
            key: "metruyenchu:reading:event:v1",
            newValue: JSON.stringify(event),
        });

        expect(listener).toHaveBeenCalledWith(event);
        unsubscribe();
    });

    it("delivers valid BroadcastChannel messages and closes on unsubscribe", async () => {
        class BroadcastChannelMock {
            constructor() {
                BroadcastChannelMock.instance = this;
                this.close = vi.fn();
                this.postMessage = vi.fn();
            }

            addEventListener(_type, listener) {
                this.messageListener = listener;
            }
        }

        vi.stubGlobal("BroadcastChannel", BroadcastChannelMock);
        vi.stubGlobal(
            "window",
            createWindow({ BroadcastChannel: BroadcastChannelMock }),
        );
        const { subscribeChapterReadEvents } = await import(
            "@/app/_lib/reading-sync"
        );
        const listener = vi.fn();
        const unsubscribe = subscribeChapterReadEvents(listener);
        const event = {
            chapterId: 53,
            chapterNumber: 53,
            eventId: "event-a",
            readAt: "2026-07-17T08:00:00.000Z",
            sourceTabId: "another-tab",
            storyId: 90,
            type: "chapter-read",
            userId: "user-a",
            version: 1,
        };

        BroadcastChannelMock.instance.messageListener({ data: event });

        expect(listener).toHaveBeenCalledWith(event);
        unsubscribe();
        expect(BroadcastChannelMock.instance.close).toHaveBeenCalledOnce();
    });
});
