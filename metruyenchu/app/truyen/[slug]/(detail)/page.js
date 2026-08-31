import SectionLink from "@/app/_component/SectionLink";
import Author from "@/app/_component/Story/Author";
import Introduce from "@/app/_component/Story/Introduce";
import ListChapters from "@/app/_component/Story/ListChapters";
import Loading from "@/app/_component/Loading";
import Story from "@/app/_component/Story/Story";
import StoryActivity from "@/app/_component/Story/StoryActivity";
import Uploader from "@/app/_component/Story/Uploader";
import SubBanner from "@/app/_component/SubBanner";
import { Suspense } from "react";
import {
    getLatestChaptersByStoryId,
    getStoryDetailBySlug,
} from "@/app/_lib/data-service";
import { notFound } from "next/navigation";
import ChapterCatalogButton from "@/app/_component/Story/ChapterCatalog/ChapterCatalogButton";
import { ChevronDoubleRightIcon } from "@heroicons/react/20/solid";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { story } = await getStoryDetailBySlug(slug);
    return { title: `${story?.title ?? "Truyện"} Convert` };
}

async function Page({ params, searchParams }) {
    const { slug } = await params;
    const { story, error } = await getStoryDetailBySlug(slug);
    console.log("story detail::", story);
    if (error) throw new Error(error);
    if (!story) notFound();

    const storyId = story.id;
    const activeTab = (await searchParams)?.tab ?? "ratings";
    const display = (await searchParams)?.display === "true";
    const filter = (await searchParams)?.filter ?? "mostLiked";

    return (
        <div className="mt-6 space-y-5">
            <Story story={story} slug={slug} />
            <div className="pb-3">
                <SectionLink
                    title="CHƯƠNG MỚI"
                    className="px-3 py-2"
                    background
                    rightSlot={
                        <ChapterCatalogButton
                            storyId={storyId}
                            slug={slug}
                            storyTitle={story.title}
                            totalChapters={story.totalChapters}
                            className="flex items-center pr-3 space-x-1 text-xs text-gray-800 hover:text-primary"
                        >
                            <span>xem tất cả</span>
                            <ChevronDoubleRightIcon className="w-3 h-3" />
                        </ChapterCatalogButton>
                    }
                />

                <Suspense
                    fallback={
                        <Loading
                            section="chapter"
                            length={3}
                            className="pt-6 md:px-2 px-4 grid md:grid-cols-3 grid-cols-1 gap-4"
                        />
                    }
                >
                    <LatestChaptersSection storyId={storyId} slug={slug} />
                </Suspense>
            </div>
            <SubBanner />
            <Introduce introduce={story.introduce} />
            <Author story={story} storyId={story.id} />
            {story?.uploader?.uploadedStories?.length >= 2 && (
                <Uploader uploader={story.uploader} storyId={storyId} />
            )}
            <StoryActivity
                activeTab={activeTab}
                display={display}
                filter={filter}
                slug={slug}
                storyId={story.id}
            />
        </div>
    );
}

async function LatestChaptersSection({ storyId, slug }) {
    const latestChapters = await getLatestChaptersByStoryId(storyId, 3);

    return <ListChapters chapters={latestChapters} slug={slug} />;
}

export default Page;
