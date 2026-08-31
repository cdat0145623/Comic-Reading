import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    commitActivitySubmission,
    getActivitySubmissionsSnapshot,
    removeActivitySubmission,
    subscribeActivityEvents,
    upsertActivitySubmission,
} from "@/app/_lib/story-activity-sync";

function createStorage() {
    const values = new Map();
    return {
        getItem: (key) => values.get(key) ?? null,
        removeItem: (key) => values.delete(key),
        setItem: (key, value) => values.set(key, value),
    };
}

beforeEach(() => {
    vi.stubGlobal("window", {
        addEventListener: vi.fn(),
        localStorage: createStorage(),
        removeEventListener: vi.fn(),
        sessionStorage: createStorage(),
    });
});

describe("story activity shared submissions", () => {
    it("persists pending/error state for separate users", () => {
        upsertActivitySubmission({
            mutationKey: ["create-story-discussion", 10],
            status: "pending",
            userId: "user-a",
            variables: {
                clientSubmissionId: "submission-a",
                formData: { content: "Nội dung đang gửi" },
            },
        });
        upsertActivitySubmission({
            error: new Error("Network error"),
            mutationKey: ["create-story-discussion", 10],
            status: "error",
            userId: "user-b",
            variables: {
                clientSubmissionId: "submission-b",
                formData: { content: "Nội dung bị lỗi" },
            },
        });

        expect(getActivitySubmissionsSnapshot()).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    clientSubmissionId: "submission-a",
                    status: "pending",
                    userId: "user-a",
                }),
                expect.objectContaining({
                    clientSubmissionId: "submission-b",
                    error: { message: "Network error" },
                    status: "error",
                    userId: "user-b",
                }),
            ]),
        );
    });

    it("replaces a retry and removes only its matching submission", () => {
        const variables = {
            clientSubmissionId: "submission-a",
            formData: { content: "Nội dung" },
        };
        upsertActivitySubmission({
            mutationKey: ["create-story-discussion", 10],
            status: "error",
            userId: "user-a",
            variables,
        });
        upsertActivitySubmission({
            mutationKey: ["create-story-discussion", 10],
            status: "pending",
            userId: "user-a",
            variables,
        });

        expect(getActivitySubmissionsSnapshot()).toHaveLength(1);
        expect(getActivitySubmissionsSnapshot()[0].status).toBe("pending");

        removeActivitySubmission({
            clientSubmissionId: "submission-a",
            userId: "user-a",
        });
        expect(getActivitySubmissionsSnapshot()).toEqual([]);
    });

    it("notifies same-tab subscribers immediately", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeActivityEvents(listener);

        upsertActivitySubmission({
            mutationKey: ["upsert-story-rating", 10],
            status: "pending",
            userId: "user-a",
            variables: {
                clientSubmissionId: "submission-a",
                formData: { stars: 5 },
            },
        });

        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({ type: "submission-upsert", version: 1 }),
        );
        unsubscribe();
    });

    it("removes pending state and publishes canonical commit context", () => {
        const listener = vi.fn();
        const unsubscribe = subscribeActivityEvents(listener);
        const variables = {
            clientSubmissionId: "submission-a",
            formData: { content: "Nội dung" },
        };
        upsertActivitySubmission({
            mutationKey: ["create-story-discussion", 10],
            status: "pending",
            userId: "user-a",
            variables,
        });

        commitActivitySubmission({
            context: { domain: "root-discussion", storyId: 10 },
            userId: "user-a",
            variables,
        });

        expect(getActivitySubmissionsSnapshot()).toEqual([]);
        expect(listener).toHaveBeenCalledWith(
            expect.objectContaining({
                context: { domain: "root-discussion", storyId: 10 },
                type: "activity-committed",
                userId: "user-a",
            }),
        );
        unsubscribe();
    });
});
