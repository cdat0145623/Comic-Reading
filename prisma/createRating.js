import { prisma } from "../lib/prisma.js";
import {
    countTotalWorlds,
    generateRandomElement,
    generateRandomRating,
    generateRandomWord,
    generateTextWithSentences,
} from "./helper-prisma.js";

async function createManyRating() {
    let userIds = await prisma.user.findMany({
        select: {
            id: true,
        },
    });
    userIds = userIds.slice(0, 3);
    console.log("Get all userIds:::::::", userIds);

    let storyIds = await prisma.story.findMany({
        select: {
            id: true,
        },
    });
    // storyIds = storyIds.slice(0, 3);
    console.log("Get all storyIds ::::::::", storyIds);

    for (const user of userIds) {
        console.log("---------------------------------------------------");
        console.log(`User ${user.id}:::::::`);
        for (const story of storyIds) {
            console.log(`Story ${story.id}::::::::`);
            const data = await prisma.$transaction(async (tx) => {
                await tx.rating.create({
                    data: {
                        stars: generateRandomRating(),
                        content: generateTextWithSentences(110),
                        character: generateRandomWord(),
                        plot: generateRandomWord(),
                        world: generateRandomWord(),
                        userId: user.id,
                        storyId: story.id,
                    },
                });
            });
            console.log(`Story ${story.id} have data:`, data);
        }
        console.log(`✅ Seed completed User ${user.id}`);
        console.log("---------------------------------------------------");
    }
}

async function createRatings() {
    const users = await prisma.user.findMany({
        where: {
            ratingStorys: {
                none: {},
            },
        },
        select: {
            id: true,
        },
    });
    // const randomCount = Math.floor(Math.random() * users.length) + 1;
    // const randomUsers = generateRandomElement(users, 2);
    // console.log(
    //     `List user was choosed in order to update:: ${randomCount}`,
    //     randomUsers
    // );
    // const userIds = user.slice(0, 3);
    // console.log("Choose 3 user begin:", userIds);

    const userStoryMap = await Promise.all(
        randomUsers.map(async (user) => {
            const chapters = await prisma.chapterRead.findMany({
                where: {
                    userId: user.id,
                },
                select: {
                    chapter: {
                        select: {
                            storyId: true,
                        },
                    },
                },
            });

            console.log("chapters:::", chapters);

            const uniqueStoryIds = Array.from(
                new Set(chapters.map((item) => item.chapter.storyId))
            ).map((id) => ({ storyId: id }));

            console.log("uniqueStoryIds:::", uniqueStoryIds);

            return {
                userId: user.id,
                storyIds: uniqueStoryIds,
            };
        })
    );

    console.log("userStoryMap:::", userStoryMap);
    console.log("userStoryMap:::", JSON.stringify(userStoryMap, null, 2));

    for (const user of userStoryMap) {
        console.log("---------------------------------------------------");
        console.log(`User ${user?.userId}:::::::`);
        const { storyIds } = user;
        console.log("StoryIds:::", storyIds);
        for (const story of storyIds) {
            console.log(`Story ${story?.storyId}::::::::`);
            // const content = generateTextWithSentences(100);
            const character = generateRandomWord();
            const plot = "";
            const world = "";
            const content = generateTextWithSentences(100);
            const rating = { character, plot, world, content };
            const wordCount = countTotalWorlds(rating);

            const data = await prisma.$transaction(async (tx) => {
                await tx.rating.upsert({
                    where: {
                        userId_storyId: {
                            userId: user.userId,
                            storyId: story.storyId,
                        },
                    },
                    update: {},
                    create: {
                        stars: generateRandomRating(),
                        content,
                        character: generateRandomWord(),
                        plot: generateRandomWord(),
                        world: generateRandomWord(),
                        wordCount,
                        userId: user.userId,
                        storyId: story.storyId,
                    },
                });
                // await tx.rating.upsert({
                //     data: {
                //         stars: generateRandomRating(),
                //         content: generateTextWithSentences(110),
                //         character: generateRandomWord(),
                //         plot: generateRandomWord(),
                //         world: generateRandomWord(),
                //         userId: user.userId,
                //         storyId: story.storyId,
                //     },
                // });
            });
            console.log(`Story ${story.storyId} have data:`, data);
        }
        console.log(`✅ Seed completed User ${user.userId}`);
        console.log("---------------------------------------------------");
    }
}

