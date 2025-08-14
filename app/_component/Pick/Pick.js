import { getChapterRecentlyUpdated } from "@/app/_lib/data-service";
import ParamsNotFound from "../ParamsNotFound";
import ChapterCard from "../NewChapter/ChapterCard";
import Pagination from "../Pagination";

export const revalidate = 1200;

async function Pick({ searchParams }) {
    const page = searchParams?.page ? Number(searchParams.page) : 1;
    const limit = 20;
    const manager_pick = 1;

    if (page < 1 || isNaN(page)) {
        return <ParamsNotFound />;
    }

    const { topChaptersRencetlyUpdated: featureStories, count: totalCount } =
        await getChapterRecentlyUpdated(page, limit, manager_pick);

    // console.log("featuredStories:::", featureStories);
    // console.log("totalCount::::", totalCount);

    const totalPages = Math.ceil(totalCount / limit);
    console.log("TotalPages:::", totalPages);
    return (
        <>
            <div className="grid lg:grid-cols-2 grid-cols-1 lg:px-0 px-4 gap-6">
                {!featureStories || featureStories.length === 0 ? (
                    <div className="grid grid-cols-1 col-span-full">
                        <p className="text-center italic text-sm">
                            Chưa có dữ liệu
                        </p>
                    </div>
                ) : (
                    featureStories.map((story, index) => (
                        <ChapterCard chapter={story} key={index} />
                    ))
                )}
            </div>
            {featureStories.length > 0 && (
                <Pagination currentPage={page} totalPages={totalPages} />
            )}
        </>
    );
}

export default Pick;
