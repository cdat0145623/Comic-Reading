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

const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

function generateRandomRating() {
    const min = 3;
    const max = 5;
    const random = Math.random() * (max - min) + min;
    return Math.floor(random * 10) / 10;
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
                gt: 11,
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

        const randomRating =
            ratings[Math.floor(Math.random() * ratings.length)];

        console.log(
            `Story ${story.id} will chose rating record ${
                randomRating.id
            } and have ${
                randomRating.ratingUsersComments.length === 0
                    ? "0"
                    : randomRating.ratingUsersComments.length
            } comments`
        );

        if (randomRating.ratingUsersComments.length === 0) {
            const randomUser = generateRandomElement(userIds, userIds.length);
            console.log(
                `Story ${story.id} have lucky people have id:`,
                randomUser
            );
            for (const user of randomUser) {
                await prisma.$transaction(async (tx) => {
                    await tx.ratingComment.create({
                        data: {
                            content:
                                "Đây là bình luận đầu tiên" +
                                generateRandomContent(),
                            userId: user.id,
                            ratingId: randomRating.id,
                            parentId: null,
                        },
                    });
                });
                console.log(`✅ Seed completed for User ${user.id} 🏹`);
            }
            console.log(
                `✅ Seed completed for Story ${story.id} don't have first comment 🏹`
            );
            console.log("---------------------------------------------------");
        } else {
            const firstComment = randomRating.ratingUsersComments[0];
            console.log("This is first comment", firstComment);

            const randomUser = generateRandomElement(userIds, userIds.length);
            console.log(
                `Story ${story.id} have lucky people have id:`,
                randomUser
            );

            for (const user of randomUser) {
                await prisma.$transaction(async (tx) => {
                    await tx.ratingComment.create({
                        data: {
                            content:
                                "Đây là phản hồi cho bình luận gốc" +
                                generateRandomContent(),
                            userId: user.id,
                            ratingId: randomRating.id,
                            parentId: firstComment.id,
                        },
                    });
                });
                console.log(`✅ Seed completed for User ${user.id} 🏹`);
            }
            console.log(
                `✅ Seed completed for Story ${story.id} have first comment 🏹`
            );
            console.log("---------------------------------------------------");
        }
    }
    console.log("✅ Seed completed!");
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
