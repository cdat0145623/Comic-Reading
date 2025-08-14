import Notice from "../Notice";
import Filter from "./Filter";

import Spinner from "@/app/_component/Spinner";
import { Suspense } from "react";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import {
    fetchRatingsByKey,
    getRatingsQueryKey,
} from "@/app/_lib/helper-server";
import GenericSection from "@/app/_component/Appreciated/GenericSection";

async function RatingSection({
    storyId,
    display,
    filter,
    activeTab,
    ratingsCount,
}) {
    const queryClient = new QueryClient();

    const queryKey = getRatingsQueryKey({
        storyId,
        pageSize: 10,
        sortOption: filter,
        isDisplayAll: display,
    });
    const queryFn = ({ queryKey }) => fetchRatingsByKey({ queryKey });
    queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn,
        initialPageParam: 1,
    });

    return (
        <div className="space-y-6 col-span-full">
            <Notice activeTab={activeTab} />

            <Filter count={ratingsCount} activeTab={activeTab} />

            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<Spinner />} key={`${display}-${filter}`}>
                    <GenericSection
                        activeTab={activeTab}
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
