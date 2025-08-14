"use client";
import TextExpander from "@/app/_component/TextExpander";
import { formatRatingContent, isLikedByCurrentUser } from "@/app/_lib/helper";
import Header from "@/app/_component/ui/Header";
import Footer from "@/app/_component/ui/Footer";
import { useState } from "react";
import FormComment from "./FormComment";
import { useSession } from "next-auth/react";

function RatingCard({
    rating,
    comment,
    paragraph,
    storyId,
    ratingId,
    commentId,
    pageSize,
    setIsReply,
    activeTab,
    tempComments,
    setTempComments,
    showComments,
    setShowComments,
}) {
    const isGlobalRatingPage = pageSize === 20 || pageSize === 4;
    const [isReplyComment, setIsReplyComment] = useState(false);
    const [mentionName, setMentionName] = useState("");
    const { data: session } = useSession();
    const liked = isLikedByCurrentUser(
        rating?.likes ?? comment?.userLikes ?? comment?.likes,
        session?.user?.id
    );
    return (
        <>
            <div
                className={`p-4 mb-6 ${
                    isGlobalRatingPage
                        ? "text-base bg-slate-100"
                        : "bg-white rounded-lg  border border-gray-200"
                }`}
                {...(ratingId && { id: `rating-${ratingId}` })}
            >
                <Header
                    activeTab={activeTab}
                    user={(rating || comment)?.user}
                    story={rating?.story}
                    stars={rating?.stars}
                    ratingId={ratingId}
                    commentId={comment?.id}
                    createdAt={(comment || rating)?.createdAt}
                    isGlobalRatingPage={isGlobalRatingPage}
                />

                <TextExpander>{formatRatingContent(paragraph)}</TextExpander>

                <Footer
                    activeTab={activeTab}
                    ratingId={ratingId}
                    commentId={comment?.id ?? commentId}
                    user={(rating || comment)?.user}
                    story={rating?.story}
                    likeCount={
                        rating?.likeCount ??
                        rating?._count?.likes ??
                        comment?._count?.userLikes ??
                        comment?.likeCount ??
                        0
                    }
                    liked={liked}
                    createdAt={rating?.createdAt}
                    isGlobalRatingPage={isGlobalRatingPage}
                    setIsReply={setIsReply || setIsReplyComment}
                    onMention={setMentionName}
                />
            </div>
            {isReplyComment && (
                <FormComment
                    storyId={storyId}
                    ratingId={ratingId}
                    user={comment?.user}
                    commentId={comment?.id}
                    mentionName={mentionName}
                    setIsReply={setIsReplyComment}
                    tempComments={tempComments}
                    setTempComments={setTempComments}
                    showComments={showComments}
                    setShowComments={setShowComments}
                    activeTab={activeTab}
                />
            )}
            {comment?.replies?.length > 0 && (
                <div>
                    {comment.replies.map((reply) => (
                        <RatingCard
                            storyId={storyId}
                            activeTab={activeTab}
                            comment={reply}
                            key={reply.id}
                            paragraph={{
                                content: reply.content,
                            }}
                            ratingId={reply?.ratingId ?? ratingId}
                            tempComments={tempComments}
                            setTempComments={setTempComments}
                            showComments={showComments}
                            setShowComments={setShowComments}
                        />
                    ))}
                </div>
            )}
        </>
    );
}

export default RatingCard;