async function createComments() {
    const users = await prisma.user.findMany({
        where: {
            ratingComments: {
                none: {},
            },
        },
        select: {
            id: true,
        },
    });
    // const randomCount = Math.floor(Math.random() * users.length) + 1;
    // const randomUsers = generateRandomElement(users, randomCount);
    // console.log(
    //     `List user was choosed in order to update:: ${randomCount}`,
    //     randomUsers
    // );
    // const userIds = user.slice(0, 3);
    // console.log("Choose 3 user begin:", userIds);

    const userStoryMap = await Promise.all(
        users.map(async (user) => {
            const chapters = await prisma.chapterRead.findMany({
                where: {
                    userId: user.id,
                },
                select: {
                    chapter: {
                        select: {
                            storyId: true,
                        },
                    },
                },
            });

            console.log("chapters:::", chapters);

            const uniqueStoryIds = Array.from(
                new Set(chapters.map((item) => item.chapter.storyId))
            ).map((id) => ({ storyId: id }));

            console.log("uniqueStoryIds:::", uniqueStoryIds);

            return {
                userId: user.id,
                storyIds: uniqueStoryIds,
            };
        })
    );

    console.log("userStoryMap:::", userStoryMap);
    console.log("userStoryMap:::", JSON.stringify(userStoryMap, null, 2));

    for (const user of userStoryMap) {
        console.log("---------------------------------------------------");
        console.log(`User ${user?.userId}:::::::`);
        const { storyIds } = user;
        console.log("StoryIds:::", storyIds);
        for (const story of storyIds) {
            console.log(`Story ${story?.storyId}::::::::`);
            // const content = generateTextWithSentences(100);
            const content = generateTextWithSentences(15);

            const data = await prisma.$transaction(async (tx) => {
                await tx.discuss.createMany({
                    data: {
                        content:
                            `Đây là bình luận cho truyện ${story.storyId} cua user ${user.userId}:` +
                            content,
                        userId: user.userId,
                        storyId: story.storyId,
                    },
                });
                // await tx.rating.upsert({
                //     data: {
                //         stars: generateRandomRating(),
                //         content: generateTextWithSentences(110),
                //         character: generateRandomWord(),
                //         plot: generateRandomWord(),
                //         world: generateRandomWord(),
                //         userId: user.userId,
                //         storyId: story.storyId,
                //     },
                // });
            });
            console.log(`Story ${story.storyId} have data:`, data);
        }
        console.log(`✅ Seed completed User ${user.userId}`);
        console.log("---------------------------------------------------");
    }
}

async function createRatingLike() {
    let userIds = await prisma.user.findMany({
        where: {
            email: "conchim23@gmail.com",
        },
        select: {
            id: true,
        },
    });
    // userIds = userIds.slice(0, 5);
    console.log("Get All User have UserIds:", userIds);

    let ratingIds = await prisma.rating.findMany({
        where: {
            id: 39,
        },
    });
    console.log("Get all Rating have RatingIds:", ratingIds);

    const lengthRating = await prisma.rating.count();

    for (const user of userIds) {
        console.log(`User ${user.id}:`);
        const randomCount = Math.floor(Math.random() * lengthRating) + 1;
        console.log(`User ${user.id} have randomCount is:`, randomCount);

        const randomRatingIds = generateRandomElement(ratingIds, lengthRating);
        console.log(
            `User ${user.id} have ${randomCount} randomCount and forexample:`,
            randomRatingIds
        );
        for (const ratingId of randomRatingIds) {
            console.log("Rating have id:", ratingId.id);
            await prisma.$transaction(async (tx) => {
                await tx.ratingLike.upsert({
                    where: {
                        userId_ratingId: {
                            userId: user.id,
                            ratingId: ratingId.id,
                        },
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        ratingId: ratingId.id,
                    },
                });
            });
        }
        console.log(`✅ Seed completed rating of User ${user.id}`);
        console.log("---------------------------------------------------");
    }
}

