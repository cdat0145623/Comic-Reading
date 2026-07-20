import { formatDistanceToNow } from "../../node_modules/date-fns/formatDistanceToNow.js";
import { id, vi } from "../../node_modules/date-fns/locale.js";
import { prisma } from "../../lib/prisma.js";
import { startOfWeek } from "../../node_modules/date-fns/startOfWeek.js";
import { endOfMonth, startOfMonth } from "date-fns";
import { cache } from "react";
import { buildCursorFilter, createCursorFromItem } from "./helper-server.js";
import { v2 as cloudinary } from "cloudinary";
// import { AppError } from "./errors.js";
import { auth } from "@/lib/auth.js";
import { buildRatingListWhere } from "./story-activity-filter.js";

cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function timeAgo(date) {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
}

function handleSentences(str) {
    return str.replace(/([.!?])\s+/g, "$1\n\n");
}

function removePasswordField(data) {
    if (Array.isArray(data)) {
        return data.map(removePasswordField);
    } else if (data instanceof Date) {
        return data;
    } else if (typeof data === "object" && data !== null) {
        return Object.entries(data).reduce((acc, [key, value]) => {
            if (key === "password") return acc;
            acc[key] = removePasswordField(value);
            return acc;
        }, {});
    }
    return data;
}

const stories = [
    { title: "Truyện A", readerCount: 50, tags: ["action", "fantasy"] },
    { title: "Truyện B", readerCount: 200, tags: ["romance", "drama"] },
    { title: "Truyện C", readerCount: 120, tags: ["action", "adventure"] },
    { title: "Truyện D", readerCount: 80, tags: ["fantasy", "romance"] },
];

function filter(stories) {
    const tagAction = stories.map((item) =>
        item.tags.filter((tag) => tag === "action"),
    );
    const sort = tagAction.sort((a, b) => b.readerCount - a.readerCount);
    return sort.map((s) => s.title);
}

function sortLatest(arr, count) {
    const latest = [...arr].sort((a, b) => b.number - a.number);
    return latest.slice(0, count);
}

function extractPositiveNumber(input) {
    if (typeof input === "number") {
        return Math.abs(input);
    }

    if (typeof input === "string") {
        const match = input.match(/-?\d+/);
        if (match) {
            return Math.abs(parseInt(match[0], 10));
        }
    }

    return null;
}

function countTotalWorlds(fields) {
    return [fields.character, fields.plot, fields.world, fields.content]
        .filter(Boolean)
        .map(function (text) {
            return text.trim().split(/\s+/).filter(Boolean).length;
        })
        .reduce(function (a, b) {
            return a + b;
        }, 0);
}

function normalizeTimeBlock(date, durationInMinutes) {
    const minutes = date.getMinutes();
    const roundedMinutes =
        Math.floor(minutes / durationInMinutes) * durationInMinutes;

    const normolized = new Date(date);
    normolized.setMinutes(roundedMinutes);
    normolized.setSeconds(0);
    normolized.setMilliseconds(0);

    return normolized;
}

function chunkArray(array, chunkSize) {
    return Array.from(
        { length: Math.floor(array.length / chunkSize) },
        (_, i) => array.slice(i * chunkSize, i * chunkSize + chunkSize),
    );
}

async function getReadingStories(userId) {
    const setting = await prisma.userSetting.findUnique({
        where: {
            userId,
        },
        select: {
            sortReading: true,
        },
    });

    const sortReading = setting?.sortReading || "RECENTLYREAD";
    const orderBy =
        sortReading === "TITLE"
            ? { story: { title: "asc" } }
            : sortReading === "LATESTCHAPTER"
              ? {
                    story: {
                        latestChapterAt: { sort: "desc", nulls: "last" },
                    },
                }
              : { lastReadAt: "desc" };

    const states = await prisma.userStoryReadingState.findMany({
        where: { userId, hiddenAt: null },
        orderBy,
        take: 5,
        select: {
            id: true,
            lastReadAt: true,
            lastChapter: { select: { number: true } },
            story: {
                select: {
                    id: true,
                    slug: true,
                    title: true,
                    totalChapters: true,
                },
            },
        },
    });

    return states.map((state) => ({
        id: state.id,
        storyId: state.story.id,
        slug: state.story.slug,
        readAt: state.lastReadAt,
        lastReadAt: state.lastReadAt,
        title: state.story.title,
        readNumber: state.lastChapter.number,
        totalChapters: state.story.totalChapters,
    }));
}

