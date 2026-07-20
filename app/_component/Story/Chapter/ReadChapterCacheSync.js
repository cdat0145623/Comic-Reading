"use client";

import { recordChapterRead } from "@/app/_lib/api";
import { publishChapterReadEvent } from "@/app/_lib/reading-sync";
import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

function ReadChapterCacheSync({ storyId, chapterId, chapterNumber }) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const recordedKeyRef = useRef(null);

    useEffect(() => {
        if (!storyId || !chapterId || !chapterNumber || !userId) return;

        const recordKey = `${userId}:${storyId}:${chapterId}`;
        if (recordedKeyRef.current === recordKey) return;
        recordedKeyRef.current = recordKey;

        async function syncReadChapter() {
            try {
                const result = await recordChapterRead({ storyId, chapterId });
                if (!result?.read) {
                    throw new Error("Missing recorded chapter data");
                }

                publishChapterReadEvent({
                    ...result.read,
                    userId,
                });
            } catch (error) {
                recordedKeyRef.current = null;
                console.error("Failed to sync read chapter", error);
            }
        }

        syncReadChapter();
    }, [chapterId, chapterNumber, storyId, userId]);

    return null;
}

export default ReadChapterCacheSync;
