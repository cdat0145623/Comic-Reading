import { PrismaClient } from "../app/generated/prisma/index.js";

import { LoremIpsum } from "lorem-ipsum";

const prisma = new PrismaClient({ log: ["query", "info"] });

const lorem = new LoremIpsum({
    wordsPerSentence: { min: 3, max: 8 },
    sentencesPerParagraph: { min: 1, max: 3 },
});

function generateRandomContent() {
    return lorem.generateSentences(1);
}

function generateRandomElement(arr, count) {
    const suffled = [...arr].sort(() => 0.5 - Math.random());
    return suffled.slice(0, count);
}

export async function main() {
    const storyIds = await prisma.story.findMany({
        select: {
            id: true,
        },
    });
    const userIds = await prisma.user.findMany({
        where: {
            id: {
                gt: 2,
                lte: 10,
            },
        },
        select: {
            id: true,
        },
    });
    for (const story of storyIds) {
        const ratings = await prisma.rating.findMany({
            where: {
                storyId: story.id,
            },
            include: {
                ratingUsersComments: true,
            },
        });
        console.log("---------------------------------------------------");
        console.log(
            `Story ${story.id} have ${ratings.length} rating record `,
            ratings
        );

        if (ratings.length === 0) continue;

        const randomCountRating =
            Math.floor(Math.random() * ratings.length) + 1;

        const randomRatings = generateRandomElement(ratings, randomCountRating);

        console.log(
            `Story ${story.id} will have ${randomCountRating} random record:`,
            randomRatings
        );
        for (const rating of randomRatings) {
            if (rating.ratingUsersComments.length === 0) {
                const randomCount =
                    Math.floor(Math.random() * userIds.length) + 1;
                const randomUsers = generateRandomElement(userIds, randomCount);
                console.log(
                    `Story ${story.id} dont have ratingComment so This have to create new ratingComment. And this have ${randomCount} random Users:`,
                    randomUsers
                );
                await prisma.$transaction(async (tx) => {
                    await Promise.all(
                        randomUsers.map((user) =>
                            tx.ratingComment.create({
                                data: {
                                    content:
                                        "Đây là bình luận đầu tiên" +
                                        generateRandomContent(),
                                    userId: user.id,
                                    ratingId: rating.id,
                                    parentId: null,
                                },
                            })
                        )
                    );
                    console.log(
                        `✅ Seed completed for ${randomUsers.length} different User 🏹`
                    );
                });
            } else {
                const randomCount =
                    Math.floor(Math.random() * userIds.length) + 1;
                const randomUsers = generateRandomElement(userIds, randomCount);
                console.log(
                    `Story ${story.id} dont have ${rating.ratingUsersComments.length} so This create new ratingCommentLike. And this have ${randomCount} random Users:`,
                    randomUsers
                );
                for (const user of randomUsers) {
                    await prisma.$transaction(async (tx) => {
                        await Promise.all(
                            rating.ratingUsersComments.map((comment) =>
                                tx.ratingCommentLike.create({
                                    data: {
                                        userId: user.id,
                                        ratingCommentId: comment.id,
                                    },
                                })
                            )
                        );
                    });
                    console.log(
                        `✅ Seed completed for User ${user.id} and have ${rating.ratingUsersComments} like on different record RatingComment 🏹`
                    );
                }
            }
        }
        console.log("✅ Seed completed!");
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
