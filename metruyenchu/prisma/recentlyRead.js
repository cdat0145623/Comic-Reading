import { PrismaClient } from "../app/generated/prisma/index.js";
import slugify from "slugify";
import { LoremIpsum } from "lorem-ipsum";

const prisma = new PrismaClient({ log: ["query", "info"] });

function getRandomElements(arr, count) {
    const suffled = [...arr].sort(() => 0.5 - Math.random());
    return suffled.slice(0, count);
}

export async function main() {
    let userIds = await prisma.user.findMany({
        select: {
            id: true,
        },
    });
    userIds = userIds.slice(1);
    console.log("List user only get from user 2 up to now:::::::", userIds);
    const storyIds = [23];

    for (const user of userIds) {
        console.log("---------------------------------------------------");
        console.log(`User ${user.id}`);

        for (const storyId of storyIds) {
            console.log(`Chapter of story have ${storyId} storyId::::`);
            const chapter = await prisma.chapter.findMany({
                where: { storyId: storyId },
                select: {
                    id: true,
                    number: true,
                    storyId: true,
                },
            });
            console.log(`Story ${storyId} have chapters::::`, chapter);

            const totalChapter = await prisma.chapter.count({
                where: { storyId: storyId },
            });
            console.log(`Story ${storyId} have ${totalChapter}`);

            const randomCount = Math.floor(Math.random() * totalChapter) + 1;
            console.log(`RandomCount of ${storyId} is ${randomCount}`);

            const randomChapters = getRandomElements(chapter, randomCount);
            console.log(
                `Story ${storyId} have randomChapters:::::`,
                randomChapters
            );
            const readPromises = randomChapters.map((chapter) =>
                prisma.chapterRead.create({
                    data: {
                        userId: user.id,
                        chapterId: chapter.id,
                    },
                })
            );
            await Promise.all(readPromises);
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
