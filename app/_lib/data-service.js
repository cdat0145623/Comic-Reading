import { formatDistanceToNow } from "../../node_modules/date-fns/formatDistanceToNow.js";
import { vi } from "../../node_modules/date-fns/locale.js";
import { prisma } from "@/lib/prisma.js";
import { startOfWeek } from "../../node_modules/date-fns/startOfWeek.js";
import { endOfMonth, startOfMonth } from "date-fns";
import { cache } from "react";
import { buildCursorFilter, createCursorFromItem } from "./helper-server.js";

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
        (_, i) => array.slice(i * chunkSize, i * chunkSize + chunkSize)
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

    const reads = await prisma.chapterRead.findMany({
        where: { userId },
        orderBy: { readAt: "desc" },
        include: {
            chapter: {
                include: {
                    story: true,
                },
            },
        },
    });

    const storyMap = new Map();

    for (const read of reads) {
        const storyId = read.chapter.story.id;
        if (!storyMap.has(storyId)) {
            storyMap.set(storyId, read);
        }
    }

    const stories = Array.from(storyMap.values());

    const sortReading = setting?.sortReading || "RECENTLYREAD";

    if (sortReading === "RECENTLYREAD") {
        const recentlyRead = stories
            .sort((a, b) => b.readAt - a.readAt)
            .slice(0, 5);

        // await new Promise((res) => setTimeout(res, 20000));

        return recentlyRead.map((read) => ({
            id: read.id,
            slug: read.chapter.story.slug,
            readAt: read.readAt,
            title: read.chapter.story.title,
            readNumber: read.chapter.number,
            totalChapters: read.chapter.story.totalChapters,
        }));
    }
    if (sortReading === "LATESTCHAPTER") {
        const storyIds = stories.map((r) => r.chapter.story.id);

        const latestChapters = await prisma.chapter.groupBy({
            by: ["storyId"],
            where: {
                storyId: { in: storyIds },
            },
            _max: {
                postedAt: true,
            },
        });

        const latestMap = new Map();
        for (const item of latestChapters) {
            latestMap.set(item.storyId, item._max.postedAt);
        }

        const sortLatestChapters = stories
            .map((read) => ({
                id: read.id,
                readAt: read.readAt,
                title: read.chapter.story.title,
                readNumber: read.chapter.number,
                totalChapters: read.chapter.story.totalChapters,
                latestPostedAt: latestMap.get(read.chapter.story.id),
            }))
            .sort((a, b) => b.latestPostedAt - a.latestPostedAt)
            .slice(0, 5);

        return sortLatestChapters;
    }

    if (sortReading === "TITLE") {
        const sortTitle = stories
            .sort((a, b) => {
                const titleA = a.chapter.story.title.toLowerCase();
                const titleB = b.chapter.story.title.toLowerCase();
                return titleA.localeCompare(titleB);
            })
            .slice(0, 5);

        // return sortTitle;

        return sortTitle.map((e) => ({
            id: e.id,
            readAt: e.readAt,
            title: e.chapter.story.title,
            readNumber: e.chapter.number,
            totalChapters: e.chapter.story.totalChapters,
        }));
    }
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
        })
    );

    return { topChaptersRencetlyUpdated, count };
}

