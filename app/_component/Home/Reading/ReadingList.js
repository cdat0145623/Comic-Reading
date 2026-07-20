"use client";
import { fetchReading } from "@/app/_lib/api";
import Loading from "@/app/_component/Loading";
import ReadingCard from "./ReadingCard";
import { useQuery } from "@tanstack/react-query";

const READING_STORIES_STALE_TIME = 30 * 1000;

function ReadingList({ user }) {
    const { id: userId } = user;

    const { data: readings = [], isPending } = useQuery({
        queryKey: ["readingStories", userId],
        queryFn: () => fetchReading(userId),
        enabled: Boolean(userId),
        // Freshness only avoids remount refetch; chapter reads are synced by ReadChapterCacheSync.
        staleTime: READING_STORIES_STALE_TIME,
        refetchOnWindowFocus: true,
    });

    // console.log("Reading component:::", readings);
    return (
        <>
            {isPending ? (
                <Loading section="reading" length={5} className="flex-1" />
            ) : (
                readings.length > 0 && (
                    <>
                        <div className="flex-1">
                            {readings.map((reading, index) => (
                                <ReadingCard
                                    key={reading.id}
                                    story={reading}
                                    index={index}
                                    userId={userId}
                                />
                            ))}
                        </div>
                    </>
                )
            )}
        </>
    );
}

export default ReadingList;
