"use client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { fetchRatings } from "../_lib/api";
import { fetchRatingsByKey, getRatingsQueryKey } from "../_lib/helper";

export function useRatings({ pageSize, display, filter, storyId }) {
    // console.log(
    //     `useRating:: { storyId=${storyId},  page: ${page} pageSize = ${pageSize}, display=${display} filter=${filter}, }`
    // );
    const { data } = useSuspenseQuery({
        queryKey: getRatingsQueryKey({
            storyId,
            pageSize,
            sortOption: filter,
            isDisplayAll: display,
        }),
        queryFn: ({ queryKey }) => fetchRatingsByKey({ queryKey }),
    });
    return { data };
}
// return fetchRatings({
//     storyId: storyId ?? undefined,
//     page,
//     pageSize,
//     sortOption: filter,
//     isDisplayAll: display,
// });

// queryKey: [
//             "ratings",
//             {
//                 storyId,
//                 page,
//                 pageSize,
//                 sortOption: filter,
//                 isDisplayAll: display,
//             },
//         ],
