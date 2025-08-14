"use client";
import { useMemo, useState } from "react";
import RatingCard from "./RatingCard";
import Spinner from "@/app/_component/Spinner";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ChevronUpIcon } from "@heroicons/react/24/solid";
import { ArrowTurnDownRightIcon } from "@heroicons/react/24/solid";
import FormComment from "./FormComment";
import { useComments } from "@/app/hooks/useComments";

function RatingItem({ rating, pageSize, activeTab, storyId, sortOption }) {
    const field = activeTab === "ratings" ? "comments" : "discuss";

    const paragraph = {
        character: rating.character,
        plot: rating.plot,
        world: rating.world,
        content: rating.content,
    };
    const ratingId = rating?.id;
    const initialCount =
        rating?._count?.ratingUsersComments ?? rating?._count?.replies;
    const isGlobalRatingPage = pageSize === 4 || pageSize === 20;
    const [showComments, setShowComments] = useState(false);
    const [isReply, setIsReply] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [tempComments, setTempComments] = useState({});
    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
        useComments({
            enabled: showComments,
            ...(activeTab === "ratings"
                ? { ratingId: rating?.id }
                : {
                      storyId,
                      sortOption,
                      ratingId,
                      active: activeTab,
                      rootCommentId: ratingId,
                  }),
        });
    const queryKey =
        activeTab === "ratings"
            ? ["ratingComments", ratingId]
            : ["comments", ratingId];
    const keyStr = JSON.stringify(queryKey);

    const mergedPages = useMemo(() => {
        if (!data) return [];

        const temp = tempComments[keyStr] || [];
        if (temp.length === 0) return data.pages;

        return data.pages.map((page, index) =>
            index === 0
                ? {
                      ...page,
                      [field]: [
                          ...temp,
                          ...page[field].filter(
                              (c) => !temp.some((t) => t.id === c.id)
                          ),
                      ],
                  }
                : page
        );
    }, [data, tempComments, field, keyStr]);

    const handleToggle = () => {
        if (!hasFetched) {
            setHasFetched(true);
        }
        setShowComments((prev) => !prev);
    };

    return (
        <>
            <RatingCard
                activeTab={activeTab}
                rating={rating}
                paragraph={paragraph}
                {...(activeTab === "comments"
                    ? { commentId: ratingId }
                    : { ratingId: ratingId })}
                pageSize={pageSize}
                setIsReply={setIsReply}
            />
            {isReply && (
                <FormComment
                    {...(activeTab === "ratings"
                        ? { ratingId: rating.id }
                        : {
                              storyId,
                              commentId: rating?.id,
                              sortOption,
                              ratingId,
                          })}
                    tempComments={tempComments}
                    setTempComments={setTempComments}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    setIsReply={setIsReply}
                    activeTab={activeTab}
                />
            )}

            {!isGlobalRatingPage && initialCount > 0 && (
                <div className="ml-12 mb-4">
                    {isLoading ? (
                        <div className="grid grid-cols-1 col-span-full">
                            <Spinner />
                        </div>
                    ) : (
                        <button
                            className="font-bold text-sm flex items-center"
                            onClick={handleToggle}
                        >
                            {`Xem thêm ${initialCount} trả lời`}
                            {!showComments ? (
                                <ChevronDownIcon className="ml-1 w-5 h-5" />
                            ) : (
                                <ChevronUpIcon className="ml-1 w-5 h-5" />
                            )}
                        </button>
                    )}
                </div>
            )}
            {!isGlobalRatingPage && showComments && (
                <div className="ml-12 mb-4">
                    {mergedPages.map((page, i) => (
                        <div key={i}>
                            {page[field].map((comment) => (
                                <RatingCard
                                    storyId={storyId}
                                    key={comment.id}
                                    activeTab={activeTab}
                                    comment={comment}
                                    ratingId={ratingId}
                                    tempComments={tempComments}
                                    setTempComments={setTempComments}
                                    showComments={showComments}
                                    setShowComments={setShowComments}
                                    paragraph={{
                                        content: comment.content,
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                    {hasNextPage && (
                        <div className="grid grid-cols-1 col-span-full">
                            {isFetchingNextPage ? (
                                <Spinner />
                            ) : (
                                <button
                                    className="font-bold text-sm flex items-center"
                                    onClick={() => fetchNextPage()}
                                >
                                    <ArrowTurnDownRightIcon className="mr-1 w-5 h-5" />
                                    Xem thêm trả lời
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </>
    );
}

export default RatingItem;
