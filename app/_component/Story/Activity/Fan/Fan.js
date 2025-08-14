import { getFanStory } from "@/app/_lib/data-service";
import { HydrationBoundary, QueryClient } from "@tanstack/react-query";
import FanList from "./FanList";
import Notice from "../Notice";
import { Suspense } from "react";
import Spinner from "@/app/_component/Spinner";

function Fan({ storyId, activeTab, fansCount }) {
    const queryClient = new QueryClient();
    queryClient.prefetchQuery({
        queryKey: ["fans", storyId],
        queryFn: () => getFanStory(storyId),
    });
    return (
        <>
            <HydrationBoundary>
                <Suspense fallback={<Spinner />} key={`${activeTab}`}>
                    <FanList
                        activeTab={activeTab}
                        storyId={storyId}
                        fansCount={fansCount}
                    />
                </Suspense>
            </HydrationBoundary>
            <Notice activeTab={activeTab} />
        </>
    );
}

export default Fan;
