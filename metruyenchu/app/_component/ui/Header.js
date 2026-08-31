import Image from "next/image";
import { EyeIcon } from "@heroicons/react/24/outline";
import { StarIcon } from "@heroicons/react/24/solid";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { timeAgo } from "@/app/_lib/helper";

function Header({
    user,
    story,
    stars,
    ratingId,
    commentId,
    isGlobalRatingPage,
    createdAt,
    activeTab,
}) {
    return (
        <header className="flex items-center justify-between mb-2">
            <div
                className={`flex items-center ${
                    isGlobalRatingPage
                        ? "space-x-3 justify-between"
                        : "space-x-4"
                }`}
            >
                <div
                    className={`flex items-center ${
                        isGlobalRatingPage ? "space-x-3" : "space-x-2"
                    }`}
                >
                    <Image
                        src="/avatar_default.jpg"
                        width={isGlobalRatingPage ? 40 : 24}
                        height={isGlobalRatingPage ? 40 : 24}
                        alt=""
                        className="rounded-full"
                    />
                    {!isGlobalRatingPage && (
                        <span className="font-bold text-sm">{user?.name}</span>
                    )}
                </div>
                <div
                    className={`${
                        !isGlobalRatingPage && "flex items-center space-x-4"
                    }`}
                >
                    {isGlobalRatingPage ? (
                        <>
                            <span className="font-bold">
                                {user?.name}&nbsp;
                            </span>
                            <span>đã đánh giá&nbsp;</span>
                            <Link
                                href={`truyen/${story?.slug}`}
                                className="font-semibold text-title-color"
                            >
                                {story?.title}
                            </Link>
                        </>
                    ) : commentId || activeTab === "comments" ? (
                        <div>{timeAgo(createdAt)}</div>
                    ) : (
                        <>
                            <div className="flex items-center space-x-1">
                                <StarIcon className="w-5 h-5 text-yellow-400" />
                                <span className="text-gray-500 text-xs">
                                    {stars}
                                </span>
                            </div>
                            <div className="flex items-center space-x-1 text-gray-500 text-xs">
                                <EyeIcon className="w-5 h-5" />
                                <span>{user?._count?.chaptersRead || 5}</span>
                                <span>chương</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div
                className={`${
                    !isGlobalRatingPage
                        ? "relative"
                        : "flex items-center text-xs text-gray-500"
                }`}
            >
                {!isGlobalRatingPage ? (
                    <>
                        <button className="p-2 text-gray-400 text-sm font-medium hover:bg-gray-200 rounded">
                            <EllipsisHorizontalIcon className="w-5 h-5 " />
                        </button>
                        <div className="absolute right-0 top-8 w-24 hidden">
                            <ul className="text-sm text-gray-700 divide-y divide-slate-100">
                                <li className="bg-gray-200 rounded hover:bg-gray-100">
                                    <button className="px-4 py-2">Xoá</button>
                                </li>
                                <li className="bg-gray-200 rounded hover:bg-gray-100">
                                    <button className="px-4 py-2">
                                        Báo cáo
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </>
                ) : (
                    <>
                        <StarIcon className="w-5 h-5 text-yellow-400" />

                        <span className="ml-1">{stars}</span>
                    </>
                )}
            </div>
        </header>
    );
}

export default Header;
