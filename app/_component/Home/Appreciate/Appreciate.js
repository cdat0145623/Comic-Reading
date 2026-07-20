import { Suspense } from "react";
import SectionLink from "../../SectionLink";
import Spinner from "../../Spinner";
import { getRatingsQueryKey } from "@/app/_lib/helper-server";
import GenericSection from "../../Appreciated/GenericSection";
import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import { getRatings } from "@/app/_lib/data-service";
import { ACTIVITY_LIST_STALE_TIME } from "@/app/_lib/story-activity-query";

async function Appreciate() {
    const queryClient = new QueryClient();
    const queryKey = getRatingsQueryKey({ pageSize: 4, sortOption: "newest" });

    await queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) =>
            getRatings({
                active: "ratings",
                pageSize: 4,
                sortOption: "newest",
                paginationCursor: pageParam,
            }),
        initialPageParam: null,
        staleTime: ACTIVITY_LIST_STALE_TIME,
    });

    return (
        <div className="mt-5">
            <SectionLink title="Đánh giá mới" href="/danh-gia" icon />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<Spinner />}>
                    <GenericSection queryKey={queryKey} pageSize={4} />
                </Suspense>
            </HydrationBoundary>
        </div>
    );
}

export default Appreciate;
