import { PrismaClient } from "../app/generated/prisma/index.js";
import { getRandomChapters } from "./helper-prisma.js";

const prisma = new PrismaClient({ log: ["query", "info"] });

async function generateRandomChapter() {
    const stories = await prisma.story.findMany({
        where: {
            id: {
                gt: 100,
                lte: 120,
            },
        },
        select: {
            id: true,
        },
    });
    for (const story of stories) {
        const latestChapter = await prisma.chapter.findFirst({
            where: {
                storyId: story.id,
            },
            orderBy: {
                number: "desc",
            },
            select: {
                number: true,
            },
        });
        const currentChapter = latestChapter?.number || 0;
        const randomCount = Math.floor(Math.random() * 5) + 5;
        const newChapters = getRandomChapters(currentChapter, randomCount);

        await prisma.$transaction(async (tx) => {
            await tx.chapter.createMany({
                data: newChapters.map((chapter) => ({
                    ...chapter,
                    storyId: story.id,
                })),
                skipDuplicates: true,
            });
        });

        console.log(
            `Story ${story.id} → Thêm ${newChapters.length} chương từ ${
                currentChapter + 1
            } 🏹🏹🏹`
        );
    }
}

export async function main() {
    await generateRandomChapter();
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
