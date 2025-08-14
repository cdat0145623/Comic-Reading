import { getTopVotedStories } from "@/app/_lib/data-service";
import Top1to3CardVote from "./Top1to3CardVote";
import FromTop4CardVote from "./FromTop4CardVote";

async function ListTopVote() {
    const topVotes = await getTopVotedStories();
    // console.log("TopVote:::::", topVotes);
    return (
        <div className="divide-y divide-dotted box-content divide-slate-200">
            {topVotes?.length === 0 ? (
                <p className="text-center text-sm italic">Chưa có dữ liệu</p>
            ) : (
                topVotes.map((vote, index) =>
                    index + 1 <= 3 ? (
                        <Top1to3CardVote
                            key={vote.storyId}
                            vote={vote}
                            index={index}
                        />
                    ) : (
                        <FromTop4CardVote
                            key={vote.storyId}
                            vote={vote}
                            index={index}
                        />
                    )
                )
            )}
        </div>
    );
}

export default ListTopVote;
