import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createComment } from "../_lib/actions";
import { notify } from "@/lib/toaster";
import { insertReplyRecursively } from "../_lib/helper";

export function useCreateComment({
    setTempComments,
    showComments,
    onSuccess,
    sortOption,
    tempComments,
    rootCommentId,
}) {
    const queryClient = useQueryClient();
    const { mutate: submitComment, isPending: isLoadingComment } = useMutation({
        mutationFn: ({ formData, ratingId, commentId, storyId, active }) =>
            createComment({ formData, ratingId, commentId, storyId, active }),

        onError: (err, variables, context) => {
            // const { ratingId } = variables;
            console.log("errr onError of useCreateComment:", err);
            // if (context?.previousData) {
            //     queryClient.setQueryData(
            //         ["comments", ratingId],
            //         context.previousData
            //     );
            // }
            notify({ type: "error", message: "Bình luận thất bại" });
        },
        onSuccess: async ({ newComment, message }, variables, context) => {
            console.log("onSuccess newComment:", newComment);
            const isRating = !!newComment.ratingId;
            // console.log("isRating:", isRating);
            // console.log(
            //     `storyId ${newComment.storyId}, sortOption ${sortOption}, parentId: ${newComment.parentId}`
            // );
            let queryKey = isRating
                ? ["ratingComments", newComment.ratingId]
                : ["comments", rootCommentId];
            console.log("queryKey:::::::", queryKey);

            const keyStr = JSON.stringify(queryKey);
            const cached = queryClient.getQueryData(queryKey);
            console.log(`cached for queryKey:${queryKey}`, cached);
            // const queryKey = ["comments", { storyId, sortOption: filter }];
            // const ratingId = newComment.ratingId;
            // const queryKey = ["ratingComments", ratingId];

            if (
                !cached ||
                newComment.parentId === null ||
                newComment.parentId === rootCommentId
            ) {
                console.log("not have parentId and not cached");
                setTempComments((prev) => ({
                    ...prev,
                    [keyStr]: [newComment, ...(prev[keyStr] || [])],
                }));
            } else {
                console.log("queryKey:", queryKey);

                const field = isRating ? "comments" : "discuss";
                console.log("tempComments::", tempComments);
                const temp = tempComments[keyStr] || [];
                // const temp = isRating
                //     ? tempComments[newComment.ratingId] || []
                //     : [];

                console.log("tempComments", tempComments);
                let mergedPages;
                if (temp.length > 0) {
                    const temp = tempComments[keyStr] || [];
                    console.log("Exist tempcomments:", temp);
                    mergedPages = cached.pages.map((page, index) => ({
                        ...page,
                        [field]:
                            index === 0
                                ? [
                                      ...temp,
                                      ...page[field].filter(
                                          (c) =>
                                              !temp.some((t) => t.id === c.id)
                                      ),
                                  ]
                                : page[field],
                    }));
                    console.log("mergePages:", mergedPages);
                }
                console.log(
                    `Cached ${field} ids:`,
                    cached.pages.flatMap((p) => p[field].map((c) => c.id))
                );
                console.log("Looking for parentId:", newComment.parentId);

                queryClient.setQueryData(queryKey, () => {
                    return {
                        pageParams: cached?.pageParams || [],
                        pages: (mergedPages || cached?.pages).map((page) => ({
                            ...page,
                            [field]: insertReplyRecursively(
                                page[field],
                                newComment
                            ),
                        })),
                    };
                });
                setTempComments((prev) => ({
                    ...prev,
                    [keyStr]: (prev[keyStr] || []).filter(
                        (c) => c.id !== newComment.parentId
                    ),
                }));
            }
            onSuccess?.(newComment, message);
            // const { ratingId } = variables;
            // const queryKey = ["comments", ratingId];
            // const tempId = context?.tempId;

            // await queryClient.invalidateQueries(queryKey);

            // queryClient.setQueryData(["comments", ratingId], (oldData) => {
            //     if (!oldData || !Array.isArray(oldData.pages)) return oldData;

            //     return {
            //         ...oldData,
            //         pages: oldData.pages.map((page) => ({
            //             ...page,
            //             comments: Array.isArray(page.comments)
            //                 ? page.comments.map((c) =>
            //                       c.id?.startsWith("temp-") ? newComment : c
            //                   )
            //                 : [],
            //         })),
            //     };
            // });
        },
    });
    return { submitComment, isLoadingComment };
}

// queryClient.setQueryData(queryKey, (oldData) => {
//                 if (!oldData) return oldData;

//                 return {
//                     ...oldData,
//                     pages: oldData.pages.map((page) => {
//                         const filtered = page.comments.filter(
//                             (c) => !c.id?.startsWith("temp-")
//                         );
//                         const alreadyIncluded = filtered.some(
//                             (c) => c.id === newComment.id
//                         );
//                         return {
//                             ...page,
//                             comments: alreadyIncluded
//                                 ? filtered
//                                 : [newComment, ...filtered],
//                         };
//                     }),
//                 };
//             });

// onMutate: async (variables) => {
//     const { ratingId, user } = variables;
//     console.log("ratingId:", ratingId, "user:", user);
//     const queryKey = ["comments", ratingId];

//     const tempId = "temp-" + Date.now();

//     const newComment = { ...variables.formData, id: tempId, user };
//     console.log("OnMutate NewComment:::", newComment);
//     console.log("queryClient:", queryKey);

//     await queryClient.cancelQueries(["comments", ratingId]);

