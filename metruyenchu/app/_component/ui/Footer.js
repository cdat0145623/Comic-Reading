"use client";
import { timeAgo } from "@/app/_lib/helper";
import { HandThumbUpIcon } from "@heroicons/react/24/outline";
import { HandThumbUpIcon as LikedHandThunUpIcon } from "@heroicons/react/24/solid";
import { ChatBubbleOvalLeftEllipsisIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
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
    storyId,
    rootCommentId,
}) {
    const [totalLike, setTotalLike] = useState(likeCount);
    const [liked, setLiked] = useState(isLiked);
    const { mutateLike, isLikePending } = useLiked();
    const chapterName =
        user?.chaptersRead?.[0]?.chapter?.name ??
        story?.chapters?.[0]?.name ??
        "";
    useEffect(() => {
        if (!isLikePending) {
            setLiked(Boolean(isLiked));
            setTotalLike(likeCount);
        }
    }, [isLikePending, isLiked, likeCount]);

    const handleToggleLike = () => {
        if (isLikePending) return;

        const previousLiked = liked;
        const previousTotalLike = totalLike;
        const nextLiked = !liked;
        const target =
            activeTab === "comments"
                ? "discussion"
                : commentId
                  ? "ratingComment"
                  : "rating";
        const targetId = commentId ?? ratingId;

        setLiked(nextLiked);
        setTotalLike((prev) => prev + (nextLiked ? 1 : -1));

        mutateLike(
            {
                target,
                targetId,
                liked: nextLiked,
                active: activeTab,
                ratingId,
                commentId,
                storyId,
                rootCommentId,
            },
            {
                onError: () => {
                    setLiked(previousLiked);
                    setTotalLike(previousTotalLike);
                },
            },
        );
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
                        type="button"
                        disabled={isLikePending}
                        aria-pressed={liked}
                        className="flex items-center space-x-2 disabled:cursor-wait disabled:opacity-60"
                        onClick={handleToggleLike}
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
