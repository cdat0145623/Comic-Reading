"use client";

import { useSuspenseInfiniteQuery } from "@tanstack/react-query";
import { fetchRatingsByKey } from "../_lib/helper";
import { fetchRatings } from "../_lib/api";
import {
    ACTIVITY_LIST_PAGE_SIZE,
    ACTIVITY_LIST_STALE_TIME,
    getDiscussionListParams,
} from "../_lib/story-activity-query";

export function useInfiniteGeneric({ queryKey }) {
    const isDiscussionList = queryKey[0] === "discussions";
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useSuspenseInfiniteQuery({
            queryKey,
            queryFn: ({ queryKey: currentQueryKey, pageParam }) => {
                if (isDiscussionList) {
                    const { storyId, sortOption } =
                        getDiscussionListParams(currentQueryKey);

                    return fetchRatings({
                        active: "comments",
                        storyId,
                        sortOption,
                        pageSize: ACTIVITY_LIST_PAGE_SIZE,
                        paginationCursor: pageParam,
                    });
                }
                return fetchRatingsByKey({
                    queryKey: currentQueryKey,
                    pageParam,
                });
            },
            initialPageParam: null,
            getNextPageParam: (lastPage) =>
                lastPage?.nextCursor ?? undefined,
            staleTime: ACTIVITY_LIST_STALE_TIME,
        });

    return { data, fetchNextPage, hasNextPage, isFetchingNextPage };
}
