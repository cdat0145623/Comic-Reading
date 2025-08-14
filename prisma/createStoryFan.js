import { PrismaClient } from "../app/generated/prisma/index.js";

const prisma = new PrismaClient({ log: ["query", "info"] });

function generateRamdomPoint(min = 1000, max = 100000) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomElement(arr, count) {
    const suffled = [...arr].sort(() => 0.5 - Math.random());
    return suffled.slice(0, count);
}

async function createRandom() {
    const storyIds = await prisma.story.findMany({
        where: {
            id: {
                lte: 5,
            },
        },
    });

    const userIds = await prisma.user.findMany({
        where: {
            id: {
                lte: 10,
            },
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
                    tx.storyFan.create({
                        data: {
                            points: generateRamdomPoint(),
                            userId: user.id,
                            storyId: story.id,
                        },
                    })
                )
            );
        });
        console.log(`✅ Seed completed for Story ${story.id} 🏹`);
    }
}

async function createSpecific() {
    // const storyIds = await prisma.story.findMany({
    //     where: {
    //         id: {
    //             lte: 5,
    //         },
    //     },
    // });

    const userIds = await prisma.user.findMany({
        where: {
            storysFan: {
                none: {
                    storyId: 101,
                },
            },
        },
        select: {
            id: true,
        },
    });
    for (const user of userIds) {
        await prisma.$transaction(async (tx) => {
            await tx.storyFan.create({
                data: {
                    points: generateRamdomPoint(),
                    userId: user.id,
                    storyId: 101,
                },
            });
        });
    }
}

export async function main() {
    try {
        await createSpecific();
        console.log(`✅ Seed completed 🏹`);
    } catch (err) {
        console.log("❌ Errors:", err);
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
