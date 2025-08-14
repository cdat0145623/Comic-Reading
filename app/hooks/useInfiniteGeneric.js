"use client";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { fetchRatingsByKey } from "../_lib/helper";

export function useInfiniteGeneric({ queryKey, activeTab }) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useSuspenseInfiniteQuery({
            queryKey,
            queryFn: async ({ queryKey, pageParam }) => {
                // console.log("queryKey useInfiniteGeneric", queryKey);
                return fetchRatingsByKey({ queryKey, pageParam });
            },
            getNextPageParam: (lastPage) => {
                return lastPage?.nextCursor ?? undefined;
            },
        });
    return { data, fetchNextPage, hasNextPage, isFetchingNextPage };
}

// console.log("lastPage::", lastPage);
// console.log("allpages:", allPages);
// console.log("🧪 DEBUG getNextPageParam", {
//     lastPage,
//     allPages,
//     lastPageParam,
//     pageParams,
// });

// import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
// import { getRatingsQueryKey } from "../_lib/helper";
// import { fetchRatings } from "../_lib/api";

// export function useInfiniteGeneric({
//     initialData,
//     storyId,
//     pageSize,
//     sortOption,
//     isDisplayAll,
// }) {
//     const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
//         useSuspenseInfiniteQuery({
//             queryKey: getRatingsQueryKey({
//                 storyId,
//                 pageSize,
//                 sortOption,
//                 isDisplayAll,
//             }),
//             queryFn: async ({ queryKey, pageParam = 1 }) => {
//                 console.log("queryKey::", queryKey);
//                 console.log("QueryFn called with pageParam:", pageParam);
//                 const result = await fetchRatings({
//                     storyId: storyId ?? undefined,
//                     page: pageParam,
//                     pageSize,
//                     sortOption,
//                     isDisplayAll,
//                 });
//                 console.log("Fetched page result:", result);
//                 return result;
//             },
//             initialPageParam: 1,
//             getNextPageParam: (lastPage, allPages) => {
//                 return lastPage?.hasMore ? allPages?.length + 1 : undefined;
//             },
//             initialData: initialData,
//         });
//     return { data, fetchNextPage, hasNextPage, isFetchingNextPage };
// }

// const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
//         useSuspenseInfiniteQuery({
//             queryKey,
//             queryFn: async ({ queryKey, pageParam = 1 }) =>
//                 fetchRatingsByKey({ queryKey, pageParam }),
//             getNextPageParam: (lastPage, allPages) => {
//                 return lastPage?.hasMore ? allPages?.length + 1 : undefined;
//             },
//             initialPageParam: 1,
//         });
//     return { data, fetchNextPage, hasNextPage, isFetchingNextPage };
