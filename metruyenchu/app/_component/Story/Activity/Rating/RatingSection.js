import Notice from "../Notice";
import Filter from "./Filter";

import Spinner from "@/app/_component/Spinner";
import { Suspense } from "react";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import { getRatingsQueryKey } from "@/app/_lib/helper-server";
import GenericSection from "@/app/_component/Appreciated/GenericSection";
import { ACTIVITY_LIST_STALE_TIME } from "@/app/_lib/story-activity-query";
import { getRatings } from "@/app/_lib/data-service";

async function RatingSection({
    storyId,
    display,
    filter,
    activeTab,
}) {
    const queryClient = new QueryClient();

    const queryKey = getRatingsQueryKey({
        storyId,
        pageSize: 10,
        sortOption: filter,
        isDisplayAll: display,
    });
    const queryFn = ({ pageParam }) =>
        getRatings({
            active: "ratings",
            storyId,
            pageSize: 10,
            sortOption: filter,
            paginationCursor: pageParam,
            isDisplayAll: display,
        });
    await queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn,
        initialPageParam: null,
        staleTime: ACTIVITY_LIST_STALE_TIME,
    });
    const visibleCount =
        queryClient.getQueryData(queryKey)?.pages?.[0]?.visibleCount ?? 0;

    return (
        <div className="space-y-6 col-span-full">
            <Notice activeTab={activeTab} />

            <Filter count={visibleCount} activeTab={activeTab} />

            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<Spinner />} key={`${display}-${filter}`}>
                    <GenericSection
                        activeTab={activeTab}
                        storyId={storyId}
                        sortOption={filter}
                        isDisplayAll={display}
                        pageSize={10}
                        queryKey={queryKey}
                    />
                </Suspense>
            </HydrationBoundary>
        </div>
    );
}

export default RatingSection;
