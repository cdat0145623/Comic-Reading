"use client";
import { useFetchWithMinLoading } from "@/app/hooks/useFetchWithMinLoading";
import { fetchReading } from "@/app/_lib/api";
import Loading from "@/app/_component/Loading";
import ReadingCard from "./ReadingCard";

function ReadingList({ user }) {
    const { id: userId } = user;

    const { data: readings, loading } = useFetchWithMinLoading(
        () => fetchReading(userId),
        [],
        500,
        userId
    );
    // console.log("Reading component:::", readings);
    return (
        <>
            {loading ? (
                <Loading section="reading" length={5} className="flex-1" />
            ) : (
                readings &&
                readings.length > 0 && (
                    <>
                        <div className="flex-1">
                            {readings.map((reading, index) => (
                                <ReadingCard
                                    key={reading.id}
                                    story={reading}
                                    index={index}
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
