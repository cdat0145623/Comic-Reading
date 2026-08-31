import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import GenericSection from "@/app/_component/Appreciated/GenericSection";
import { Suspense } from "react";
import Spinner from "@/app/_component/Spinner";
import WrapperFormDiscuss from "./WrapperFormDiscuss";
import { getStoryDiscussions } from "@/app/_lib/story-activity-service";
import {
    ACTIVITY_LIST_PAGE_SIZE,
    ACTIVITY_LIST_STALE_TIME,
    discussionKeys,
} from "@/app/_lib/story-activity-query";

async function Comment({ activeTab, commentsCount, storyId, filter }) {
    const queryClient = new QueryClient();
    const queryKey = discussionKeys.list({ storyId, sortOption: filter });
    const queryFn = ({ pageParam }) =>
        getStoryDiscussions({
            storyId,
            sortOption: filter,
            pageSize: ACTIVITY_LIST_PAGE_SIZE,
            paginationCursor: pageParam,
        });

    await queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn,
        initialPageParam: null,
        staleTime: ACTIVITY_LIST_STALE_TIME,
    });

    return (
        <div className="col-span-full space-y-6">
            <WrapperFormDiscuss
                activeTab={activeTab}
                count={commentsCount}
                storyId={storyId}
            />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<Spinner />} key={`${filter}`}>
                    <GenericSection
                        queryKey={queryKey}
                        activeTab={activeTab}
                        storyId={storyId}
                        sortOption={filter}
                    />
                </Suspense>
            </HydrationBoundary>
        </div>
    );
}

export default Comment;
