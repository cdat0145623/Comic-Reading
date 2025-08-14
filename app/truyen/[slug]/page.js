import SectionLink from "@/app/_component/SectionLink";
import Author from "@/app/_component/Story/Author";
import Introduce from "@/app/_component/Story/Introduce";
import ListChapters from "@/app/_component/Story/ListChapters";
import Story from "@/app/_component/Story/Story";
import StoryActivity from "@/app/_component/Story/StoryActivity";
import Uploader from "@/app/_component/Story/Uploader";
import SubBanner from "@/app/_component/SubBanner";
import { getStoryBySlug } from "@/app/_lib/data-service";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { title } = await getStoryBySlug(slug);
    return { title: `${title} Convert` };
}

async function Page({ params, searchParams }) {
    const { slug } = await params;
    const story = await getStoryBySlug(slug);
    const storyId = story.id;

    const queryClient = new QueryClient();
    await queryClient.setQueryData(["chapters", storyId]);
    console.log("hus husk khe");

    const activeTab = (await searchParams)?.tab ?? "ratings";
    const display = (await searchParams)?.display === "true";
    const filter = (await searchParams)?.filter ?? "mostLiked";

    return (
        <>
            <Story story={story} slug={slug} />
            <div className="pb-3">
                <SectionLink
                    title="CHƯƠNG MỚI"
                    className="px-3 py-2"
                    text="xem tất cả"
                    icon
                    background
                />
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ListChapters storyId={story.id} slug={slug} />
                </HydrationBoundary>
            </div>
            <SubBanner />
            <Introduce introduce={story.introduce} />
            <Author story={story} storyId={story.id} />
            <Uploader uploader={story.uploader} storyId={story.id} />
            <StoryActivity
                activeTab={activeTab}
                display={display}
                filter={filter}
                slug={slug}
                storyId={story.id}
            />
            {/* <StoryActivity
                slug={slug}
                storyId={story.id}
                searchParams={searchParams}
            /> */}
        </>
    );
}

export default Page;

// const { searchParams } = await searchParams;
// await queryClient.setQueryData(["story", slug]);
// console.log("Page searparam::", await searchParams);

// console.log("story", story); story={story}
// await queryClient.prefetchQuery({
//     queryKey: ["story", slug],
//     queryFn: () => getStoryBySlug(slug),
// });
