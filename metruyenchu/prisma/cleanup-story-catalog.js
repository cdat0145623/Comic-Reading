import { prisma } from "../lib/prisma.js";

const FIXTURE_PREFIX = "catalog-fixture-";

async function cleanupStoryCatalog() {
    const stories = await prisma.story.findMany({
        where: { slug: { startsWith: FIXTURE_PREFIX } },
        select: { id: true },
    });
    const storyIds = stories.map(({ id }) => id);

    if (storyIds.length) {
        await prisma.$transaction([
            prisma.storyStats.deleteMany({ where: { storyId: { in: storyIds } } }),
            prisma.story.deleteMany({ where: { id: { in: storyIds } } }),
        ]);
    }

    await prisma.author.deleteMany({
        where: { slug: { startsWith: FIXTURE_PREFIX } },
    });
    console.log(`Removed ${storyIds.length} catalog fixtures.`);
}

cleanupStoryCatalog()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