async function getTopStoriesRead(minutes, limit) {
    const now = new Date();
    const blockTime = normalizeTimeBlock(now, Number(minutes ?? 15));

    const topStories = await prisma.topStoryRead.findMany({
        where: {
            duration: minutes,
            createdAt: blockTime,
        },
        orderBy: { readerCount: "desc" },
        take: limit ?? 10,
        include: {
            story: {
                include: {
                    author: true,
                    tags: true,
                },
            },
        },
    });
    // await new Promise((res) => setTimeout(res, 5000));

    return topStories;
}

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
    storyId,
    sortOption = "mostLiked",
    paginationCursor,
    pageSize,
    // pageSize = 10,
    isDisplayAll = false,
}) => {
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
                  select: {
                      userId: true,
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
                  select: {
                      userId: true,
                  },
              },
          }
        : {
              user: true,
              story: true,
              likes: {
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
            JSON.stringify(where, null, 2)
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
            if (ratingId) {
                console.log("dieu kien co ratingId", ratingId);
                orderBy = [{ createdAt: "asc" }, { id: "asc" }];
                where = {
                    storyId,
                    parentId: ratingId,
                    ...(paginationCursor
                        ? buildCursorFilter(paginationCursor, orderBy)
                        : {}),
                };
                console.log(
                    "replies of comments have ratingId:",
                    JSON.stringify(where, null, 2)
                );
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
                    JSON.stringify(where, null, 2)
                );
            }

            const discuss = await prisma.discuss.findMany({
                where,
                orderBy,
                ...(pageSize ? { take: pageSize + 1 } : {}),
                select: {
                    ...(ratingId
                        ? {
                              replies: {
                                  select: {
                                      id: true,
                                      user: {
                                          select: {
                                              id: true,
                                              name: true,
                                          },
                                      },
                                      createdAt: true,
                                      content: true,
                                      parentId: true,
                                      likeCount: true,
                                      likes: {
                                          select: {
                                              userId: true,
                                          },
                                      },
                                  },
                              },
                          }
                        : {}),
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
                        },
                    },
                    id: true,
                    content: true,
                    parentId: true,
                    createdAt: true,
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
            where = {
                ...(storyId ? { storyId } : {}),
                wordCount: {
                    gte: isDisplayAll ? 0 : 100,
                },
                ...(paginationCursor
                    ? buildCursorFilter(paginationCursor, orderBy)
                    : {}),
            };
            console.log("isDisplay:");
            console.log(
                "📌 Prisma where condition:",
                JSON.stringify(where, null, 2)
            );

            console.log("storyId", storyId);
        }
        console.log("orderBy for Rating tab::::::", orderBy);

        const [ratings, count] = await prisma.$transaction([
            prisma.rating.findMany({
                where,
                orderBy,
                take: pageSize + 1,
                include,
            }),
            prisma.rating.count({
                where: {
                    storyId: storyId,
                },
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
            count: count,
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

async function getStoryBySlug(slug) {
    try {
        let story = await prisma.story.findFirst({
            where: {
                slug,
            },
            include: {
                stats: true,
                author: {
                    include: {
                        stories: {
                            include: {
                                uploader: true,
                                tags: true,
                            },
                        },
                    },
                },
                uploader: {
                    include: {
                        uploadedStories: true,
                    },
                },
                tags: {
                    include: {
                        group: true,
                    },
                },
                chapters: true,
            },
        });

        const groupSlugs = [
            "tinh-trang",
            "the-loai",
            "tinh-cach-nhan-vat-chinh",
            "boi-canh-the-gioi",
            "luu-phai",
        ];

        const colorMap = {
            "tinh-trang": "yellow",
            "the-loai": "rose",
        };

        const selectedTag = groupSlugs.reduce((acc, slug) => {
            const tag = story.tags.find((tag) => tag.group.slug === slug);
            // console.log(tag);
            if (tag) {
                acc.push({
                    label: tag.label,
                    slug: tag.slug,
                    color: colorMap[slug] || "emerald",
                });
            }
            return acc;
        }, []);

        // await new Promise((res) => setTimeout(res, 5000));
        story = removePasswordField(story);

        return {
            ...story,
            tags: selectedTag,
        };
    } catch (e) {
        console.log("Error Server International:::", e);
    }
}

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
        },
    });

    return user;
}

export {
    getFanStory,
    timeAgo,
    countTotalWorlds,
    sortLatest,
    chunkArray,
    getReadingStories,
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
    handleSentences,
    getUser,
    createUser,
    getRatings,
    countRatings,
    getStoryBySlug,
    countBy,
};
