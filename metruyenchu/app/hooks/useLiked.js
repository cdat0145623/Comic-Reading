import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setStoryActivityLike } from "../_lib/actions";
import {
    discussionKeys,
    ratingKeys,
} from "../_lib/story-activity-query";

export function useLiked() {
    const queryClient = useQueryClient();
    const { mutate: mutateLike, isPending: isLikePending } = useMutation({
        mutationFn: async ({ target, targetId, liked }) => {
            const result = await setStoryActivityLike({
                target,
                targetId,
                liked,
            });
            if (!result?.success) {
                throw new Error(result?.error || "Không thể cập nhật lượt thích");
            }
            return result;
        },
        onSuccess: async (_, variables) => {
            if (variables.active === "comments") {
                const invalidations = [
                    queryClient.invalidateQueries({
                        queryKey: discussionKeys.story(variables.storyId),
                    }),
                ];
                if (variables.rootCommentId) {
                    invalidations.push(
                        queryClient.invalidateQueries({
                            queryKey: discussionKeys.thread({
                                storyId: variables.storyId,
                                rootCommentId: variables.rootCommentId,
                            }),
                        }),
                    );
                }
                await Promise.all(invalidations);
                return;
            }

            if (variables.commentId) {
                await queryClient.invalidateQueries({
                    queryKey: ratingKeys.comments(variables.ratingId),
                });
                return;
            }

            await queryClient.invalidateQueries({
                queryKey: ratingKeys.all,
            });
        },
    });

    return { mutateLike, isLikePending };
}
