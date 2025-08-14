import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrUpdateRating } from "../_lib/actions";
import { notify } from "@/lib/toaster";

export function useCreateRating({ onSuccess }) {
    const queryClient = useQueryClient();

    const { mutate: createRating } = useMutation({
        mutationFn: ({ formData, storyId, slug }) =>
            createOrUpdateRating(formData, storyId, slug),
        onSuccess: (res) => {
            console.log(res);
            const newRating = res.rating;
            console.log("newRating:", newRating);

            queryClient.setQueriesData(
                {
                    queryKey: ["ratings"],
                },
                (oldData) => {
                    console.log("oldData::", oldData);
                    if (!oldData || !oldData.pages?.length) return oldData;

                    const updatedPages = oldData.pages.map(
                        (page, pageIndex) => {
                            const filteredRatings = page.ratings.filter(
                                (r) => r.userId !== newRating.userId
                            );
                            console.log("filteredRating:", filteredRatings);

                            if (pageIndex === 0) {
                                return {
                                    ...page,
                                    ratings: [newRating, ...filteredRatings],
                                };
                            }

                            return {
                                ...page,
                                ratings: filteredRatings,
                            };
                        }
                    );

                    console.log("updatedPages::", updatedPages);

                    return {
                        ...oldData,
                        pages: updatedPages,
                    };
                }
            );

            onSuccess?.(newRating, res.message);
        },
        onError: (err) => {
            console.log("Mutation not work, client error:", err?.message);
            notify({
                type: "error",
                message: err?.message || "Error is not defined",
            });
        },
    });

    return { createRating };
}
