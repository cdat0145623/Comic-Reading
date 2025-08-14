"use client";

import { fetchChapters } from "@/app/_lib/api";
import ChapterCard from "./ChapterCard";
import { sortLatest } from "@/app/_lib/helper";
import Loading from "../Loading";
import { useQuery } from "@tanstack/react-query";

function ListChapters({ storyId, slug }) {
    const { data: chapters, isPending } = useQuery({
        queryKey: ["chapters", storyId],
        queryFn: () => fetchChapters({ storyId }),
    });

    if (isPending)
        return (
            <Loading
                section="chapter"
                length={3}
                className="pt-6 md:px-2 px-4 grid md:grid-cols-3 grid-cols-1 gap-4"
            />
        );

    return (
        <>
            <div className="pt-6 md:px-2 px-4 grid md:grid-cols-3 grid-cols-1 gap-4">
                {sortLatest(chapters, 3).map((chapter) => (
                    <ChapterCard
                        chapter={chapter}
                        key={chapter.id}
                        slug={slug}
                    />
                ))}
            </div>
        </>
    );
}

export default ListChapters;
