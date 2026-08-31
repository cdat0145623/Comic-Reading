import { libraryKeys } from "./library-query";

function getTimestamp(value) {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
}

async function syncChapterReadCaches({ event, queryClient, userId }) {
    if (event?.type !== "chapter-read" || event.userId !== userId) return false;

    queryClient.setQueryData(
        ["readChapterIds", event.storyId, userId],
        (old = []) =>
            old.includes(event.chapterId)
                ? old
                : [...old, event.chapterId],
    );

    queryClient.setQueryData(
        ["continueChapter", event.storyId, userId],
        (old) => {
            if (getTimestamp(old?.readAt) > getTimestamp(event.readAt)) {
                return old;
            }
            return {
                chapterId: event.chapterId,
                chapterNumber: event.chapterNumber,
                readAt: event.readAt,
            };
        },
    );

    await Promise.all([
        queryClient.invalidateQueries({
            queryKey: ["readingStories", userId],
            refetchType: "active",
        }),
        queryClient.invalidateQueries({
            queryKey: libraryKeys.all(userId),
            refetchType: "active",
        }),
    ]);

    return true;
}

export { syncChapterReadCaches };
