import { PrismaClient } from "../app/generated/prisma/index.js";
import pLimit from "p-limit";
import { generateRandomElement } from "./helper-prisma.js";

const prisma = new PrismaClient({ log: ["query", "info"] });

async function createChapterRead() {
    let users = await prisma.user.findMany({
        where: {
            chaptersRead: {
                none: {},
            },
        },
        select: {
            id: true,
        },
    });

    // users = users.slice(0, 30);

    users = generateRandomElement(users, 5);
    console.log(`List ${users.length}:`, users);

    let storyIds = await prisma.story.findMany({
        where: {
            id: {
                lte: 5,
            },
        },
        select: {
            id: true,
        },
    });

    for (const user of users) {
        console.log(`User ${user.id}`);
        for (const storyId of storyIds) {
            console.log(`Chapter of story have ${storyId} storyId::::`);
            const chapter = await prisma.chapter.findMany({
                where: { storyId: storyId.id },
                select: {
                    id: true,
                    number: true,
                    storyId: true,
                },
            });
            console.log(`Story ${storyId.id} have chapters::::`, chapter);

            const totalChapter = await prisma.chapter.count({
                where: { storyId: storyId.id },
            });
            console.log(`Story ${storyId.id} have ${totalChapter}`);

            const randomCount = Math.floor(Math.random() * totalChapter) + 1;
            console.log(`RandomCount of ${storyId.id} is ${randomCount}`);

            const randomChapters = generateRandomElement(chapter, randomCount);
            console.log(
                `Story ${storyId.id} have randomChapters:::::`,
                randomChapters
            );
            // const limit = pLimit(10);

            const readPromises = randomChapters.map((chapter) =>
                prisma.chapterRead.upsert({
                    where: {
                        userId_chapterId: {
                            userId: user.id,
                            chapterId: chapter.id,
                        },
                    },
                    update: {
                        readAt: new Date(),
                    },
                    create: {
                        userId: user.id,
                        chapterId: chapter.id,
                    },
                })
            );

            // const readPromises = randomChapters.map((chapter) =>
            //     prisma.chapterRead.upsert({
            //         data: {
            //             userId: user.id,
            //             chapterId: chapter.id,
            //         },
            //     })
            // );

            await Promise.all(readPromises);

            // const readPromises = userIds.flatMap((user) =>
            //     randomChapters.map((chapter) =>
            //         limit(() =>
            //             prisma.chapterRead.upsert({
            //                 where: {
            //                     userId_chapterId: {
            //                         userId: user.id,
            //                         chapterId: chapter.id,
            //                     },
            //                 },
            //                 update: {
            //                     readAt: new Date(),
            //                 },
            //                 create: {
            //                     userId: user.id,
            //                     chapterId: chapter.id,
            //                 },
            //             })
            //         )
            //     )
            // );

            // const readPromises = randomChapters.map((chapter) =>
            //     prisma.chapterRead.create({
            //         data: {
            //             userId: userId,
            //             chapterId: chapter.id,
            //         },
            //     })
            // );
        }
    }
}

export async function main() {
    // await prisma.$executeRawUnsafe(
    //     `SELECT setval('public."ChapterRead_id_seq"', 1, false)`
    // );
    // await prisma.chapterRead.deleteMany();
    // await prisma.$executeRawUnsafe(
    //     `ALTER SEQUENCE "public"."ChapterRead_id_seq" RESTART WITH 1`
    // );
    try {
        await createChapterRead();
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
