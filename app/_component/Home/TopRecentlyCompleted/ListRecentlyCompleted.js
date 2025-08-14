import { getStoriesRecentlyCompleted } from "@/app/_lib/data-service";
import SwiperCompleted from "./SwiperCompleted";

async function ListRecentlyCompleted() {
    const topStoriesComplete = await getStoriesRecentlyCompleted();
    // console.log(topStoriesComplete);
    return (
        <>
            {!topStoriesComplete || topStoriesComplete?.length === 0 ? (
                <div className="flex w-full m-auto">
                    <p className="text-center text-sm italic">
                        Chưa có dữ liệu
                    </p>
                </div>
            ) : (
                <SwiperCompleted topStoriesComplete={topStoriesComplete} />
            )}
        </>
    );
}

export default ListRecentlyCompleted;
