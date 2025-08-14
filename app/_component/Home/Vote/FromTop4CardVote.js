import Link from "next/link";

function FromTop4CardVote({ vote, index }) {
    const {
        storyId,
        title,
        slug,
        totalChapters,
        stringUrl,
        author,
        tag,
        introduce,
        voteCount,
    } = vote;

    return (
        <div className="flex p-3 space-x-2 items-center">
            <div className="text-sm text-center w-6">
                <span>{index + 1}</span>
            </div>
            <Link href="#" className="w-full">
                <span className="text-title-color text-sm hover:text-primary">
                    {title}
                </span>
            </Link>
            <div>
                <span className="text-gray-500 text-sm">{voteCount}</span>
            </div>
        </div>
    );
}

export default FromTop4CardVote;
