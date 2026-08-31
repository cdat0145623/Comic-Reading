import { PrismaClient } from "../app/generated/prisma/index.js";
import { LoremIpsum } from "lorem-ipsum";

const prisma = new PrismaClient({ log: ["query", "info"] });

const lorem = new LoremIpsum({
    wordsPerSentence: { min: 1, max: 12 },
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

export async function main() {
    const storyIds = await prisma.story.findMany({
        where: {
            id: {
                lte: 5,
            },
        },
        select: {
            id: true,
        },
    });
    const userIds = await prisma.user.findMany({
        where: {
            id: {
                lt: 6,
            },
        },
        select: {
            id: true,
        },
    });
    for (const story of storyIds) {
        const randomCount = Math.floor(Math.random() * userIds.length) + 1;
        const randomUsers = generateRandomElement(userIds, randomCount);
        console.log(
            `Story ${story.id} will have ${randomCount} random users:`,
            randomUsers
        );

        await prisma.$transaction(async (tx) => {
            await Promise.all(
                randomUsers.map((user) =>
                    tx.discuss.create({
                        data: {
                            content:
                                "Đây là bình luận đầu tiên " +
                                generateRandomContent(),
                            userId: user.id,
                            storyId: story.id,
                            parentId: null,
                        },
                    })
                )
            );
        });

        const rootDiscuss = await prisma.discuss.findFirst({
            where: {
                storyId: story.id,
                parentId: null,
            },
            orderBy: {
                createdAt: "asc",
            },
        });

        if (!rootDiscuss) continue;

        const rootUserId = rootDiscuss.userId;
        console.log(
            `Story ${story.id} has record ${rootDiscuss.id} is first comment and has User ${rootUserId} is person create this record`
        );

        const replyUsers = randomUsers.filter((user) => user.id !== rootUserId);
        console.log(
            `Story ${story.id} have ${randomCount} users: `,
            randomUsers,
            `And has ID ${rootUserId} is first person create first comment. Therefor, the people will reply first comment are:`,
            replyUsers
        );

        await prisma.$transaction(async (tx) => {
            await Promise.all(
                replyUsers.map((user) =>
                    tx.discuss.create({
                        data: {
                            content:
                                `Đây là phản hồi cho bình luân đầu tiên có id = ${rootUserId}` +
                                generateRandomContent(),
                            userId: user.id,
                            storyId: story.id,
                            parentId: rootDiscuss.id,
                        },
                    })
                )
            );
        });

        await prisma.$transaction(async (tx) => {
            await Promise.all(
                replyUsers.map((user) =>
                    tx.discussLike.create({
                        data: {
                            userId: user.id,
                            discussId: rootDiscuss.id,
                        },
                    })
                )
            );
        });
        console.log(`✅ Seed completed for ${story.id}`);
    }
    console.log("✅ Seed completed");
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
