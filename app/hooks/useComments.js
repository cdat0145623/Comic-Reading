import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRatings } from "../_lib/api";
import { collect } from "../_lib/helper";

export function useComments({
    ratingId,
    enabled = true,
    storyId,
    sortOption,
    active = "ratings",
    rootCommentId,
}) {
    // console.log("begin rootCommentId::", rootCommentId);
    const queryClient = useQueryClient();

    const queryKey = !!rootCommentId
        ? ["comments", rootCommentId]
        : ["ratingComments", ratingId];

    // console.log("queryKey:", queryKey);
    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
        useInfiniteQuery({
            queryKey,
            queryFn:
                active === "comments" && rootCommentId
                    ? async ({ pageParam = 0 }) => {
                          console.log("activeTab laf comments");
                          const pageSize = 5;
                          const cached = queryClient.getQueryData(queryKey);

                          if (cached?.pages[0].all && pageParam !== 0) {
                              const all = cached.pages[0]?.all;
                              console.log(
                                  `root comment ${rootCommentId} have comments: `,
                                  all
                              );
                              return {
                                  discuss: all.slice(
                                      pageParam,
                                      pageParam + pageSize
                                  ),
                                  nextCursor:
                                      pageParam + pageSize < all.length
                                          ? pageParam + pageSize
                                          : undefined,
                              };
                          }

                          const res = await fetchRatings({
                              active,
                              storyId,
                              ratingId,
                          });
                          console.log("res::", res);
                          const all = Array.isArray(res?.discuss)
                              ? collect(res.discuss)
                              : [];
                          console.log("all comments:::::", all);
                          return {
                              discuss: all.slice(
                                  pageParam,
                                  pageParam + pageSize
                              ),
                              nextCursor:
                                  pageParam + pageSize < all.length
                                      ? pageParam + pageSize
                                      : undefined,
                              all,
                          };
                      }
                    : async ({ queryKey, pageParam }) => {
                          console.log("useComments queryKey:", queryKey);
                          console.log("pageParams:", pageParam);

                          const result = await fetchRatings({
                              active,
                              ratingId,
                              storyId,
                              sortOption,
                              paginationCursor: pageParam,
                              pageSize: 5,
                          });
                          console.log(`Comment depend ${ratingId}:`, result);
                          return result;
                      },
            getNextPageParam: (lastPage) => {
                console.log("lastPageLL", lastPage);
                return lastPage?.nextCursor ?? undefined;
            },
            enabled,
        });

    return {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    };
}

// const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
//         useInfiniteQuery({
//             queryKey: ["comments", ratingId],
//             queryFn: async ({ pageParam }) => {
//                 console.log("pageParams:", pageParam);
//                 const result = await fetchRatings({
//                     ratingId,
//                     page: pageParam,
//                     pageSize: 5,
//                 });
//                 console.log(`Comment depend ${ratingId}:`, result);
//                 return result;
//             },
//             getNextPageParam: (lastPage, allPages) => {
//                 return lastPage?.hasMore ? allPages.length + 1 : undefined;
//             },
//             enabled,
//         });

//     return { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage };

//Cách 1 ko work error at condition when called fetchAllData()
// const allDataRef = useRef([]);
//     useEffect(() => {
//         console.log("useEffect is running");
//         if (active === "ratings") return;

//         const fetchAllData = async () => {
//             const data = await fetchRatings({
//                 active,
//                 ratingId,
//                 storyId,
//                 pageSize: 5,
//             });
//             console.log("data from fetchAllData:::", data);
//             if (data.success) allDataRef.current = data.discuss;
//         };

//         if (rootCommentId && enabled && allDataRef.current.length <= 0) {
//             console.log("rootCommentId::", rootCommentId);
//             fetchAllData();
//         }
//     }, [rootCommentId, active, enabled]);

//Work ổn định
// export function useComments({
//     ratingId,
//     enabled = true,
//     storyId,
//     sortOption,
//     active = "ratings",
//     parentId,
// }) {
//     const queryKey = !!parentId
//         ? ["comments", ratingId]
//         : ["ratingComments", ratingId];
//     // console.log("queryKey:", queryKey);
//     const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
//         useInfiniteQuery({
//             queryKey,
//             queryFn: async ({ queryKey, pageParam }) => {
//                 console.log("useComments queryKey:", queryKey);
//                 console.log("pageParams:", pageParam);
// const result = await fetchRatings({
//     active,
//     ratingId,
//     storyId,
//     sortOption,
//     paginationCursor: pageParam,
//     pageSize: 5,
// });
// console.log(`Comment depend ${ratingId}:`, result);
// return result;
//             },
//             getNextPageParam: (lastPage) => {
//                 return lastPage.nextCursor ?? undefined;
//             },
//             enabled,
//         });

//     return { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage };
// }

//Cach 2: loi Can not read property of undefined (chưa fixx được)
// const { data: initialData, isLoading: isLoadingAllChildren } = useQuery({
//         queryKey: ["comments", rootCommentId],
//         queryFn: async () => {
//             const res = await fetchRatings({
//                 active,
//                 storyId,
//                 ratingId,
//             });
//             console.log("res::", res);
//             return res?.discuss || [];
//         },
//         enabled: active === "comments" && !!rootCommentId && enabled,
//     });
//     console.log("initialData", initialData);
//     console.log("length", initialData?.length);
//     const safeData = Array.isArray(initialData) ? initialData : [];
// select:
//     active === "comments" && rootCommentId
//         ? (initialData) => {
//               console.log("select Data:", data);
//               return data;
//           }
//         : undefined,
// initialData: safeData.length
//     ? {
//           pages: [
//               {
//                   discuss: safeData?.slice(0, 5),
//                   nextCursor: safeData?.length > 5 ? 5 : undefined,
//               },
//           ],
//           pageParams: [0],
//       }
//     : undefined,
// enabled:
//     active === "ratings"
//         ? enabled
//         : !!safeData && enabled && isLoadingAllChildren,
