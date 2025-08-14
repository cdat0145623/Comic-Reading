"use client";
import { timeAgo } from "@/app/_lib/helper";
import { HandThumbUpIcon } from "@heroicons/react/24/outline";
import { HandThumbUpIcon as LikedHandThunUpIcon } from "@heroicons/react/24/solid";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useLiked } from "@/app/hooks/useLiked";

function Footer({
    ratingId,
    commentId,
    user,
    story,
    createdAt,
    isGlobalRatingPage,
    setIsReply,
    onMention,
    likeCount,
    liked: isLiked,
    activeTab,
}) {
    const [totalLike, setTotalLike] = useState(likeCount);
    const [liked, setLiked] = useState(isLiked);
    const { mutateLike } = useLiked({ active: activeTab });
    const chapterName =
        user?.chaptersRead?.[0]?.chapter?.name ??
        story?.chapters?.[0]?.name ??
        "";
    const handleToggleLike = async (ratingId, commentId) => {
        const nextLiked = !liked;
        try {
            setLiked(nextLiked);
            setTotalLike((prev) => prev + (nextLiked ? 1 : -1));

            mutateLike({ active: activeTab, ratingId, commentId });
        } catch (e) {
            setLiked(!nextLiked);
            setTotalLike((prev) => prev - (nextLiked ? 1 : -1));
            console.log("ERROR SERVER INTERNATIONAL::", e);
        }
    };
    const handleReply = () => {
        setIsReply((prev) => !prev);
        onMention(`@${user?.name}`);
    };
    return (
        <footer className="mt-4 flex items-center justify-between text-xs text-gray-500">
            <div
                className={`flex ${
                    !isGlobalRatingPage && "space-x-6 items-center"
                }`}
            >
                <div>
                    <button
                        className="flex items-center space-x-2"
                        onClick={() => handleToggleLike(ratingId, commentId)}
                    >
                        {liked ? (
                            <LikedHandThunUpIcon className="w-4 h-4 text-primary" />
                        ) : (
                            <HandThumbUpIcon className="w-4 h-4" />
                        )}
                        <div className="flex space-x-1 hover:underline">
                            <span>{totalLike}</span>
                            <span className="md:block hidden">Thích</span>
                        </div>
                    </button>
                </div>

                {!isGlobalRatingPage && (
                    <div>
                        <button
                            className="flex items-center space-x-2 hover:underline"
                            onClick={() => handleReply()}
                        >
                            <ChatBubbleOvalLeftEllipsisIcon className="w-5 h-5" />
                            <div className="flex space-x-1 items-center min-w-fit">
                                <span className="md:block hidden whitespace-nowrap">
                                    Trả lời
                                </span>
                                <span>{user?.name}</span>
                            </div>
                        </button>
                    </div>
                )}
            </div>
            {createdAt && activeTab === "ratings" ? (
                <div>
                    <span>{timeAgo(createdAt)}</span>
                </div>
            ) : (
                <div className="text-right w-52 md:w-60">
                    <span className="truncate block">{chapterName}</span>
                </div>
            )}
        </footer>
    );
}

export default Footer;