async function getUserLibrarySettings(userId) {
    const settings = await prisma.userSetting.findUnique({
        where: { userId },
        select: {
            sortReading: true,
            sortMarked: true,
            notifyGeneral: true,
        },
    });

    return (
        settings ?? {
            sortReading: "RECENTLYREAD",
            sortMarked: "RECENTLYSAVED",
            notifyGeneral: true,
        }
    );
}

async function getChapterRecentlyUpdated(page = 1, limit = 10, manager_pick) {
    const countCondition =
        manager_pick !== undefined ? { manager_pick } : undefined;

    const chapterWhereCondition =
        manager_pick !== undefined
            ? {
                  story: {
                      manager_pick: manager_pick,
                  },
              }
            : undefined;

    // console.log("Countcondition:::", countCondition);
    let offset;
    if (page) {
        if (isNaN(page)) return;
        page = extractPositiveNumber(page);
        offset = (page - 1) * limit;
    }

    let [topChaptersRencetlyUpdated, count] = await prisma.$transaction([
        prisma.chapter.findMany({
            where: chapterWhereCondition,
            orderBy: {
                postedAt: "desc",
            },
            distinct: ["storyId"],
            select: {
                name: true,
                number: true,
                content: true,
                postedAt: true,
                story: {
                    select: {
                        stringUrl: true,
                        id: true,
                        title: true,
                        totalChapters: true,
                        introduce: true,
                        author: true,
                        tags: true,
                        manager_pick: true,
                        slug: true,
                    },
                },
            },
            skip: offset,
            take: limit,
        }),
        prisma.story.count({
            where: countCondition,
        }),
    ]);

    topChaptersRencetlyUpdated = topChaptersRencetlyUpdated.map(
        ({ story, ...rest }) => ({
            ...rest,
            slug: story.slug,
            manager_pick: story.manager_pick,
            stringUrl: story.stringUrl,
            introduce: story.introduce,
            storyId: story.id,
            author: story.author.name,
            title: story.title,
            totalChapters: story.totalChapters,
            tag: story.tags.find((tag) => tag.groupId === 5)?.label,
        }),
    );

    return { topChaptersRencetlyUpdated, count };
}

async function getTopStoriesRead(minutes, limit) {
    try {
        const duration = minutes ? Number(minutes) : 15;

        const group = await prisma.topStoryRead.groupBy({
            by: ["storyId"],
            where: {
                windowStart: {
                    gte: new Date(Date.now() - duration * 60 * 1000),
                },
            },
            _sum: {
                readerCount: true,
            },
            orderBy: {
                _sum: {
                    readerCount: "desc",
                },
            },
            take: limit ?? 10,
        });

        const storyIds = group.map((item) => item.storyId);

        const stories = await prisma.story.findMany({
            where: {
                id: {
                    in: storyIds,
                },
            },
            include: {
                author: true,
                tags: true,
            },
        });

        const topStories = stories.map((story) => {
            const stats = group.find((item) => item.storyId === story.id);
            return {
                ...story,
                readerCount: stats?._sum?.readerCount ?? 0,
            };
        });

        console.log("logic server:", topStories);
        // await new Promise((res) => setTimeout(res, 5000));

        return topStories;
    } catch (error) {
        console.log("error international:", error);
        throw new Error(error);
    }
}

// async function getTopStoriesRead(minutes, limit) {
//     const now = new Date();
//     const blockTime = normalizeTimeBlock(now, Number(minutes ?? 15));

//     const topStories = await prisma.topStoryRead.findMany({
//         where: {
//             duration: minutes,
//             createdAt: blockTime,
//         },
//         orderBy: { readerCount: "desc" },
//         take: limit ?? 10,
// include: {
//     story: {
//         include: {
//             author: true,
//             tags: true,
//         },
//     },
// },
//     });
//     // await new Promise((res) => setTimeout(res, 5000));

//     return topStories;
// }

