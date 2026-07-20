"use client";

import { syncChapterReadCaches } from "@/app/_lib/reading-cache-sync";
import { subscribeChapterReadEvents } from "@/app/_lib/reading-sync";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

function ReadingCrossTabSync() {
    const queryClient = useQueryClient();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    useEffect(() => {
        if (!userId) return;

        return subscribeChapterReadEvents((event) => {
            void syncChapterReadCaches({ event, queryClient, userId }).catch(
                (error) => {
                    console.error("Failed to synchronize chapter read cache", error);
                },
            );
        });
    }, [queryClient, userId]);

    return null;
}

export default ReadingCrossTabSync;
