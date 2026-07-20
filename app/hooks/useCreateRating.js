import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertStoryRatingAction } from "../_lib/actions";
import { notify } from "@/lib/toaster";
import {
    activityMutationKeys,
    ratingKeys,
} from "../_lib/story-activity-query";
import { useSession } from "next-auth/react";
import {
    commitActivitySubmission,
    upsertActivitySubmission,
} from "../_lib/story-activity-sync";
import { getPublicActivityErrorMessage } from "../_lib/story-activity-error";

export function useCreateRating({ onSuccess, storyId }) {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const mutationKey = activityMutationKeys.rating(storyId);

    const mutation = useMutation({
        mutationKey,
        mutationFn: async (variables) => {
            const result = await upsertStoryRatingAction(variables);
            if (!result?.success) {
                throw new Error(result?.error || "Không thể lưu đánh giá");
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
        onSuccess: async (res, variables) => {
            const newRating = res.rating;
            await queryClient.invalidateQueries({
                queryKey: ratingKeys.all,
            });
            commitActivitySubmission({
                context: { domain: "rating", storyId: newRating.storyId },
                userId,
                variables,
            });

            onSuccess?.(newRating, res.message);
        },
        onError: (err, variables) => {
            const message = getPublicActivityErrorMessage(
                err,
                "Không thể lưu đánh giá. Vui lòng thử lại.",
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
        createRating: mutation.mutate,
        isLoadingRating: mutation.isPending,
    };
}