//     const existing = queryClient.getQueryData(queryKey);
//     console.log(`Existing comment ${ratingId}`, existing);
//     if (existing) {
//         queryClient.setQueryData(queryKey, {
//             ...existing,
//             pages: existing.pages.map((page, index) =>
//                 index === existing.pages.length - 1
//                     ? {
//                           ...page,
//                           comments: [...page.comments, newComment],
//                       }
//                     : page
//             ),
//         });
//     } else {
//         queryClient.setQueryData(queryKey, {
//             pages: [
//                 {
//                     comments: [newComment],
//                     hasMore: true,
//                 },
//             ],
//             pageParams: [null],
//         });
//         queryClient.refetchQueries(queryKey);
//     }
//     return { previousData: existing, tempId };
// },

// onSuccess: async ({ newComment, message }, variables, context) => {
//             console.log("onSuccess newComment:", newComment);
//             const isRating = !!newComment.ratingId;
//             const queryKey = isRating
//                 ? ["ratingComments", newComment.ratingId]
//                 : ["comments", { storyId: newComment.storyId, sortOption }];

//             if (isRating && newComment.parentId === null) {
//                 console.log("rating parentId not null!!!!");
//                 setTempComments((prev) => ({
//                     ...prev,
//                     [newComment.ratingId]: [
//                         newComment,
//                         ...(prev[newComment.ratingId] || []),
//                     ],
//                 }));
//             } else {
//                 const field = isRating ? "comments" : "discuss";
//                 const cached = queryClient.getQueryData(queryKey);
//                 console.log(
//                     `Cached ${field} id:::`,
//                     cached.pages.flatMap((p) => p[field].map((c) => c.id))
//                 );
//                 console.log("Looking for parentId:", newComment.parentId);
//                 queryClient.setQueryData(queryKey, (oldData) => {
//                     if (!oldData) return oldData;
//                     console.log(`isRating: ${isRating}, field: ${field}`);
//                     return {
//                         ...oldData,
//                         pages: oldData.pages.map((page) => ({
//                             ...page,
//                             [field]: insertReplyRecursively(
//                                 page[field],
//                                 newComment
//                             ),
//                         })),
//                     };
//                 });
//             }
//             onSuccess?.(newComment, message);

// onSuccess: async ({ newComment, message }, variables, context) => {
//             console.log("onSuccess newComment:", newComment);
//             const ratingId = newComment.ratingId;
//             const queryKey = ["ratingComments", ratingId];
//             if (newComment.parentId === null) {
//                 console.log("not have parentId");
//                 setTempComments((prev) => ({
//                     ...prev,
//                     [ratingId]: [newComment, ...(prev[ratingId] || [])],
//                 }));
//             } else {
//                 const cached = queryClient.getQueryData(queryKey);
//                 console.log(
//                     "Cached comment ids:",
//                     cached.pages.flatMap((p) => p.comments.map((c) => c.id))
//                 );
//                 console.log("Looking for parentId:", newComment.parentId);

//                 queryClient.setQueryData(queryKey, (oldData) => {
//                     if (!oldData) return oldData;
//                     console.log("oldData::", oldData);
//                     return {
//                         ...oldData,
//                         pages: oldData.pages.map((page) => ({
//                             ...page,
//                             comments: insertReplyRecursively(
//                                 page.comments,
//                                 newComment
//                             ),
//                         })),
//                     };
//                 });
//             }
//             onSuccess?.(newComment, message);

// onSuccess: async ({ newComment, message }, variables, context) => {
//             console.log("onSuccess newComment:", newComment);
//             const ratingId = newComment.ratingId;
//             const queryKey = ["ratingComments", ratingId];

//             if (newComment.parentId === null) {
//                 console.log("not have parentId");
//                 setTempComments((prev) => ({
//                     ...prev,
//                     [ratingId]: [newComment, ...(prev[ratingId] || [])],
//                 }));
//             } else {
//                 const cached = queryClient.getQueryData(queryKey);
//                 const temp = tempComments[ratingId] || [];
//                 console.log("tempComments", tempComments);
//                 let mergedPages;
//                 if (temp.length > 0) {
//                     const temp = tempComments[ratingId] || [];
//                     console.log("Exist tempcomments:", temp);
//                     mergedPages = cached.pages.map((page, index) => ({
//                         ...page,
//                         comments:
//                             index === 0
//                                 ? [
//                                       ...temp,
//                                       ...page.comments.filter(
//                                           (c) =>
//                                               !temp.some((t) => t.id === c.id)
//                                       ),
//                                   ]
//                                 : page.comments,
//                     }));
//                     console.log("mergePages:", mergedPages);
//                 }
//                 console.log(
//                     "Cached comment ids:",
//                     cached.pages.flatMap((p) => p.comments.map((c) => c.id))
//                 );
//                 console.log("Looking for parentId:", newComment.parentId);

//                 queryClient.setQueryData(queryKey, () => {
//                     return {
//                         pageParams: cached?.pageParams || [],
//                         pages: (mergedPages || cached?.pages).map((page) => ({
//                             ...page,
//                             comments: insertReplyRecursively(
//                                 page.comments,
//                                 newComment
//                             ),
//                         })),
//                     };
//                 });
//                 setTempComments((prev) => ({
//                     ...prev,
//                     [ratingId]: (prev[ratingId] || []).filter(
//                         (c) => c.id !== newComment.parentId
//                     ),
//                 }));
//             }
//             onSuccess?.(newComment, message);

// if (commentIdToRootMap) {
//                     console.log("commentIdToRootMap::", commentIdToRootMap);
//                     setCommentIdToRootMap((prev) => ({
//                         ...prev,
//                         [newComment.id]: newComment.parentId
//                             ? commentIdToRootMap[newComment.parentId] ||
//                               newComment.parentId
//                             : newComment.id,
//                     }));
//                     const rootId =
//                         commentIdToRootMap[newComment.parentId] ||
//                         newComment.parentId;
//                     queryKey = ["comments", rootId];
//                     console.log("queryKey for discuss root::", queryKey);
//                 }
