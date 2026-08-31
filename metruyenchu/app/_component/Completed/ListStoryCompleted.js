import {
    getStoriesRecentlyCompleted,
    getTotalRecordCompletedStory,
} from "@/app/_lib/data-service";
import ParamsNotFound from "../ParamsNotFound";
import StoryCompletedCard from "./StoryCompletedCard";
import Pagination from "../Pagination";

async function ListStoryCompleted({ searchParams }) {
    const page = searchParams?.page ? Number(searchParams.page) : 1;
    const limit = 20;
    if (page < 1 || isNaN(page)) {
        return <ParamsNotFound />;
    }

    const [completed, totalCount] = await Promise.all([
        getStoriesRecentlyCompleted(page, limit),
        getTotalRecordCompletedStory(),
    ]);
    console.log(totalCount);

    const totalPages = Math.ceil(totalCount / limit);

    return (
        <>
            <div className="grid lg:grid-cols-2 grid-cols-1 lg:px-0 px-4 gap-6">
                {!completed || completed?.length === 0 ? (
                    <div className="grid grid-cols-1 col-span-full">
                        <p className="text-center italic text-sm">
                            Chưa có dữ liệu
                        </p>
                    </div>
                ) : (
                    completed.map((story) => (
                        <StoryCompletedCard key={story.id} story={story} />
                    ))
                )}
            </div>
            {completed?.length > 0 && (
                <Pagination currentPage={page} totalPages={totalPages} />
            )}
        </>
    );
}

export default ListStoryCompleted;
