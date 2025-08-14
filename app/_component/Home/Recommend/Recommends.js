import { getChapterRecentlyUpdated } from "@/app/_lib/data-service";
import RecommendList from "./RecommendList";

async function Recommends() {
    const { topChaptersRencetlyUpdated: stories } =
        await getChapterRecentlyUpdated(1, 24, 1);

    return <> {stories && <RecommendList stories={stories} />}</>;
}

export default Recommends;
