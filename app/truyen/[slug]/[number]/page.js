import ChapterReader from "@/app/_component/Story/Chapter/ChapterReader";
import { getChapterDetailQueryKey } from "@/app/_lib/chapter-query";
import { getChapterByStorySlugAndNumber } from "@/app/_lib/data-service";
import { notFound } from "next/navigation";

import { checkExistNumber } from "@/app/_lib/helper-server";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";

async function Page({ params }) {
    console.log("page chapter ");
    const { slug, number } = await params;
    // const id = chapter.replace("chuong-", "");
    // || story.chapters.length === 0
    if (!checkExistNumber(number)) notFound();
    const queryClient = new QueryClient();
    const queryKey = getChapterDetailQueryKey({ slug, number });

    try {
        await queryClient.prefetchQuery({
            queryKey,
            queryFn: async () => {
                const { story, error } = await getChapterByStorySlugAndNumber({
                    slug,
                    number,
                });

                if (error || !story?.chapters?.length) {
                    throw new Error(error || "Chapter not found");
                }

                return story;
            },
        });
    } catch (error) {
        console.log("Chapter prefetch failed", error);
        notFound();
    }

    const story = queryClient.getQueryData(queryKey);

    if (!story?.chapters?.length || story.chapters.length === 0) notFound();

    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <ChapterReader slug={slug} number={number} />
        </HydrationBoundary>
    );
}

export default Page;
