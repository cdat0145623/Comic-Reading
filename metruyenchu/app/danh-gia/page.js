import { Suspense } from "react";
import SectionLink from "../_component/SectionLink";
import Spinner from "../_component/Spinner";
import GenericSection from "../_component/Appreciated/GenericSection";
import { getRatingsQueryKey } from "../_lib/helper-server";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import { getRatings } from "../_lib/data-service";
import { ACTIVITY_LIST_STALE_TIME } from "../_lib/story-activity-query";

async function Page() {
    const queryClient = new QueryClient();
    const queryKey = getRatingsQueryKey({ pageSize: 20, sortOption: "newest" });

    await queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) =>
            getRatings({
                active: "ratings",
                pageSize: 20,
                sortOption: "newest",
                paginationCursor: pageParam,
            }),
        initialPageParam: null,
        staleTime: ACTIVITY_LIST_STALE_TIME,
    });

    return (
        <div className="mt-6 space-y-5 lg:px-0 px-4">
            <SectionLink title="Đánh giá mới" primary />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<Spinner />}>
                    <GenericSection queryKey={queryKey} pageSize={20} />
                </Suspense>
            </HydrationBoundary>
        </div>
    );
}

export default Page;
