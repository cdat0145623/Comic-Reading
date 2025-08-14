import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../_lib/actions";
import { notify } from "@/lib/toaster";

export function useCreateDiscuss({ onSuccess }) {
    const queryClient = useQueryClient();

    const { mutate: createDiscuss, isPending: isLoadingDiscuss } = useMutation({
        mutationFn: ({ formData, storyId }) =>
            createComment({ formData, storyId }),
        onSuccess: ({ newComment: newDiscuss, message }) => {
            console.log("new discuss: ", newDiscuss);

            queryClient.setQueriesData(
                {
                    queryKey: ["comments"],
                },
                (oldData) => {
                    console.log("oldData:", oldData);
                    if (!oldData || !oldData?.pages?.length) return oldData;

                    const updatedPages = oldData.pages.map(
                        (page, pageIndex) => {
                            const filteredDiscuss = page.discuss.filter(
                                (r) => r.userId !== newDiscuss.userId
                            );
                            console.log("filteredDiscuss:", filteredDiscuss);
                            if (pageIndex === 0) {
                                return {
                                    ...page,
                                    discuss: [newDiscuss, ...filteredDiscuss],
                                };
                            }
                            return {
                                ...page,
                                discuss: filteredDiscuss,
                            };
                        }
                    );

                    return {
                        ...oldData,
                        pages: updatedPages,
                    };
                }
            );

            onSuccess?.(newDiscuss, message);
        },
        onError: (err) => {
            console.log(
                "Mutation useCreateDiscuss not work, client error:",
                err?.message
            );
            notify({
                type: "error",
                message: err?.message || "Error is not defined",
            });
        },
    });
    return { createDiscuss, isLoadingDiscuss };
}
