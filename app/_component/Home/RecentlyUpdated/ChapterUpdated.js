import { getChapterRecentlyUpdated } from "@/app/_lib/data-service";
import ChapterCard from "./ChapterCard";

async function ChapterUpdated() {
    const { topChaptersRencetlyUpdated: topUpdated } =
        await getChapterRecentlyUpdated();
    return (
        <>
            {!topUpdated || topUpdated?.length === 0 ? (
                <p className="text-center text-sm italic">Chưa có dữ liệu</p>
            ) : (
                topUpdated.map((story, index) => (
                    <ChapterCard story={story} key={index} index={index} />
                ))
            )}
        </>
    );
}

export default ChapterUpdated;