async function updateCountRaintForAllRatings() {
    const likeCounts = await prisma.ratingLike.groupBy({
        by: ["ratingId"],
        _count: {
            ratingId: true,
        },
    });

    console.log("likeCounts:::", likeCounts);

    for (const item of likeCounts) {
        await prisma.$transaction(async (tx) => {
            await tx.rating.update({
                where: {
                    id: item.ratingId,
                },
                data: {
                    likeCount: item._count.ratingId,
                },
            });
        });
    }

    console.log(`✅ Đã cập nhật likeCount cho ${likeCounts.length} rating.`);
}

async function rateForStoriesUserHaveReadButDontRating() {
    const usersWithStoriesRead = await prisma.user.findMany({
        include: {
            chaptersRead: {
                select: {
                    chapter: {
                        select: {
                            storyId: true,
                        },
                    },
                },
            },
            ratingStorys: {
                select: {
                    storyId: true,
                },
            },
        },
    });

    console.log("usersWithStoriesRead::", usersWithStoriesRead);

    const result = usersWithStoriesRead.map((user) => {
        // Truyện đã đọc
        const storiesRead = [
            ...new Set(user.chaptersRead.map((cr) => cr.chapter.storyId)),
        ];

        // Truyện đã đánh giá
        const ratedStoryIds = user.ratingStorys.map((r) => r.storyId);

        // Gắn cờ "đã đánh giá chưa"
        const stories = storiesRead.map((storyId) => ({
            storyId,
            hasRated: ratedStoryIds.includes(storyId),
        }));

        return {
            userId: user.id,
            stories,
        };
    });

    console.log("Result after resolve:::", result);

    console.log("userStoryMap:::", result);
    console.log("userStoryMap:::", JSON.stringify(result, null, 2));

    for (const user of result) {
        console.log("---------------------------------------------------");
        console.log(`User ${user?.userId}:::::::`);
        const { stories } = user;
        console.log("StoryIds:::", stories);
        for (const story of stories) {
            console.log(`Story ${story?.storyId}::::::::`);
            // const content = generateTextWithSentences(100);
            if (story.hasRated) continue;

            const character = generateRandomWord();
            const plot = "";
            const world = "";
            const content = generateTextWithSentences(100);
            const rating = { character, plot, world, content };
            const wordCount = countTotalWorlds(rating);

            const data = await prisma.$transaction(async (tx) => {
                await tx.rating.upsert({
                    where: {
                        userId_storyId: {
                            userId: user.userId,
                            storyId: story.storyId,
                        },
                    },
                    update: {},
                    create: {
                        stars: generateRandomRating(),
                        content,
                        character: generateRandomWord(),
                        plot: generateRandomWord(),
                        world: generateRandomWord(),
                        wordCount,
                        userId: user.userId,
                        storyId: story.storyId,
                    },
                });
                // await tx.rating.upsert({
                //     data: {
                //         stars: generateRandomRating(),
                //         content: generateTextWithSentences(110),
                //         character: generateRandomWord(),
                //         plot: generateRandomWord(),
                //         world: generateRandomWord(),
                //         userId: user.userId,
                //         storyId: story.storyId,
                //     },
                // });
            });
            console.log(`Story ${story.storyId} have data:`, data);
        }
        console.log(`✅ Seed completed User ${user.userId}`);
        console.log("---------------------------------------------------");
    }
}

async function createRatingComment() {
    const storyIds = await prisma.story.findMany({
        select: {
            id: true,
        },
    });
    const userIds = await prisma.user.findMany({
        select: {
            id: true,
        },
    });

    for (const story of storyIds) {
        const ratingStory = await prisma.story.findMany({
            where: {
                id: story.id,
            },
            include: {
                ratings: true,
            },
        });
        console.log(`All record of Story ${story.id} are:`, ratingStory);
        const selectedRating = ratingStory
            .map((groupRating) => randomItem(groupRating.ratings))
            .filter(Boolean);
        console.log(`Story ${story.id} have random rating is:`, selectedRating);

        const randomUser = generateRandomElement(userIds, userIds.length);
        console.log("RandomUser:", randomUser);
        for (const user of randomUser) {
            await prisma.ratingComment.create({
                data: {
                    content: generateRandomWord(20),
                    userId: user.id,
                    ratingId: selectedRating[0].id,
                },
            });
        }
    }
}

