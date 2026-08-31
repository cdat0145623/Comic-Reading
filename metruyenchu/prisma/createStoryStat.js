import { startOfWeek } from "date-fns";
import { PrismaClient } from "../app/generated/prisma/index.js";
const prisma = new PrismaClient({ log: ["query", "info"] });

async function createManyStat() {
    const storys = await prisma.story.findMany();

    for (const story of storys) {
        const storyId = story.id;
        const storyStat = await prisma.storyStats.findUnique({
            where: {
                storyId,
            },
        });

        if (!storyStat) {
            await prisma.storyStats.create({
                data: {
                    storyId,
                },
            });
        }

        // const weeklyChapter = await prisma.chapter.count({
        //     where: {
        //         storyId,
        //         postedAt: {
        //             gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        //         },
        //     },
        // });

        // const totalReads = await prisma.chapterRead.count({
        //     where: {
        //         chapter: {
        //             storyId,
        //         },
        //     },
        // });

        // const totalBookmarks = await prisma.storyBookmark.count({
        //     where: {
        //         storyId,
        //     },
        // });

        // const totalVotes = await prisma.storyRecommendation.count({
        //     where: {
        //         storyId,
        //     },
        // });

        // const totalComments = await prisma.discuss.count({
        //     where: {
        //         storyId,
        //     },
        // });

        // const totalFans = await prisma.storyFan.count({
        //     where: {
        //         storyId,
        //     },
        // });

        let average = await prisma.rating.aggregate({
            where: {
                storyId,
            },
            _avg: {
                stars: true,
            },
        });

        average = average._avg.stars;

        const avgRounded = Math.round(average * 100) / 100;

        await prisma.$transaction(async (tx) => {
            await tx.storyStats.update({
                where: {
                    storyId,
                },
                data: {
                    averageRating: avgRounded,
                },
            });
        });
        console.log(`✅ Seed completed for ${storyId} 🏹`);
    }
}

async function upsertStat() {
    const stories = await prisma.story.findMany();

    for (const story of stories) {
        const storyId = story.id;
        const totalReads = await prisma.chapterRead.count({
            where: {
                chapter: {
                    storyId,
                },
            },
        });

        const now = new Date();
        const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 });

        const weeklyChapter = await prisma.chapter.count({
            where: {
                storyId,
                postedAt: {
                    gte: startOfWeekDate,
                },
            },
        });

        const totalVotes = await prisma.storyRecommendation.count({
            where: {
                storyId,
            },
        });

        const totalBookmarks = await prisma.storyBookmark.count({
            where: {
                storyId,
            },
        });

        const totalComments = await prisma.discuss.count({
            where: { storyId },
        });

        const totalFans = await prisma.storyFan.count({
            where: {
                storyId,
            },
        });

        const average = await prisma.rating.aggregate({
            where: { storyId },
            _avg: {
                stars: true,
            },
        });

        const roundAverage = Math.round(average._avg.stars * 100) / 100;

        await prisma.$transaction(async (tx) => {
            await tx.storyStats.upsert({
                where: {
                    storyId,
                },
                update: {
                    weeklyChapter,
                    totalVotes,
                    totalBookmarks,
                    totalComments,
                    totalFans,
                    totalReads,
                    averageRating: roundAverage,
                    updatedAt: new Date(),
                },
                create: {
                    story: {
                        connect: {
                            id: storyId,
                        },
                    },
                    weeklyChapter,
                    totalVotes,
                    totalBookmarks,
                    totalComments,
                    totalFans,
                    totalReads,
                    averageRating: roundAverage,
                },
            });
        });
    }
}

export async function main() {
    try {
        await upsertStat();
    } catch (err) {
        console.log("EORRRRRRR: ❌❌❌", err);
    }
    // await upsertStat();
    console.log("✅ Seed completed! 🏹🏹🏹🏹🏹");
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
