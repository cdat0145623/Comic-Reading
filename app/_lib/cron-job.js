import { prisma } from "../../lib/prisma.js";
import { Prisma } from "@prisma/client";

// import { normalizeTimeBlock } from "./data-service.js";

const durations = [5, 10, 15, 30, 60];
function dateOnlyForTZ(base, tz = "Asia/Ho_Chi_Minh") {
    const fmt = new Intl.DateTimeFormat("en-CA", {
        timeZone: tz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    // format ra dạng YYYY-MM-DD
    const [y, m, d] = fmt.format(base).split("-").map(Number);

    // Tạo Date object ở 00:00:00 UTC (Z) cho ngày đó
    return new Date(Date.UTC(y, m - 1, d));
}

async function updateTopStoryRead(durationInMinutes) {
    const now = new Date();
    console.log("Now:", now.toISOString());
    const blockTime = normalizeTimeBlock(now, durationInMinutes);
    console.log("Blocktime:", blockTime.toISOString());

    const existing = await prisma.topStoryRead.findFirst({
        where: {
            duration: durationInMinutes,
            createdAt: blockTime,
        },
    });

    if (existing) {
        console.log(
            `⚠️ Đã có dữ liệu cho mốc ${durationInMinutes} phút tại ${blockTime.toISOString()}`
        );
        return;
    }

    const topStories = await prisma.$queryRaw(
        Prisma.sql`
        SELECT s.id AS "storyId",
            COUNT(DISTINCT cr."userId") AS "readerCount"
        FROM "ChapterRead" cr
        JOIN "Chapter" c on c.id = cr."chapterId"
        JOIN "Story" s on s.id = c."storyId"
        WHERE "readAt" >= (NOW() AT TIME ZONE 'UTC') - ${Prisma.raw(
            `INTERVAL '${durationInMinutes} minutes'`
        )}
        GROUP BY s.id
        ORDER BY "readerCount" DESC
        LIMIT 100
    `
    );

    await prisma.topStoryRead.deleteMany();

    // console.log(
    //     `Dev Cron job::: tại mốc ${durationInMinutes} ở blocktime ${blockTime.toISOString()} `,
    //     topStories
    // );

    const data = await prisma.topStoryRead.createMany({
        data: topStories.map((story) => ({
            storyId: story.storyId,
            readerCount: Number(story.readerCount),
            duration: durationInMinutes,
            createdAt: blockTime,
        })),
    });
}

async function updateTopStoryReadOptimized() {
    console.log("⏰ Running optimized top story update job...");

    const rawRead = await prisma.chapterRead.findMany({
        where: {
            readAt: {
                gte: new Date(Date.now() - 60 * 60 * 1000),
            },
        },
        select: {
            userId: true,
            chapterId: true,
            readAt: true,
            chapter: {
                select: {
                    storyId: true,
                },
            },
        },
    });

    for (const d of durations) {
        const now = new Date();
        const threshold = new Date(now.getTime() - d * 60 * 1000);

        const readsInDuration = rawRead.filter((r) => r.readAt >= threshold);

        const storyMap = new Map();

        readsInDuration.forEach((r) => {
            const storyId = r.chapter.storyId;
            if (!storyMap.has(storyId)) {
                storyMap.set(storyId, new Set());
            }
            storyMap.get(storyId).add(r.userId);
        });

        const topStories = Array.from(storyMap.entries()).map(
            ([storyId, userSet]) => ({
                storyId,
                readerCount: userSet.size,
            })
        );

        for (const item of topStories) {
            await prisma.$transaction(async (tx) => {
                await tx.topStoryRead.upsert({
                    where: {
                        storyId_duration: {
                            storyId: item.storyId,
                            duration: d,
                        },
                    },
                    create: {
                        storyId: item.storyId,
                        readerCount: item.readerCount,
                        duration: d,
                    },
                    update: {
                        readerCount: item.readerCount,
                        updatedAt: new Date(),
                    },
                });
            });
        }
        console.log("✅ Optimized top story update finished.");
    }
}

async function updateStoryStats() {
    const now = new Date();
    const windowEnd = new Date(
        Math.floor(now.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000)
    );
    const windowStart = new Date(windowEnd.getTime() - 5 * 60 * 1000);

    try {
        const result = await prisma.chapterRead.groupBy({
            by: ["chapterId", "userId"],
            where: {
                readAt: {
                    gte: windowStart,
                    lt: windowEnd,
                },
            },
        });

        const storyMap = new Map();

        for (const r of result) {
            const chapter = await prisma.chapter.findUnique({
                where: {
                    id: r.chapterId,
                },
                select: {
                    storyId: true,
                },
            });
            if (!chapter) continue;

            if (!storyMap.has(chapter.storyId)) {
                storyMap.set(chapter.storyId, new Set());
            }
            storyMap.get(chapter.storyId).add(r.userId);
        }

        for (const [storyId, userSet] of storyMap.entries()) {
            await prisma.$transaction(async (tx) => {
                await tx.topStoryRead.create({
                    data: {
                        storyId,
                        windowStart,
                        windowEnd,
                        readerCount: userSet.size,
                    },
                });
            });

            // const today = windowStart.toISOString().slice(0, 10);
            const today = new Date(
                Date.UTC(
                    windowStart.getUTCFullYear(),
                    windowStart.getUTCMonth(),
                    windowStart.getUTCDate()
                )
            );

            await prisma.$transaction(async (tx) => {
                await tx.storyDailyReadStats.upsert({
                    where: {
                        storyId_date: {
                            storyId,
                            date: today,
                        },
                    },
                    create: {
                        storyId,
                        date: today,
                        readerCount: userSet.size,
                    },
                    update: {
                        readerCount: {
                            increment: userSet.size,
                        },
                    },
                });
            });
        }
    } catch (error) {
        console.log("Error at cronjob:", error);
        throw new Error("Error at cronjob:", error);
    }
}

export { updateTopStoryRead, updateStoryStats };
