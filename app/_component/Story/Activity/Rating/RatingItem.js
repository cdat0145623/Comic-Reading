"use client";
import { useState } from "react";
import RatingCard from "./RatingCard";
import Spinner from "@/app/_component/Spinner";
import { ChevronDownIcon } from "@heroicons/react/24/solid";
import { ChevronUpIcon } from "@heroicons/react/24/solid";
import { ArrowTurnDownRightIcon } from "@heroicons/react/24/solid";
import FormComment from "./FormComment";
import { useComments } from "@/app/hooks/useComments";
import PendingActivityList from "../PendingActivityList";
import { activityMutationKeys } from "@/app/_lib/story-activity-query";
import { useCreateComment } from "@/app/hooks/useCreateComment";
import { notify } from "@/lib/toaster";

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
        rating?._count?.ratingUsersComments ??
        rating?._count?.threadItems ??
        rating?._count?.replies;
    const isGlobalRatingPage = pageSize === 4 || pageSize === 20;
    const [showComments, setShowComments] = useState(false);
    const [isReply, setIsReply] = useState(false);
    const rootCommentId = activeTab === "comments" ? ratingId : undefined;
    const mutationKey =
        activeTab === "ratings"
            ? activityMutationKeys.ratingComment({ storyId, ratingId })
            : activityMutationKeys.discussionReply({
                  storyId,
                  rootCommentId,
              });
    const { submitComment: retryComment } = useCreateComment({
        activeTab,
        onSuccess: (_newComment, message) => {
            notify({ type: "success", message: message || "Success" });
        },
        ratingId,
        rootCommentId,
        storyId,
    });
    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
        useComments({
            enabled: showComments,
            ...(activeTab === "ratings"
                ? { ratingId: rating?.id }
                : {
                      storyId,
                      active: activeTab,
                      rootCommentId: ratingId,
                  }),
        });
    const handleToggle = () => {
        setShowComments((prev) => !prev);
    };
    const handleRetry = (variables) => {
        setShowComments(true);
        retryComment(variables);
    };

    return (
        <>
            <RatingCard
                activeTab={activeTab}
                storyId={storyId}
                rating={rating}
                paragraph={paragraph}
                {...(activeTab === "comments"
                    ? { commentId: ratingId, rootCommentId: ratingId }
                    : { ratingId: ratingId })}
                pageSize={pageSize}
                setIsReply={setIsReply}
            />
            {isReply && (
                <FormComment
                    {...(activeTab === "ratings"
                        ? { ratingId: rating.id, storyId }
                        : {
                              storyId,
                              commentId: rating?.id,
                              rootCommentId: ratingId,
                          })}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    setIsReply={setIsReply}
                    activeTab={activeTab}
                />
            )}
            {!isGlobalRatingPage && (
                <PendingActivityList
                    className="ml-12 mb-4"
                    mutationKey={mutationKey}
                    onRetry={handleRetry}
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
                    {data?.pages?.map((page, i) => (
                        <div key={i}>
                            {page[field].map((comment) => (
                                <RatingCard
                                    storyId={storyId}
                                    key={comment.id}
                                    activeTab={activeTab}
                                    comment={comment}
                                    ratingId={ratingId}
                                    rootCommentId={
                                        activeTab === "comments"
                                            ? ratingId
                                            : undefined
                                    }
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
