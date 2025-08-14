import {
    dehydrate,
    HydrationBoundary,
    QueryClient,
} from "@tanstack/react-query";
import { fetchRatingsByKey } from "@/app/_lib/helper-server";
import GenericSection from "@/app/_component/Appreciated/GenericSection";
import { Suspense } from "react";
import Spinner from "@/app/_component/Spinner";
import WrapperFormDiscuss from "./WrapperFormDiscuss";

function Comment({ activeTab, commentsCount, storyId, filter }) {
    const queryClient = new QueryClient();
    const queryKey = ["comments", { storyId, sortOption: filter }];
    const queryFn = ({ queryKey }) => fetchRatingsByKey({ queryKey });

    queryClient.prefetchInfiniteQuery({
        queryKey,
        queryFn,
        initialPageParam: 1,
    });

    return (
        <div className="col-span-full space-y-6">
            <WrapperFormDiscuss
                activeTab={activeTab}
                count={commentsCount}
                storyId={storyId}
                filter={filter}
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