const getTotalRecordVotedStories = cache(async (month, year) => {
    const now = new Date();

    const targetYear = Number(year) || now.getFullYear();
    const targetMonth = Number(month - 1) || now.getMonth() - 1;

    const fromDate = startOfMonth(new Date(targetYear, targetMonth));
    const toDate = endOfMonth(new Date(targetYear, targetMonth));

    try {
        const totalCount = await prisma.storyRecommendation.findMany({
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            select: {
                storyId: true,
            },
            distinct: ["storyId"],
            take: 100,
        });
        return totalCount.length;
    } catch (e) {
        console.error("❌ Error at function getTopVotedStories", e);
        throw new Error("❌ Query or Database have problem:", e);
    }
});

async function getTopVotedStories(page = 1, limit = 10, month, year) {
    if (isNaN(page)) return;
    page = extractPositiveNumber(page);
    const offset = (page - 1) * limit;
    const now = new Date();
    let fromDate = startOfWeek(now, { weekStartsOn: 1 });
    fromDate.setHours(0, 0, 0, 0);

    let toDate = new Date();

    if (month || year) {
        const targetYear = Number(year) || now.getFullYear();
        const targetMonth = Number(month - 1) || now.getMonth() - 1;

        fromDate = startOfMonth(new Date(targetYear, targetMonth));
        toDate = endOfMonth(new Date(targetYear, targetMonth));
    }

    try {
        const voteStats = await prisma.storyRecommendation.groupBy({
            by: ["storyId"],
            where: {
                createdAt: {
                    gte: fromDate,
                    lte: toDate,
                },
            },
            _count: {
                storyId: true,
            },
            orderBy: {
                _count: {
                    storyId: "desc",
                },
            },
            skip: offset,
            take: limit,
        });

        if (voteStats?.length === 0) {
            // await new Promise((res) => setTimeout(res, 2000));
            return voteStats;
        }

        const storyIds = voteStats.slice(0, 100).map((vote) => vote.storyId);

        const stories = await prisma.story.findMany({
            where: {
                id: {
                    in: storyIds,
                },
            },
            include: {
                author: true,
                tags: true,
            },
        });

        const topVotes = storyIds.map((id) => {
            const story = stories.find((s) => s.id === id);
            const count =
                voteStats.find((vote) => vote.storyId === id)?._count
                    ?.storyId || 0;

            return {
                storyId: story.id,
                title: story.title,
                slug: story.slug,
                stringUrl: story.stringUrl,
                totalChapters: story.totalChapters,
                author: story.author.name,
                tag: story.tags.find((tag) => tag.groupId === 5)?.label,
                introduce: story.introduce,
                voteCount: count,
            };
        });
        // await new Promise((res) => setTimeout(res, 4000));

        return topVotes;
    } catch (e) {
        console.error("❌ Error at function getTopVotedStories", e);
        throw new Error("❌ Query or Database have problem:", e);
    }
}

