import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 10;
const VALID_TABS = new Set(["reading", "bookmarked"]);
const VALID_SORTS = {
    reading: new Set(["recent", "chapter", "title"]),
    bookmarked: new Set(["saved", "chapter", "title"]),
};

function normalizeLibraryParams({ tab, page, sort }) {
    const normalizedTab = VALID_TABS.has(tab) ? tab : "reading";
    const normalizedPage = Math.max(1, Number(page) || 1);
    const fallbackSort = normalizedTab === "reading" ? "recent" : "saved";
    const normalizedSort = VALID_SORTS[normalizedTab].has(sort)
        ? sort
        : fallbackSort;

    return {
        tab: normalizedTab,
        page: normalizedPage,
        pageSize: PAGE_SIZE,
        sort: normalizedSort,
    };
}

function getReadingOrderBy(sort) {
    if (sort === "title") return { story: { title: "asc" } };
    if (sort === "chapter") {
        return { story: { latestChapterAt: { sort: "desc", nulls: "last" } } };
    }
    return { lastReadAt: "desc" };
}

function getBookmarkOrderBy(sort) {
    if (sort === "title") return { story: { title: "asc" } };
    if (sort === "chapter") {
        return { story: { latestChapterAt: { sort: "desc", nulls: "last" } } };
    }
    return { createdAt: "desc" };
}

const storySelect = (userId) => ({
    id: true,
    title: true,
    slug: true,
    stringUrl: true,
    totalChapters: true,
    latestChapterAt: true,
    chapters: {
        orderBy: { number: "desc" },
        take: 1,
        select: { id: true, number: true, name: true, postedAt: true },
    },
    subscriptions: {
        where: { userId },
        take: 1,
        select: { id: true },
    },
});

function mapReadingItem(state) {
    const latestChapter = state.story.chapters[0] ?? null;
    return {
        storyId: state.storyId,
        title: state.story.title,
        slug: state.story.slug,
        coverUrl: state.story.stringUrl,
        totalChapters: state.story.totalChapters ?? latestChapter?.number ?? 0,
        lastChapter: state.lastChapter,
        lastReadAt: state.lastReadAt,
        latestChapter,
        subscribed: state.story.subscriptions.length > 0,
    };
}

function mapBookmarkedItem(bookmark) {
    const latestChapter = bookmark.story.chapters[0] ?? null;
    const readingState = bookmark.story.readingStates[0] ?? null;
    return {
        storyId: bookmark.storyId,
        title: bookmark.story.title,
        slug: bookmark.story.slug,
        coverUrl: bookmark.story.stringUrl,
        totalChapters:
            bookmark.story.totalChapters ?? latestChapter?.number ?? 0,
        lastChapter: readingState?.lastChapter ?? null,
        lastReadAt: readingState?.lastReadAt ?? null,
        bookmarkedAt: bookmark.createdAt,
        latestChapter,
        subscribed: bookmark.story.subscriptions.length > 0,
    };
}

async function getUserLibraryPage({ userId, tab, page, sort }) {
    const params = normalizeLibraryParams({ tab, page, sort });

    if (params.tab === "reading") {
        const where = { userId, hiddenAt: null };
        const totalItems = await prisma.userStoryReadingState.count({ where });
        const totalPages = Math.max(1, Math.ceil(totalItems / params.pageSize));
        const effectivePage = Math.min(params.page, totalPages);
        const rows = await prisma.userStoryReadingState.findMany({
            where,
            orderBy: getReadingOrderBy(params.sort),
            skip: (effectivePage - 1) * params.pageSize,
            take: params.pageSize + 1,
            select: {
                storyId: true,
                lastReadAt: true,
                lastChapter: {
                    select: { id: true, number: true, name: true },
                },
                story: { select: storySelect(userId) },
            },
        });
        const mapped = rows.map(mapReadingItem);
        return buildLibraryResponse(mapped, totalItems, {
            ...params,
            page: effectivePage,
        });
    }

    const where = { userId };
    const totalItems = await prisma.storyBookmark.count({ where });
    const totalPages = Math.max(1, Math.ceil(totalItems / params.pageSize));
    const effectivePage = Math.min(params.page, totalPages);
    const rows = await prisma.storyBookmark.findMany({
        where,
        orderBy: getBookmarkOrderBy(params.sort),
        skip: (effectivePage - 1) * params.pageSize,
        take: params.pageSize + 1,
        select: {
            storyId: true,
            createdAt: true,
            story: {
                select: {
                    ...storySelect(userId),
                    readingStates: {
                        where: { userId, hiddenAt: null },
                        take: 1,
                        select: {
                            lastReadAt: true,
                            lastChapter: {
                                select: {
                                    id: true,
                                    number: true,
                                    name: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    const mapped = rows.map(mapBookmarkedItem);
    return buildLibraryResponse(mapped, totalItems, {
        ...params,
        page: effectivePage,
    });
}

function buildLibraryResponse(mapped, totalItems, params) {
    const totalPages = Math.max(1, Math.ceil(totalItems / params.pageSize));
    return {
        items: mapped.slice(0, params.pageSize),
        lookaheadItem: mapped[params.pageSize] ?? null,
        page: Math.min(params.page, totalPages),
        pageSize: params.pageSize,
        totalItems,
        totalPages,
        tab: params.tab,
        sort: params.sort,
    };
}

async function hideReadingStory({ userId, storyId }) {
    const result = await prisma.userStoryReadingState.updateMany({
        where: { userId, storyId, hiddenAt: null },
        data: { hiddenAt: new Date() },
    });
    return result.count > 0;
}

async function setStoryBookmark({ userId, storyId, enabled }) {
    if (!enabled) {
        await prisma.storyBookmark.deleteMany({ where: { userId, storyId } });
        return false;
    }
    await prisma.storyBookmark.upsert({
        where: { userId_storyId: { userId, storyId } },
        create: { userId, storyId },
        update: {},
    });
    return true;
}

async function getStoryBookmark({ userId, storyId }) {
    const bookmark = await prisma.storyBookmark.findUnique({
        where: { userId_storyId: { userId, storyId } },
        select: { id: true },
    });
    return Boolean(bookmark);
}

async function setStorySubscription({ userId, storyId, enabled }) {
    if (!enabled) {
        await prisma.storySubscription.deleteMany({ where: { userId, storyId } });
        return false;
    }
    await prisma.storySubscription.upsert({
        where: { userId_storyId: { userId, storyId } },
        create: { userId, storyId },
        update: {},
    });
    return true;
}

async function createNewChapterNotifications({ storyId, chapterId, chapterName }) {
    const subscriptions = await prisma.storySubscription.findMany({
        where: { storyId },
        select: { userId: true },
    });
    if (subscriptions.length === 0) return 0;

    const story = await prisma.story.findUnique({
        where: { id: storyId },
        select: { title: true },
    });
    if (!story) return 0;

    const result = await prisma.notification.createMany({
        data: subscriptions.map(({ userId }) => ({
            userId,
            storyId,
            type: "NEW_CHAPTER",
            title: `${story.title} có chương mới`,
            content: chapterName || null,
            dedupeKey: `NEW_CHAPTER:${chapterId}:${userId}`,
        })),
        skipDuplicates: true,
    });
    return result.count;
}

export {
    createNewChapterNotifications,
    getStoryBookmark,
    getUserLibraryPage,
    hideReadingStory,
    normalizeLibraryParams,
    setStoryBookmark,
    setStorySubscription,
};
