"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { getActivityInvalidationKeys } from "@/app/_lib/story-activity-query";
import {
    getTabId,
    subscribeActivityEvents,
} from "@/app/_lib/story-activity-sync";

function StoryActivityCrossTabSync() {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    useEffect(() => {
        if (!userId) return;
        return subscribeActivityEvents((event) => {
            if (
                event.type !== "activity-committed" ||
                event.sourceTabId === getTabId() ||
                event.userId !== userId
            ) {
                return;
            }

            for (const queryKey of getActivityInvalidationKeys(event.context)) {
                queryClient.invalidateQueries({
                    queryKey,
                    refetchType: "active",
                });
            }
        });
    }, [queryClient, userId]);

    return null;
}

export default StoryActivityCrossTabSync;
