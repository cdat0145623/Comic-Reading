import Image from "next/image";
import Link from "next/link";

import { TicketIcon } from "@heroicons/react/24/solid";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import { Square3Stack3DIcon } from "@heroicons/react/24/outline";

const rankIcons = {
    1: "/rank_1.png",
    2: "/rank_2.png",
    3: "/rank_3.png",
};
function Top1to3CardVote({ vote, index }) {
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
        <div className="grid">
            <div className="flex space-x-2 p-3">
                <div className="shrink-0">
                    <Image
                        width={24}
                        height={24}
                        src={rankIcons[index + 1]}
                        alt={`Top ${index + 1}`}
                    />
                </div>
                {index + 1 === 1 ? (
                    <>
                        <div className="w-full relative">
                            <Link href="#">
                                <span className="text-title-color text-sm hover:text-primary font-semibold">
                                    {title}
                                </span>
                            </Link>
                            <div className="flex text-primary items-center space-x-2 my-2">
                                <span className="text-sm font-semibold">
                                    {voteCount}
                                </span>
                                <TicketIcon className="w-5 h-5" />
                            </div>
                            <div className="text-gray-500 absolute bottom-0 left-0 space-y-1">
                                <div className="flex space-x-1 items-center">
                                    <UserCircleIcon className="w-4 h-4" />
                                    <span className="text-xs">{author}</span>
                                </div>
                                <div className="flex space-x-1 items-center">
                                    <Square3Stack3DIcon className="w-4 h-4" />
                                    <span className="text-xs">{tag}</span>
                                </div>
                            </div>
                        </div>
                        <div className="book-cover">
                            <Link href="#" className="">
                                <div className="book-cover-link w-[65px] h-[100px]">
                                    <Image
                                        fill
                                        sizes="65px"
                                        className="object-cover"
                                        src={stringUrl}
                                        alt={title}
                                    />
                                </div>
                            </Link>
                        </div>
                    </>
                ) : (
                    <>
                        <Link href="#" className="w-full">
                            <span className="text-title-color text-sm hover:text-primary">
                                {title}
                            </span>
                        </Link>
                        <div>
                            <span className="text-gray-500 text-sm">
                                {voteCount}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default Top1to3CardVote;
