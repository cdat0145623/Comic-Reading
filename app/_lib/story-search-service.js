import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { searchStoryCorpus } from "./search";

const getStorySearchCorpus = unstable_cache(
    async () =>
        prisma.story.findMany({
            where: {
                slug: {
                    not: null,
                },
            },
            select: {
                id: true,
                title: true,
                slug: true,
                stringUrl: true,
                author: {
                    select: {
                        name: true,
                    },
                },
            },
        }),
    ["story-search-corpus-v1"],
    {
        revalidate: 300,
        tags: ["story-search-corpus"],
    },
);

async function searchStories(query, limit = 5) {
    const stories = await getStorySearchCorpus();

    return searchStoryCorpus(stories, query, limit).map((story) => ({
        id: story.id,
        title: story.title,
        slug: story.slug,
        coverUrl: story.stringUrl,
        author: story.author,
    }));
}

export { searchStories };
