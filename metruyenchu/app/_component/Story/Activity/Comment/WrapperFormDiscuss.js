"use client";
import { useCreateDiscuss } from "@/app/hooks/useCreateDiscuss";
import Filter from "../Rating/Filter";
import FormDiscuss from "./FormDiscuss";
import { notify } from "@/lib/toaster";
import { useEffect, useState } from "react";
import PendingActivityList from "../PendingActivityList";
import { activityMutationKeys } from "@/app/_lib/story-activity-query";

function WrapperFormDiscuss({ activeTab, count, storyId }) {
    const [displayCount, setDisplayCount] = useState(count);

    useEffect(() => {
        setDisplayCount(count);
    }, [count]);

    const handleSuccess = (_newDiscuss, message) => {
        setDisplayCount((currentCount) => currentCount + 1);
        notify({ type: "success", message: message || "Success" });
    };
    const { createDiscuss, isLoadingDiscuss } = useCreateDiscuss({
        onSuccess: handleSuccess,
        storyId,
    });
    const mutationKey = activityMutationKeys.rootDiscussion(storyId);
    return (
        <div>
            <FormDiscuss
                storyId={storyId}
                createDiscuss={createDiscuss}
            />
            <PendingActivityList
                mutationKey={mutationKey}
                onRetry={createDiscuss}
            />
            <Filter
                activeTab={activeTab}
                count={displayCount}
                isLoadingDiscuss={isLoadingDiscuss}
            />
        </div>
    );
}

export default WrapperFormDiscuss;
