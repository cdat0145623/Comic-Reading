import prisma from "../../lib/prisma.js";
import { Prisma } from "@prisma/client";

import { normalizeTimeBlock } from "./data-service.js";

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

export { updateTopStoryRead };