async function createRatingCommentForOnlyRating() {
    const user = await prisma.user.findUnique({
        where: {
            email: "acc3@gmail.com",
        },
    });

    const rating = await prisma.rating.findFirst({
        where: {
            id: 90,
            userId: user.id,
        },
    });

    console.log("rating seed:::", rating);

    let users = await prisma.user.findMany({
        where: {
            id: {
                not: user.id,
            },
        },
        select: {
            id: true,
        },
    });
    // const randomCount = Math.floor(Math.random() * users.length) + 1;
    users = generateRandomElement(users, 7);
    console.log(`Others users length: ${users.length}`, users);

    await Promise.all(
        users.map((u) =>
            prisma.ratingComment.create({
                data: {
                    content: `Đây là bình luận cho ratingId = ${
                        rating.id
                    } của user ${u.id}: ${generateRandomWord(10)}`,
                    ratingId: rating.id,
                    userId: u.id,
                },
            })
        )
    );
}

async function replyRatingComment() {
    const rootComment = await prisma.ratingComment.findFirst({
        where: {
            ratingId: 37,
        },
        select: {
            id: true,
            ratingId: true,
        },
    });
    console.log("RootComment:", rootComment);

    const otherComment = await prisma.ratingComment.findMany({
        where: {
            id: {
                not: rootComment.id,
            },
        },
        select: {
            id: true,
            userId: true,
        },
    });
    console.log("otherComment:", otherComment);

    await Promise.all(
        otherComment.map((o) =>
            prisma.ratingComment.create({
                data: {
                    content: `Đây là phản hồi cho bình luận gốc ${
                        rootComment.id
                    } của user ${o.userId} : ${generateRandomWord(5)}`,
                    userId: o.userId,
                    ratingId: rootComment.ratingId,
                    parentId: rootComment.id,
                },
            })
        )
    );
}

async function deleteManyRatingComment() {
    // 1. Xóa các comment có id >= 150
    await prisma.ratingComment.deleteMany({
        where: {
            id: {
                gte: 74,
            },
        },
    });

    // 2. Lấy ID lớn nhất còn lại
    const result = await prisma.ratingComment.aggregate({
        _max: {
            id: true,
        },
    });
    const maxId = result._max.id || 0;

    // 3. Reset lại sequence để auto-increment đúng
    //RatingComment
    await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "RatingComment_id_seq" RESTART WITH ${maxId + 1};`
    );
}
async function deleteManyDiscuss() {
    // 1. Xóa các comment có id >= 150
    await prisma.discuss.deleteMany({
        where: {
            id: {
                gte: 46,
            },
        },
    });

    // 2. Lấy ID lớn nhất còn lại
    const result = await prisma.discuss.aggregate({
        _max: {
            id: true,
        },
    });
    const maxId = result._max.id || 0;

    // 3. Reset lại sequence để auto-increment đúng
    //RatingComment
    await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "Discuss_id_seq" RESTART WITH ${maxId + 1};`
    );
}

async function createCommentsLike() {
    let userIds = await prisma.user.findMany({
        select: {
            id: true,
        },
    });
    userIds = userIds.slice(0, 5);
    console.log("Get All User have UserIds:", userIds);

    let commentIds = await prisma.discuss.findMany({
        where: {
            id: {
                gte: 35,
            },
        },
    });
    console.log("Get all commentIds have commentIds:", commentIds);

    const lengthComment = await prisma.discuss.count({
        where: {
            id: {
                gte: 35,
            },
        },
    });

    for (const user of userIds) {
        console.log(`User ${user.id}:`);
        const randomCount = Math.floor(Math.random() * lengthComment) + 1;
        console.log(`User ${user.id} have randomCount is:`, randomCount);

        const randomCommentIds = generateRandomElement(
            commentIds,
            lengthComment
        );
        console.log(
            `User ${user.id} have ${randomCount} randomCount and forexample:`,
            randomCommentIds
        );
        for (const commentId of randomCommentIds) {
            console.log("Rating have id:", commentId.id);
            await prisma.$transaction(async (tx) => {
                await tx.discussLike.upsert({
                    where: {
                        userId_discussId: {
                            userId: user.id,
                            discussId: commentId.id,
                        },
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        discussId: commentId.id,
                    },
                });
            });
        }
        console.log(`✅ Seed completed rating of User ${user.id}`);
        console.log("---------------------------------------------------");
    }
}

