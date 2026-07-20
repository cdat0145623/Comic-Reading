import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { libraryKeys } from "@/app/_lib/library-query";
import { syncChapterReadCaches } from "@/app/_lib/reading-cache-sync";

function createEvent(overrides = {}) {
    return {
        chapterId: 53,
        chapterNumber: 53,
        readAt: "2026-07-17T08:00:00.000Z",
        storyId: 90,
        type: "chapter-read",
        userId: "user-a",
        ...overrides,
    };
}

describe("reading cache synchronization", () => {
    it("updates deterministic caches and invalidates derived lists", async () => {
        const queryClient = new QueryClient();
        const readingKey = ["readingStories", "user-a"];
        const libraryKey = libraryKeys.list({
            page: 1,
            sort: "recent",
            tab: "reading",
            userId: "user-a",
        });
        queryClient.setQueryData(["readChapterIds", 90, "user-a"], [52]);
        queryClient.setQueryData(readingKey, [{ storyId: 90 }]);
        queryClient.setQueryData(libraryKey, { items: [{ storyId: 90 }] });

        await syncChapterReadCaches({
            event: createEvent(),
            queryClient,
            userId: "user-a",
        });

        expect(
            queryClient.getQueryData(["readChapterIds", 90, "user-a"]),
        ).toEqual([52, 53]);
        expect(
            queryClient.getQueryData(["continueChapter", 90, "user-a"]),
        ).toEqual({
            chapterId: 53,
            chapterNumber: 53,
            readAt: "2026-07-17T08:00:00.000Z",
        });
        expect(queryClient.getQueryState(readingKey)?.isInvalidated).toBe(true);
        expect(queryClient.getQueryState(libraryKey)?.isInvalidated).toBe(true);
    });

    it("deduplicates read IDs and keeps a newer continue chapter", async () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(["readChapterIds", 90, "user-a"], [53]);
        queryClient.setQueryData(["continueChapter", 90, "user-a"], {
            chapterId: 54,
            chapterNumber: 54,
            readAt: "2026-07-17T09:00:00.000Z",
        });

        await syncChapterReadCaches({
            event: createEvent(),
            queryClient,
            userId: "user-a",
        });

        expect(
            queryClient.getQueryData(["readChapterIds", 90, "user-a"]),
        ).toEqual([53]);
        expect(
            queryClient.getQueryData(["continueChapter", 90, "user-a"]),
        ).toMatchObject({ chapterId: 54, chapterNumber: 54 });
    });

    it("ignores events belonging to another user", async () => {
        const queryClient = new QueryClient();

        const handled = await syncChapterReadCaches({
            event: createEvent({ userId: "user-b" }),
            queryClient,
            userId: "user-a",
        });

        expect(handled).toBe(false);
        expect(queryClient.getQueryCache().getAll()).toEqual([]);
    });
});
