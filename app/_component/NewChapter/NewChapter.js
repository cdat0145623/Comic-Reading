import { getChapterRecentlyUpdated } from "@/app/_lib/data-service";
import ParamsNotFound from "../ParamsNotFound";
import ChapterCard from "./ChapterCard";
import Pagination from "../Pagination";

async function NewChapter({ searchParams }) {
    const page = searchParams.page ? Number(searchParams.page) : 1;
    const limit = 20;

    // console.log("page:::", page);
    if (page < 1 || isNaN(page)) {
        console.log("page:::", page);
        return <ParamsNotFound />;
    }

    const { topChaptersRencetlyUpdated: newChapter, count: totalCount } =
        await getChapterRecentlyUpdated(page, limit);

    console.log("newChapter:::", newChapter);
    console.log("TotalRecordCount:", totalCount);

    const totalPages = Math.ceil(totalCount / limit);
    // console.log("TotalPage::::::", totalPages);

    return (
        <>
            <div className="grid lg:grid-cols-2 grid-cols-1 lg:px-0 px-4 gap-6">
                {!newChapter || newChapter?.length === 0 ? (
                    <div className="grid grid-cols-1 col-span-full">
                        <p className="text-center italic text-sm">
                            Chưa có dữ liệu
                        </p>
                    </div>
                ) : (
                    newChapter.map((chapter) => (
                        <ChapterCard chapter={chapter} key={chapter.storyId} />
                    ))
                )}
            </div>
            {newChapter?.length > 0 ? (
                <Pagination currentPage={page} totalPages={totalPages} />
            ) : (
                ""
            )}
        </>
    );
}

export default NewChapter;
