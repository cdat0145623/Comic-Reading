import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    createDiscussionReplyAction,
    createRatingCommentAction,
} from "../_lib/actions";
import {
    activityMutationKeys,
    discussionKeys,
    ratingKeys,
} from "../_lib/story-activity-query";
import { notify } from "@/lib/toaster";
import { useSession } from "next-auth/react";
import {
    commitActivitySubmission,
    upsertActivitySubmission,
} from "../_lib/story-activity-sync";
import { getPublicActivityErrorMessage } from "../_lib/story-activity-error";

export function useCreateComment({
    activeTab,
    onSuccess,
    ratingId,
    rootCommentId,
    storyId,
}) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const mutationKey =
        activeTab === "ratings"
            ? activityMutationKeys.ratingComment({ storyId, ratingId })
            : activityMutationKeys.discussionReply({
                  storyId,
                  rootCommentId,
              });
    const mutation = useMutation({
        mutationKey,
        mutationFn: async (variables) => {
            const result =
                activeTab === "ratings"
                    ? await createRatingCommentAction(variables)
                    : await createDiscussionReplyAction(variables);
            if (!result?.success) {
                throw new Error(result?.error || "Bình luận thất bại");
            }
            return result;
        },
        onMutate: (variables) => {
            upsertActivitySubmission({
                mutationKey,
                status: "pending",
                userId,
                variables,
            });
        },
        onSuccess: async ({ newComment, message }, variables) => {
            if (newComment.ratingId) {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: ratingKeys.comments(newComment.ratingId),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: ratingKeys.all,
                    }),
                ]);
            } else {
                await Promise.all([
                    queryClient.invalidateQueries({
                        queryKey: discussionKeys.thread({
                            storyId: newComment.storyId,
                            rootCommentId: variables.rootCommentId,
                        }),
                    }),
                    queryClient.invalidateQueries({
                        queryKey: discussionKeys.lists(newComment.storyId),
                    }),
                ]);
            }

            commitActivitySubmission({
                context: newComment.ratingId
                    ? {
                          domain: "rating-comment",
                          ratingId: newComment.ratingId,
                          storyId,
                      }
                    : {
                          domain: "discussion-reply",
                          rootCommentId: variables.rootCommentId,
                          storyId: newComment.storyId,
                      },
                userId,
                variables,
            });

            onSuccess?.(newComment, message);
        },
        onError: (err, variables) => {
            const message = getPublicActivityErrorMessage(
                err,
                "Không thể gửi bình luận. Vui lòng thử lại.",
            );
            upsertActivitySubmission({
                error: new Error(message),
                mutationKey,
                status: "error",
                userId,
                variables,
            });
            notify({
                type: "error",
                message,
            });
        },
    });

    return {
        submitComment: mutation.mutate,
        isLoadingComment: mutation.isPending,
    };
}
