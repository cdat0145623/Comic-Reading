import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleRatingLike } from "../_lib/actions";

export function useLiked({ active }) {
    const queryClient = useQueryClient();
    const { mutate: mutateLike } = useMutation({
        mutationFn: ({ ratingId, commentId, active }) =>
            toggleRatingLike({ ratingId, commentId, active }),
        onSuccess: async ({ ratingId, commentId, message, discussId }) => {
            console.log("message", message);
            let queryKey = ["ratings"];
            if (active === "comments" || discussId) {
                queryKey = ["comments", discussId];
                await queryClient.invalidateQueries(queryKey);
            } else {
                if (ratingId) {
                    await queryClient.invalidateQueries(queryKey);
                } else {
                    queryKey = ["comments", ratingId];
                    console.log("queryKey:::", queryKey);
                    await queryClient.invalidateQueries(queryKey);
                }
            }
        },
        onError: (err) => {
            console.log("erro at mutation::", err);
        },
    });
    return { mutateLike };
}