async function createFansStory() {
    const users = await prisma.user.findMany({
        where: {
            storysFan: {
                none: {},
            },
        },
        select: {
            id: true,
        },
    });
    // const randomCount = Math.floor(Math.random() * users.length) + 1;
    // const randomUsers = generateRandomElement(users, randomCount);
    // console.log(
    //     `List user was choosed in order to update:: ${randomCount}`,
    //     randomUsers
    // );
    // const userIds = user.slice(0, 3);
    // console.log("Choose 3 user begin:", userIds);

    const userStoryMap = await Promise.all(
        users.map(async (user) => {
            const chapters = await prisma.chapterRead.findMany({
                where: {
                    userId: user.id,
                },
                select: {
                    chapter: {
                        select: {
                            storyId: true,
                        },
                    },
                },
            });

            console.log("chapters:::", chapters);

            const uniqueStoryIds = Array.from(
                new Set(chapters.map((item) => item.chapter.storyId))
            ).map((id) => ({ storyId: id }));

            console.log("uniqueStoryIds:::", uniqueStoryIds);

            return {
                userId: user.id,
                storyIds: uniqueStoryIds,
                count: chapters.length,
            };
        })
    );

    console.log("userStoryMap:::", userStoryMap);
    console.log("userStoryMap:::", JSON.stringify(userStoryMap, null, 2));

    for (const user of userStoryMap) {
        console.log("---------------------------------------------------");
        console.log(`User ${user?.userId}:::::::`);
        const { storyIds, count } = user;
        console.log("StoryIds:::", storyIds);
        for (const story of storyIds) {
            console.log(`Story ${story?.storyId}::::::::`);
            // const content = generateTextWithSentences(100);
            const points = Math.random() * count * 100;

            const data = await prisma.$transaction(async (tx) => {
                await tx.storyFan.createMany({
                    data: {
                        points,
                        userId: user.userId,
                        storyId: story.storyId,
                    },
                });
                // await tx.rating.upsert({
                //     data: {
                //         stars: generateRandomRating(),
                //         content: generateTextWithSentences(110),
                //         character: generateRandomWord(),
                //         plot: generateRandomWord(),
                //         world: generateRandomWord(),
                //         userId: user.userId,
                //         storyId: story.storyId,
                //     },
                // });
            });
            console.log(`Story ${story.storyId} have data:`, data);
        }
        console.log(`✅ Seed completed User ${user.userId}`);
        console.log("---------------------------------------------------");
    }
}

async function createDiscussLike() {
    const userIds = await prisma.user.findMany({
        select: {
            id: true,
        },
    });
    const randomUsers = generateRandomElement(userIds, 10);
    const discuss = await prisma.discuss.findUnique({
        where: {
            id: 1,
        },
    });
    for (const user of randomUsers) {
        await prisma.discussLike.create({
            data: {
                userId: user.id,
                discussId: discuss.id,
            },
        });
    }
}

async function updateLikeCountForDiscuss() {
    const likeCounts = await prisma.discussLike.groupBy({
        by: ["discussId"],
        _count: { discussId: true },
    });

    // B2: Cập nhật lại likeCount cho từng Discuss
    for (const item of likeCounts) {
        await prisma.discuss.update({
            where: { id: item.discussId },
            data: {
                likeCount: item._count.discussId,
            },
        });
    }
}

export async function main() {
    // await createManyRating();
    // await createRatingLike();
    // await updateCountRaintForAllRatings();
    // await rateForStoriesUserHaveReadButDontRating();
    try {
        await updateLikeCountForDiscuss();
        // await deleteManyDiscuss();
        // await createDiscussLike();
        // await createFansStory();

        // await replyRatingComment();
        console.log("✅ Seed completed!");
    } catch (err) {
        console.log("EORRRRRRR: ❌❌❌", err);
    }
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(() => {
        prisma.$disconnect();
        console.log("✅ Prisma client disconnected");
    });