const getStoriesRecentlyCompleted = cache(async (page = 1, limit = 10) => {
    if (page) {
        if (isNaN(page)) return;
        page = extractPositiveNumber(page);
    }
    try {
        const offset = (page - 1) * limit;
        const topStories = await prisma.story.findMany({
            where: {
                tags: {
                    some: {
                        slug: "hoan-thanh",
                    },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
            include: {
                tags: true,
                author: true,
            },
            skip: offset,
            take: limit,
        });
        return topStories.map(({ author, tags, ...rest }) => ({
            ...rest,
            author: author.name,
            tag: tags.find((tag) => tag.groupId === 1)?.label,
        }));
    } catch (e) {
        console.error("❌ Error at function getStoriesRecentlyCompleted", e);
        throw new Error("❌ Query or Database have problem:", e);
    }
});

const getTotalRecordCompletedStory = cache(async () => {
    const completedStories = await prisma.story.count({
        where: {
            tags: {
                some: {
                    slug: "hoan-thanh",
                },
            },
        },
        orderBy: {
            updatedAt: "desc",
        },
    });
    return completedStories;
});

const getAllAppreciate = cache(async (page = 1, limit = 4) => {
    if (page) {
        if (isNaN(page)) return;
        page = extractPositiveNumber(page);
    }
    // console.log("Server page::", page);
    const offset = (page - 1) * limit;
    const appreciatesRaw = await prisma.rating.findMany({
        orderBy: {
            createdAt: "desc",
        },
        include: {
            story: true,
            user: true,
        },
    });

    const filteredRatings = appreciatesRaw.filter((rating) => {
        const { content, character, plot, world } = rating;

        if (!content && !character && !plot && !world) return false;

        const totalLength =
            content?.length ||
            0 + character?.length ||
            0 + plot?.length ||
            0 + world?.length ||
            0;

        return totalLength >= 100;
    });

    // console.log(`HasMore = ${offset + limit}`);
    // console.log(
    //     `Page ${page} get from ${offset} to ${offset + limit} hasMore ${
    //         offset + limit < filteredRatings.length
    //     }`
    // );

    const ratings = filteredRatings
        .map(({ story, user, ...rest }) => ({
            ...rest,
            user: user.name,
            avatarUrl: user.avatarUrl,
            story: story.title,
        }))
        .slice(offset, offset + limit);

    if (limit === 4) {
        return ratings;
    }

    const totalCount = filteredRatings.length;

    return {
        ratings,
        pagination: {
            page,
            limit,
            totalCount,
            hasMore: offset + limit < totalCount,
        },
    };
});

const getRatings = async ({
    active,
    ratingId,
    rootCommentId,
    storyId,
    sortOption = "mostLiked",
    paginationCursor,
    pageSize,
    // pageSize = 10,
    isDisplayAll = false,
}) => {
    const currentUserId = (await auth())?.user?.id;
    let where;
    let orderBy;
    console.log("pageSize:", pageSize);
    console.log("pageSize:", typeof pageSize);

    const include = ratingId
        ? {
              _count: {
                  select: {
                      userLikes: true,
                  },
              },
              user: true,
              userLikes: {
                  where: { userId: currentUserId ?? "" },
                  select: {
                      userId: true,
                  },
              },
              parent: {
                  select: {
                      user: {
                          select: {
                              id: true,
                              name: true,
                          },
                      },
                  },
              },
          }
        : storyId
          ? {
                user: {
                    select: {
                        id: true,
                        name: true,
                        _count: {
                            select: {
                                chaptersRead: true,
                            },
                        },
                    },
                },
                story: true,
                _count: {
                    select: {
                        ratingUsersComments: true,
                    },
                },
                likes: {
                    where: { userId: currentUserId ?? "" },
                    select: {
                        userId: true,
                    },
                },
            }
          : {
                user: true,
                story: true,
                likes: {
                    where: { userId: currentUserId ?? "" },
                    select: {
                        userId: true,
                    },
                },
            };

    if (ratingId && active === "ratings") {
        console.log("ratingId:::", ratingId);
        console.log("paginationCursor Comment:", paginationCursor);
        orderBy = [{ createdAt: "asc" }, { id: "asc" }];

        where = {
            ratingId,
            ...(paginationCursor
                ? buildCursorFilter(paginationCursor, orderBy)
                : {}),
        };
        console.log(
            "📌 Prisma where condition for find comments:",
            JSON.stringify(where, null, 2),
        );

        const comments = await prisma.ratingComment.findMany({
            where,
            orderBy,
            take: pageSize + 1,
            include,
        });

        const commentHasMore = comments.length > pageSize;
        const results = commentHasMore ? comments.slice(0, -1) : comments;

        const nextCursor = commentHasMore
            ? createCursorFromItem(results[results.length - 1], orderBy)
            : undefined;

        return {
            comments: results,
            nextCursor,
        };
    } else {
        orderBy =
            sortOption === "mostLiked"
                ? [{ likeCount: "desc" }, { id: "desc" }, { createdAt: "desc" }]
                : sortOption === "newest"
                  ? [{ createdAt: "desc" }, { id: "desc" }]
                  : [{ createdAt: "asc" }, { id: "asc" }];

        console.log(`Where: ${where}, isDisplay: ${isDisplayAll}`);
        console.log("orderBy for Ratings", orderBy);

        console.log("paginationCursor for Rating", paginationCursor);

        if (active === "comments") {
            if (rootCommentId) {
                orderBy = [{ createdAt: "asc" }, { id: "asc" }];
                where = {
                    storyId,
                    threadRootId: rootCommentId,
                    ...(paginationCursor
                        ? buildCursorFilter(paginationCursor, orderBy)
                        : {}),
                };
            } else {
                console.log("paginationCursor discuss:", paginationCursor);
                console.log("orderBy::", orderBy);
                where = {
                    ...(storyId ? { storyId } : {}),
                    parentId: null,
                    ...(paginationCursor
                        ? buildCursorFilter(paginationCursor, orderBy)
                        : {}),
                };

                console.log(
                    "where of comments don't have ratingID",
                    JSON.stringify(where, null, 2),
                );
            }

            const discuss = await prisma.discuss.findMany({
                where,
                orderBy,
                ...(pageSize ? { take: pageSize + 1 } : {}),
                select: {
                    likeCount: true,
                    likes: {
                        select: {
                            userId: true,
                        },
                    },
                    _count: {
                        select: {
                            likes: true,
                            replies: true,
                            threadItems: true,
                        },
                    },
                    id: true,
                    content: true,
                    parentId: true,
                    threadRootId: true,
                    createdAt: true,
                    parent: {
                        select: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                },
                            },
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            chaptersRead: {
                                where: {
                                    chapter: {
                                        storyId: storyId,
                                    },
                                },
                                orderBy: {
                                    readAt: "desc",
                                },
                                take: 1,
                                select: {
                                    readAt: true,
                                    chapter: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    story: {
                        include: {
                            chapters: {
                                orderBy: {
                                    postedAt: "asc",
                                },
                                take: 1,
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
            });
            const hasMore = discuss.length > pageSize;
            const results = hasMore ? discuss.slice(0, -1) : discuss;
            const nextCursor = hasMore
                ? createCursorFromItem(results[results.length - 1], orderBy)
                : undefined;
            console.log("nexCursor for discuss:::", nextCursor);
            return {
                discuss: results,
                nextCursor,
            };
        } else {
            const baseWhere = buildRatingListWhere({
                storyId,
                isDisplayAll,
            });
            where = {
                ...baseWhere,
                ...(paginationCursor
                    ? buildCursorFilter(paginationCursor, orderBy)
                    : {}),
            };
            console.log("isDisplay:");
            console.log(
                "📌 Prisma where condition:",
                JSON.stringify(where, null, 2),
            );

            console.log("storyId", storyId);
        }
        console.log("orderBy for Rating tab::::::", orderBy);

        const [ratings, visibleCount] = await prisma.$transaction([
            prisma.rating.findMany({
                where,
                orderBy,
                take: pageSize + 1,
                include,
            }),
            prisma.rating.count({
                where: buildRatingListWhere({ storyId, isDisplayAll }),
            }),
        ]);

        // console.log("Count Rating:", count);

        const hasMore = ratings.length > pageSize;
        const results = hasMore ? ratings.slice(0, -1) : ratings;
        // dùng:
        const nextCursor = hasMore
            ? createCursorFromItem(results[results.length - 1], orderBy)
            : undefined;

        return {
            ratings: results,
            nextCursor,
            visibleCount,
        };
    }
};

const countRatings = async (storyId) => {
    return await prisma.rating.count({
        where: {
            storyId,
        },
    });
};

const getFanStory = async (storyId) => {
    const top = await prisma.storyFan.findMany({
        where: {
            storyId,
        },
        orderBy: {
            points: "desc",
        },
        take: 100,
        select: {
            points: true,
            id: true,
            storyId: true,
            user: {
                select: {
                    name: true,
                    id: true,
                },
            },
        },
    });
    // await new Promise((res) => setTimeout(res, 100000));
    return top;
};

const countBy = async ({ storyId }) => {
    const [ratingsCount, commentsCount, fansCount] = await Promise.all([
        prisma.rating.count({
            where: {
                storyId,
            },
        }),
        prisma.discuss.count({
            where: {
                storyId,
            },
        }),
        prisma.storyFan.count({
            where: {
                storyId,
            },
        }),
    ]);

    return {
        ratingsCount,
        commentsCount,
        fansCount: fansCount > 100 ? 100 : fansCount,
    };
};

async function getChaptersByStoryId(storyId) {
    console.log("StoryId:::::server", storyId);
    const chapters = await prisma.chapter.findMany({
        where: {
            storyId: Number(storyId),
        },
    });
    // await new Promise((res) => setTimeout(res, 5000));

    return chapters;
}

async function getLatestChaptersByStoryId(storyId, limit = 3) {
    const safeLimit = Number(limit) > 0 ? Number(limit) : 3;

    try {
        return await prisma.chapter.findMany({
            where: {
                storyId: Number(storyId),
            },
            select: {
                id: true,
                name: true,
                number: true,
                postedAt: true,
                storyId: true,
            },
            orderBy: {
                number: "desc",
            },
            take: safeLimit,
        });
    } catch (error) {
        console.log("Error at getLatestChaptersByStoryId::", error);
        throw new Error("Internal server error at getLatestChaptersByStoryId");
    }
}

async function getStoryDetailBySlug(slug) {
    try {
        const story = await prisma.story.findUnique({
            where: {
                slug,
            },
            include: {
                stats: {
                    select: {
                        averageRating: true,
                        totalComments: true,
                        weeklyChapter: true,
                        totalReads: true,
                        totalVotes: true,
                        totalBookmarks: true,
                    },
                },
                author: {
                    select: {
                        name: true,
                        slug: true,
                        stories: {
                            select: {
                                uploader: {
                                    select: {
                                        name: true,
                                    },
                                },
                                id: true,
                                title: true,
                                totalChapters: true,
                                tags: true,
                            },
                        },
                    },
                },
                uploader: {
                    select: {
                        id: true,
                        name: true,
                        uploadedStories: {
                            select: {
                                id: true,
                                stringUrl: true,
                                title: true,
                                slug: true,
                            },
                        },
                    },
                },
                tags: {
                    select: {
                        id: true,
                        label: true,
                        groupId: true,
                        slug: true,
                        group: {
                            select: {
                                id: true,
                                slug: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { bookmarks: true },
                },
            },
        });
        const normalizedStory = story
            ? {
                  ...story,
                  stats: {
                      ...story.stats,
                      totalBookmarks: story._count.bookmarks,
                  },
              }
            : null;

        return { story: normalizedStory, error: null };
    } catch (e) {
        console.log("Error Server International at getStoryDetailBySlug:::", e);
        return {
            story: null,
            error: "Internal server error at getStoryDetailBySlug",
        };
    }
}

async function getStoryChaptersById(storyId) {
    try {
        const story = await prisma.story.findUnique({
            where: {
                id: Number(storyId),
            },
            include: {
                chapters: {
                    select: {
                        id: true,
                        name: true,
                        number: true,
                        postedAt: true,
                    },
                    orderBy: {
                        number: "asc",
                    },
                },
            },
        });

        return {
            story,
            error: null,
        };
    } catch (e) {
        console.log("Error Server International at getStoryChaptersById:::", e);
        return {
            story: null,
            error: "Internal server error at getStoryChaptersById",
        };
    }
}

async function getReadChapterIdsByStoryId(storyId) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return { chapterIds: [], error: null };

    try {
        const reads = await prisma.chapterRead.findMany({
            where: {
                userId,
                chapter: {
                    storyId: Number(storyId),
                },
            },
            select: {
                chapterId: true,
            },
        });

        return {
            chapterIds: reads.map((read) => read.chapterId),
            error: null,
        };
    } catch (e) {
        console.log(
            "Error Server International at getReadChapterIdsByStoryId:::",
            e,
        );
        return {
            chapterIds: [],
            error: "Internal server error at getReadChapterIdsByStoryId",
        };
    }
}

async function getContinueChapterByStoryId(storyId) {
    const session = await auth();
    const userId = session?.user?.id;
    const numericStoryId = Number(storyId);

    try {
        if (userId) {
            const latestRead = await prisma.chapterRead.findFirst({
                where: {
                    userId,
                    chapter: {
                        storyId: numericStoryId,
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                select: {
                    chapterId: true,
                    chapter: {
                        select: {
                            number: true,
                        },
                    },
                },
            });

            if (latestRead) {
                return {
                    continueChapter: {
                        chapterId: latestRead.chapterId,
                        chapterNumber: latestRead.chapter.number,
                    },
                    error: null,
                };
            }
        }

        const firstChapter = await prisma.chapter.findFirst({
            where: {
                storyId: numericStoryId,
            },
            orderBy: {
                number: "asc",
            },
            select: {
                id: true,
                number: true,
            },
        });

        return {
            continueChapter: firstChapter
                ? {
                      chapterId: firstChapter.id,
                      chapterNumber: firstChapter.number,
                  }
                : null,
            error: null,
        };
    } catch (e) {
        console.log(
            "Error Server International at getContinueChapterByStoryId:::",
            e,
        );
        return {
            continueChapter: null,
            error: "Internal server error at getContinueChapterByStoryId",
        };
    }
}

async function getChapterByStorySlugAndNumber({ slug, number }) {
    const chapterNumber = Number(number.split("-")[1]);

    try {
        const story = await prisma.story.findUnique({
            where: {
                slug,
            },
            include: {
                author: {
                    select: {
                        name: true,
                    },
                },
                chapters: {
                    where: {
                        number: chapterNumber,
                    },
                    select: {
                        id: true,
                        name: true,
                        number: true,
                        content: true,
                        postedAt: true,
                        storyId: true,
                    },
                },
                _count: {
                    select: {
                        chapters: true,
                        discusses: true,
                        ratings: true,
                    },
                },
            },
        });

        return { story, error: null };
    } catch (e) {
        console.log(
            "Error Server International at getChapterByStorySlugAndNumber:::",
            e,
        );
        return {
            story: null,
            error: "Internal server error at getChapterByStorySlugAndNumber",
        };
    }
}

async function recordChapterRead({ storyId, chapterId }) {
    const session = await auth();

    if (!session?.user?.id) {
        return {
            read: null,
            error: null,
        };
    }

    const numericStoryId = Number(storyId);
    const numericChapterId = Number(chapterId);
    const now = new Date();

    try {
        const read = await prisma.$transaction(async (tx) => {
            const chapter = await tx.chapter.findUnique({
                where: {
                    id: numericChapterId,
                },
                select: {
                    id: true,
                    number: true,
                    storyId: true,
                },
            });

            if (!chapter || chapter.storyId !== numericStoryId) {
                throw new Error("Chapter does not belong to story");
            }

            await tx.chapterRead.upsert({
                where: {
                    userId_chapterId: {
                        userId: session.user.id,
                        chapterId: chapter.id,
                    },
                },
                create: {
                    userId: session.user.id,
                    chapterId: chapter.id,
                    readAt: now,
                },
                update: {
                    readAt: now,
                    updatedAt: now,
                },
            });

            await tx.chapterReadEvent.create({
                data: {
                    userId: session.user.id,
                    storyId: chapter.storyId,
                    chapterId: chapter.id,
                    readAt: now,
                },
            });

            await tx.userStoryReadingState.upsert({
                where: {
                    userId_storyId: {
                        userId: session.user.id,
                        storyId: chapter.storyId,
                    },
                },
                create: {
                    userId: session.user.id,
                    storyId: chapter.storyId,
                    lastChapterId: chapter.id,
                    lastReadAt: now,
                },
                update: {
                    lastChapterId: chapter.id,
                    lastReadAt: now,
                    hiddenAt: null,
                },
            });

            return {
                storyId: chapter.storyId,
                chapterId: chapter.id,
                chapterNumber: chapter.number,
                readAt: now,
            };
        });

        return {
            read,
            error: null,
        };
    } catch (e) {
        console.log("Error Server International at recordChapterRead:::", e);
        return {
            read: null,
            error: "Internal server error at recordChapterRead",
        };
    }
}

async function getStoryBySlug({ slug, number, storyId }) {
    if (slug && number) return getChapterByStorySlugAndNumber({ slug, number });
    if (storyId) return getStoryChaptersById(storyId);
    return getStoryDetailBySlug(slug);
}

// async function getStoryBySlug(slug, number) {
//     if (number) number = Number(number.split("-")[1]);
//     const include =
//         slug && number
//             ? {
//                   author: {
//                       select: {
//                           name: true,
//                       },
//                   },
//                   chapters: {
//                       where: {
//                           number: number,
//                       },
//                       select: {
//                           id: true,
//                           name: true,
//                           number: true,
//                           content: true,
//                           postedAt: true,
//                           storyId: true,
//                       },
//                   },
//               }
//             : {
//                   stats: {
//                       select: {
//                           averageRating: true,
//                           totalComments: true,
//                           weeklyChapter: true,
//                           totalReads: true,
//                           totalVotes: true,
//                           totalBookmarks: true,
//                       },
//                   },
//                   author: {
//                       select: {
//                           name: true,
//                           slug: true,
//                           stories: {
//                               select: {
//                                   uploader: {
//                                       select: {
//                                           name: true,
//                                       },
//                                   },
//                                   id: true,
//                                   title: true,
//                                   totalChapters: true,
//                                   tags: true,
//                               },
//                           },
//                       },
//                   },
//                   uploader: {
//                       select: {
//                           id: true,
//                           name: true,
//                           uploadedStories: {
//                               select: {
//                                   id: true,
//                                   stringUrl: true,
//                                   title: true,
//                                   slug: true,
//                               },
//                           },
//                       },
//                   },
//                   tags: {
//                       select: {
//                           id: true,
//                           label: true,
//                           groupId: true,
//                           slug: true,
//                           group: {
//                               select: {
//                                   id: true,
//                                   slug: true,
//                               },
//                           },
//                       },
//                   },
//               };
//     try {
//         let story = await prisma.story.findUnique({
//             where: {
//                 slug,
//             },
//             include,
//         });

//         return story;
//     } catch (e) {
//         console.log("Error Server International:::", e);
//         throw new Error(e);
//     }
// }

async function getAllStories() {
    const stories = await prisma.story.findMany();
    return stories;
}

async function getUser(email) {
    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    return user;
}

async function createUser(name, email, password) {
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password,
            setting: {
                create: {},
            },
        },
        select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            createdAt: true,
        },
    });

    return user;
}

async function createSignature(existImage, userId, type = "avatar") {
    const session = await auth();
    console.log("userId from server::", userId);
    console.log("sesssion user id::", session.user.id);
    console.log("session:::", session);
    if (userId !== session?.user?.id) throw new Error("Bạn chưa đăng nhập");

    const timestamp = Math.round(Date.now() / 1000);

    const folder =
        type === "avatar" ? "metruyenchu/avatars" : "metruyenchu/stories";

    const public_id = `${folder}/${userId}`;

    const paramsToSign = {
        timestamp,
        public_id,
    };

    if (existImage) {
        console.log("Đã tồn tại ảnh cũ:", public_id);
        paramsToSign.overwrite = true;
    }
    console.log("params to sign::", paramsToSign);
    const signature = cloudinary.utils.api_sign_request(
        paramsToSign,
        process.env.CLOUDINARY_API_SECRET,
    );
    return {
        signature,
        timestamp,
        public_id,
        api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    };
}

async function updateImageUser(id, imageUrl) {
    console.log("updateImageUser user id::", id);

    const session = await auth();

    console.log("session user id at updateImageUser::", session?.user?.id);
    if (!session || session?.user?.id !== id)
        throw new Error("Bạn chưa đăng nhập");
    // const { file, public_id, overwrite } = formData;
    // const public_id = formData.get("public_id");
    // const file = formData.get("file");

    // console.log("file from backend:::", file);
    // const result = await cloudinary.uploader.upload(file, {
    //     public_id,
    //     overwrite: true,
    //     invalidate: true,
    // });
    // console.log("result after upload image::", result);
    // let updatedImage;
    try {
        const updatedImage = await prisma.user.update({
            where: { id },
            data: {
                image: imageUrl,
                imageUpdatedAt: new Date(),
            },
        });

        console.log("updatedImage:::", updatedImage);
        return updatedImage;
    } catch (error) {
        console.log("Error at updateImageUser backend::", error);
        throw new Error("Error at updateImageUser backend:", error);
    }
}

export {
    getFanStory,
    timeAgo,
    countTotalWorlds,
    sortLatest,
    chunkArray,
    getReadingStories,
    getUserLibrarySettings,
    getChapterRecentlyUpdated,
    getTopStoriesRead,
    normalizeTimeBlock,
    getTopVotedStories,
    getTotalRecordVotedStories,
    getStoriesRecentlyCompleted,
    getTotalRecordCompletedStory,
    getAllAppreciate,
    getAllStories,
    getChaptersByStoryId,
    getLatestChaptersByStoryId,
    getStoryDetailBySlug,
    getChapterByStorySlugAndNumber,
    recordChapterRead,
    getStoryChaptersById,
    getReadChapterIdsByStoryId,
    getContinueChapterByStoryId,
    handleSentences,
    getUser,
    createUser,
    getRatings,
    countRatings,
    getStoryBySlug,
    countBy,
    createSignature,
    updateImageUser,
};
