import { PrismaClient } from "../app/generated/prisma/index.js";
import slugify from "slugify";
import { LoremIpsum } from "lorem-ipsum";
import pLimit from "p-limit";

const prisma = new PrismaClient({ log: ["query", "info"] });

function getRandomElements(arr, count) {
    const suffled = [...arr].sort(() => 0.5 - Math.random());
    return suffled.slice(0, count);
}

function randomDate(start, end) {
    return new Date(
        start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
}

export async function main() {
    const users = await prisma.user.findMany({
        where: {
            id: {
                gte: 10,
                lte: 20,
            },
        },
        select: {
            id: true,
        },
    });
    const storys = await prisma.story.findMany({
        where: {
            id: {
                lte: 40,
            },
        },
        select: {
            id: true,
        },
    });
    const start = new Date("2025-02-01");
    const end = new Date("2025-02-20");

    for (const user of users) {
        const randomCount = Math.floor(Math.random() * storys.length) + 1;
        const randomStory = getRandomElements(storys, randomCount);
        console.log(
            `User ${user.id} will chose ${randomCount} story:`,
            randomStory
        );

        const limit = pLimit(10);

        const recommend = randomStory.flatMap((story) =>
            limit(() =>
                prisma.storyRecommendation.create({
                    data: {
                        userId: user.id,
                        storyId: story.id,
                        createdAt: randomDate(start, end),
                    },
                })
            )
        );
        await Promise.all(recommend);
        console.log(
            `✅ Seed completed for User ${user.id} have ${recommend.length} 🏹`
        );
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
