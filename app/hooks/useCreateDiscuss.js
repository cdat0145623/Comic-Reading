import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStoryDiscussionAction } from "../_lib/actions";
import {
    activityMutationKeys,
    discussionKeys,
} from "../_lib/story-activity-query";
import { notify } from "@/lib/toaster";
import { useSession } from "next-auth/react";
import {
    commitActivitySubmission,
    upsertActivitySubmission,
} from "../_lib/story-activity-sync";
import { getPublicActivityErrorMessage } from "../_lib/story-activity-error";

export function useCreateDiscuss({ onSuccess, storyId }) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const mutationKey = activityMutationKeys.rootDiscussion(storyId);

    const mutation = useMutation({
        mutationKey,
        mutationFn: async (variables) => {
            const result = await createStoryDiscussionAction(variables);
            if (!result?.success) {
                throw new Error(result?.error || "Không thể tạo thảo luận");
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
        onSuccess: async (
            { newComment: newDiscuss, message },
            variables,
        ) => {
            const { storyId } = variables;
            await queryClient.invalidateQueries({
                queryKey: discussionKeys.lists(storyId),
            });
            commitActivitySubmission({
                context: { domain: "root-discussion", storyId },
                userId,
                variables,
            });
            onSuccess?.(newDiscuss, message);
        },
        onError: (err, variables) => {
            const message = getPublicActivityErrorMessage(
                err,
                "Không thể tạo thảo luận. Vui lòng thử lại.",
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
        createDiscuss: mutation.mutate,
        isLoadingDiscuss: mutation.isPending,
    };
}
