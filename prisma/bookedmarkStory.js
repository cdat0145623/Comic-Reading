import { PrismaClient } from "../app/generated/prisma/index.js";

const prisma = new PrismaClient({ log: ["query", "info"] });

function getRandomElement(arr, count) {
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
    console.log("List Users have ids:::::::::", userIds);
    const lengthStory = await prisma.story.count();
    console.log("Total story in database is::::::", lengthStory);

    const storyIds = await prisma.story.findMany({
        select: {
            id: true,
        },
    });
    console.log("List ids of Story is:::::::", storyIds);
    for (const user of userIds) {
        console.log("---------------------------------------------------");
        console.log(`User ${user.id}`);

        const randomCount = Math.floor(Math.random() * lengthStory) + 1;
        console.log(`RandomCount of User ${user.id} is ${randomCount}`);

        const randomStorys = getRandomElement(storyIds, randomCount);
        console.log(
            `User ${user.id} have ${randomCount} randomCount =>`,
            randomStorys
        );

        const bookmarkPromises = randomStorys.map((story) =>
            prisma.storyBookmark.create({
                data: {
                    userId: user.id,
                    storyId: story.id,
                },
            })
        );
        await Promise.all(bookmarkPromises);
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
