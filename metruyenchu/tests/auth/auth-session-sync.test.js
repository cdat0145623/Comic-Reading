import { beforeEach, describe, expect, it, vi } from "vitest";

function createStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
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
    vi.stubGlobal("crypto", {
        randomUUID: vi
            .fn()
            .mockReturnValueOnce("event-a")
            .mockReturnValueOnce("tab-a"),
    });
});

describe("auth session cross-tab events", () => {
    it("publishes a storage fallback event when BroadcastChannel is unavailable", async () => {
        const windowMock = createWindow();
        vi.stubGlobal("window", windowMock);
        const { publishAuthInvalidation } = await import(
            "@/app/_lib/auth-session-sync"
        );

        const payload = publishAuthInvalidation("email-changed");

        expect(payload).toMatchObject({
            reason: "email-changed",
            sourceTabId: "tab-a",
            type: "auth-session-invalidated",
            version: 1,
        });
        expect(
            windowMock.localStorage.getItem(
                "metruyenchu:auth-session:event:v1",
            ),
        ).toContain('"reason":"email-changed"');
    });

    it("accepts valid storage events and ignores malformed payloads", async () => {
        const windowMock = createWindow();
        vi.stubGlobal("window", windowMock);
        const { subscribeAuthInvalidation } = await import(
            "@/app/_lib/auth-session-sync"
        );
        const listener = vi.fn();
        const unsubscribe = subscribeAuthInvalidation(listener);
        const storageListener = windowMock.addEventListener.mock.calls.find(
            ([type]) => type === "storage",
        )[1];
        const event = {
            eventId: "event-b",
            reason: "password-changed",
            sourceTabId: "tab-b",
            type: "auth-session-invalidated",
            version: 1,
        };

        storageListener({
            key: "metruyenchu:auth-session:event:v1",
            newValue: JSON.stringify(event),
        });
        storageListener({
            key: "metruyenchu:auth-session:event:v1",
            newValue: "not-json",
        });

        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith(event);
        unsubscribe();
    });
});
