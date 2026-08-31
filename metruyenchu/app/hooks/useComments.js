import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchRatings } from "../_lib/api";
import {
    ACTIVITY_THREAD_PAGE_SIZE,
    ACTIVITY_THREAD_STALE_TIME,
    discussionKeys,
    ratingKeys,
} from "../_lib/story-activity-query";

export function useComments({
    ratingId,
    enabled = true,
    storyId,
    active = "ratings",
    rootCommentId,
}) {
    const isDiscussionThread = active === "comments";
    const queryKey = isDiscussionThread
        ? discussionKeys.thread({ storyId, rootCommentId })
        : ratingKeys.comments(ratingId);

    const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
        useInfiniteQuery({
            queryKey,
            queryFn: ({ pageParam }) =>
                fetchRatings({
                    active,
                    storyId,
                    ratingId: isDiscussionThread ? undefined : ratingId,
                    rootCommentId: isDiscussionThread
                        ? rootCommentId
                        : undefined,
                    paginationCursor: pageParam,
                    pageSize: ACTIVITY_THREAD_PAGE_SIZE,
                }),
            initialPageParam: null,
            getNextPageParam: (lastPage) =>
                lastPage?.nextCursor ?? undefined,
            staleTime: ACTIVITY_THREAD_STALE_TIME,
            enabled:
                enabled &&
                (isDiscussionThread
                    ? Boolean(storyId && rootCommentId)
                    : Boolean(ratingId)),
        });

    return {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage,
    };
}
