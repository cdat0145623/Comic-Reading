import {
    getTopVotedStories,
    getTotalRecordVotedStories,
} from "@/app/_lib/data-service";
import VoteCard from "./VoteCard";
import Pagination from "../Pagination";
import ParamsNotFound from "../ParamsNotFound";

async function VoteList({ searchParams }) {
    // console.log("VoteList Month:::", month, "year:", year);
    // const month = (await searchParams)?.month ?? new Date().getMonth();
    // const year = (await searchParams)?.year ?? new Date().getFullYear();
    const month = searchParams?.month
        ? Number(searchParams.month)
        : new Date().getMonth();
    // console.log("month:", month);
    const year = searchParams?.year
        ? Number(searchParams.year)
        : new Date().getFullYear();
    const page = searchParams.page ? Number(searchParams.page) : 1;
    const limit = 20;
    const maxPage = 5;
    // let topVotes = [];
    // let totalCount = 0;

    if (
        month < 1 ||
        month > 12 ||
        year < 2023 ||
        year > 2025 ||
        page < 1 ||
        page > maxPage ||
        isNaN(page)
    ) {
        return <ParamsNotFound />;
    }

    const [topVotes, totalCount] = await Promise.all([
        getTopVotedStories(page, limit, month, year),
        getTotalRecordVotedStories(month, year),
    ]);

    // if (page <= maxPage) {

    // } else {
    //     topVotes = [];
    // }

    // console.log("topVotes", topVotes);
    // console.log("Client totalCount::;:", totalCount);
    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="grid grid-cols-1 gap-6">
            {!topVotes || topVotes?.length === 0 ? (
                <p className="text-center italic text-sm">Chưa có dữ liệu</p>
            ) : (
                topVotes.map((story, index) => {
                    const rank = (page - 1) * limit + index + 1;
                    return (
                        <VoteCard
                            story={story}
                            key={story.storyId}
                            rank={rank}
                        />
                    );
                })
            )}
            {topVotes?.length > 0 ? (
                <>
                    {/* {console.log(page, totalPages)} */}
                    <Pagination currentPage={page} totalPages={totalPages} />
                </>
            ) : (
                <>
                    {/* {console.log(page, totalPages)} */}
                    {""}
                </>
            )}
        </div>
    );
}

export default VoteList;
