import { UserIcon } from "@heroicons/react/20/solid";
import { Square3Stack3DIcon } from "@heroicons/react/20/solid";

import Image from "next/image";
import Link from "next/link";

const rankIcons = {
    1: "/rank_1.png",
    2: "/rank_2.png",
    3: "/rank_3.png",
};

function VoteCard({ story, rank }) {
    if (!story) {
        console.log("Story::", story);
        return <p className="text-center italic text-sm">Chưa có dữ liệu.</p>;
    }

    const {
        storyId,
        title,
        slug,
        stringUrl,
        totalChapters,
        author,
        tag,
        introduce,
        voteCount,
    } = story;

    return (
        <>
            <div className="flex space-x-3 pb-6 border-b border-slate-200">
                <div className="flex-shrink-0">
                    <Link href="#">
                        <Image
                            src={stringUrl}
                            alt="no-le-bong-toi"
                            width={96}
                            height={128}
                            className="w-24 h-32 shadow-xl rounded"
                        />
                    </Link>
                </div>

                <div className="flex-grow space-y-2">
                    <div className="flex items-center space-x-2">
                        <div className="">
                            {rank <= 3 ? (
                                <Image
                                    src={rankIcons[rank]}
                                    alt=""
                                    width={24}
                                    height={24}
                                    className="w-6 h-6"
                                />
                            ) : (
                                <span className="px-1 min-w-5 h-5 text-[10px] bg-red-700 rounded-full text-white font-semibold inline-flex items-center justify-center">
                                    {rank}
                                </span>
                            )}
                        </div>
                        <Link href="#" className="font-semibold text-sm">
                            {title}
                        </Link>
                    </div>
                    <div className="text-sm text-gray-500 text-overflow-multiple-lines">
                        {introduce}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex space-x-1 items-center">
                            <UserIcon className="w-4 h-4 text-gray-500" />

                            <span className="text-xs">{author}</span>
                        </div>
                        <span className="text-xs">{`${totalChapters} chương`}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex space-x-1 text-gray-500">
                            <Square3Stack3DIcon className="w-4 h-4" />

                            <span className="text-xs">{tag}</span>
                        </div>
                        <button className="px-2 py-1 bg-primary text-white text-xs rounded-md">
                            Đọc thử
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}

export default VoteCard;
