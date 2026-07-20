"use client";

import GenericSection from "@/app/_component/Appreciated/GenericSection";
import Spinner from "@/app/_component/Spinner";
import FormDiscuss from "@/app/_component/Story/Activity/Comment/FormDiscuss";
import PendingActivityList from "@/app/_component/Story/Activity/PendingActivityList";
import { ActivityFilterControls } from "@/app/_component/Story/Activity/Rating/Filter";
import FormRating from "@/app/_component/Story/FormRating";
import {
    activityMutationKeys,
    discussionKeys,
    ratingKeys,
} from "@/app/_lib/story-activity-query";
import { useCreateDiscuss } from "@/app/hooks/useCreateDiscuss";
import { notify } from "@/lib/toaster";
import {
    Suspense,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

function ChapterActivityList({
    isDisplayAll,
    mode,
    onRatingCountChange,
    sortOption,
    storyId,
}) {
    const isRatingMode = mode === "rating";
    const activeTab = isRatingMode ? "ratings" : "comments";
    const queryKey = isRatingMode
        ? ratingKeys.list({
              storyId,
              pageSize: 10,
              sortOption,
              isDisplayAll,
          })
        : discussionKeys.list({ storyId, sortOption });

    return (
        <Suspense
            key={`${mode}-${sortOption}-${isDisplayAll}`}
            fallback={
                <div className="flex min-h-40 items-center justify-center">
                    <Spinner />
                </div>
            }
        >
            <GenericSection
                activeTab={activeTab}
                isDisplayAll={isDisplayAll}
                onCountChange={
                    isRatingMode ? onRatingCountChange : undefined
                }
                pageSize={10}
                queryKey={queryKey}
                sortOption={sortOption}
                storyId={storyId}
            />
        </Suspense>
    );
}

function ChapterActivitySection({
    initialCommentCount = 0,
    initialRatingCount = 0,
    mode,
    onModeChange,
    storyId,
}) {
    const sectionRef = useRef(null);
    const [isActivated, setIsActivated] = useState(mode === "rating");
    const [commentSortOption, setCommentSortOption] = useState("mostLiked");
    const [ratingSortOption, setRatingSortOption] = useState("mostLiked");
    const [isDisplayAllRatings, setIsDisplayAllRatings] = useState(false);
    const [commentCount, setCommentCount] = useState(initialCommentCount);
    const [ratingCount, setRatingCount] = useState(initialRatingCount);
    const isRatingMode = mode === "rating";
    const sortOption = isRatingMode
        ? ratingSortOption
        : commentSortOption;

    useEffect(() => {
        setCommentCount(initialCommentCount);
        setRatingCount(initialRatingCount);
    }, [initialCommentCount, initialRatingCount, storyId]);

    useEffect(() => {
        if (mode === "rating") setIsActivated(true);
    }, [mode]);

    useEffect(() => {
        const element = sectionRef.current;

        if (!element || isActivated) return;
        if (typeof IntersectionObserver === "undefined") {
            setIsActivated(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) return;
                setIsActivated(true);
                observer.disconnect();
            },
            { rootMargin: "800px 0px" },
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [isActivated]);

    const handleDiscussSuccess = (_newDiscuss, message) => {
        setCommentCount((count) => count + 1);
        notify({ type: "success", message: message || "Đã gửi bình luận" });
    };
    const handleRatingCountChange = useCallback((count) => {
        setRatingCount(count);
    }, []);
    const { createDiscuss, isLoadingDiscuss } = useCreateDiscuss({
        onSuccess: handleDiscussSuccess,
        storyId,
    });

    return (
        <section
            ref={sectionRef}
            aria-label="Bình luận và đánh giá truyện"
            className="mx-auto w-full max-w-screen-xl space-y-6 px-4 py-8 md:px-2"
        >
            {!isActivated ? (
                <div className="flex min-h-24 items-center justify-center">
                    <Spinner />
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {mode === "rating" ? (
                            <FormRating
                                storyId={storyId}
                                onCancel={() => onModeChange("comment")}
                            />
                        ) : (
                            <FormDiscuss
                                storyId={storyId}
                                createDiscuss={createDiscuss}
                            />
                        )}

                        <PendingActivityList
                            mutationKey={activityMutationKeys.rootDiscussion(
                                storyId,
                            )}
                            onRetry={createDiscuss}
                        />

                        <ActivityFilterControls
                            activeTab={isRatingMode ? "ratings" : "comments"}
                            count={isRatingMode ? ratingCount : commentCount}
                            display={isDisplayAllRatings}
                            isLoadingDiscuss={isLoadingDiscuss}
                            onDisplayChange={setIsDisplayAllRatings}
                            onSortChange={
                                isRatingMode
                                    ? setRatingSortOption
                                    : setCommentSortOption
                            }
                            showSubmit={mode === "comment"}
                            sortOption={sortOption}
                        />
                    </div>

                    <ChapterActivityList
                        isDisplayAll={isDisplayAllRatings}
                        mode={mode}
                        onRatingCountChange={handleRatingCountChange}
                        sortOption={sortOption}
                        storyId={storyId}
                    />
                </>
            )}
        </section>
    );
}

export default ChapterActivitySection;
