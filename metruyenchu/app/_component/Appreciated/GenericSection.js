"use client";
import Spinner from "../Spinner";
import RatingItem from "../Story/Activity/Rating/RatingItem";
import { useInfiniteGeneric } from "@/app/hooks/useInfiniteGeneric";
import { useEffect } from "react";

function GenericSection({
    queryKey,
    activeTab = "ratings",
    page = 1,
    pageSize = 10,
    isDisplayAll = false,
    onCountChange,
    sortOption = "newest",
    storyId,
}) {
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useInfiniteGeneric({ queryKey });
    const isGlobalRatingPage = pageSize === 4 || pageSize === 20;
    const visibleCount = data?.pages?.[0]?.visibleCount;

    useEffect(() => {
        if (Number.isFinite(visibleCount)) onCountChange?.(visibleCount);
    }, [onCountChange, visibleCount]);

    let genericData;
    if (activeTab === "ratings")
        genericData = data?.pages?.flatMap((p) => p?.ratings) || [];
    if (activeTab === "comments")
        genericData = data?.pages?.flatMap((p) => p?.discuss) || [];

    return (
        <div
            className={
                isGlobalRatingPage
                    ? "grid grid-cols-1 md:grid-cols-2 gap-5"
                    : ""
            }
        >
            {genericData?.map((item) => (
                <RatingItem
                    rating={item}
                    key={item.id}
                    pageSize={pageSize}
                    activeTab={activeTab}
                    storyId={storyId}
                    sortOption={sortOption}
                />
            ))}
            {pageSize !== 4 && hasNextPage && (
                <div className="grid grid-cols-1 col-span-full">
                    {isFetchingNextPage ? (
                        <Spinner />
                    ) : (
                        <button
                            className="flex items-center mx-auto px-4 py-2 rounded-md shadow-sm text-sm font-medium border border-primary text-primary w-1/3 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 text-center uppercase justify-center cursor-pointer"
                            onClick={() => fetchNextPage()}
                        >
                            Xem thêm
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

export default GenericSection;
