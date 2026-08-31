"use client";

import { libraryKeys } from "@/app/_lib/library-query";
import { notify } from "@/lib/toaster";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useModal } from "@/app/_component/Modal/Modal";
import { useBenchmarkVariant } from "@/app/Providers";

async function fetchBookmarkStatus(storyId) {
    const response = await fetch(`/api/library/bookmarks/${storyId}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "Không thể tải đánh dấu");
    return data.bookmarked;
}

async function toggleBookmark({ storyId, enabled }) {
    const response = await fetch(`/api/library/bookmarks/${storyId}`, {
        method: enabled ? "POST" : "DELETE",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "Không thể cập nhật đánh dấu");
    return data.bookmarked;
}

function StoryBookmarkButton({
    storyId,
    className = "",
    callbackUrl,
    iconClassName = "h-5 w-5",
    label = "Đánh dấu",
    onChange,
}) {
    const { open } = useModal();
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const queryClient = useQueryClient();
    const benchmarkVariant = useBenchmarkVariant();
    const useOptimisticUpdate = benchmarkVariant !== "baseline";
    const queryKey = ["storyBookmark", storyId, userId];
    const { data: bookmarked = false, isPending: isStatusPending } = useQuery({
        queryKey,
        queryFn: () => fetchBookmarkStatus(storyId),
        enabled: Boolean(userId && storyId),
        staleTime: 30_000,
    });
    const mutation = useMutation({
        mutationFn: toggleBookmark,
        onMutate: async ({ enabled }) => {
            if (!useOptimisticUpdate) return { previous: bookmarked };
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, enabled);
            onChange?.(enabled);
            return { previous };
        },
        onError: (error, _variables, context) => {
            if (useOptimisticUpdate) {
                queryClient.setQueryData(queryKey, context?.previous);
                onChange?.(Boolean(context?.previous));
            }
            notify({ type: "error", message: error.message });
        },
        onSuccess: (value) => {
            queryClient.setQueryData(queryKey, value);
            if (!useOptimisticUpdate) onChange?.(value);
            queryClient.invalidateQueries({ queryKey: libraryKeys.all(userId) });
            queryClient.invalidateQueries({ queryKey: ["story", storyId] });
            notify({
                type: "success",
                message: value ? "Đã thêm vào Tủ truyện" : "Đã bỏ đánh dấu",
            });
        },
    });
    const isLoading =
        status === "loading" ||
        Boolean(userId && isStatusPending) ||
        mutation.isPending;
    const title = bookmarked ? "Bỏ đánh dấu truyện" : "Đánh dấu truyện";

    const handleClick = () => {
        if (!userId) {
            open("signIn", { callbackUrl: callbackUrl || pathname });
            return;
        }
        mutation.mutate({ storyId, enabled: !bookmarked });
    };

    return (
        <button
            type="button"
            disabled={isLoading}
            onClick={handleClick}
            aria-pressed={bookmarked}
            aria-label={title}
            title={title}
            data-testid="story-bookmark-button"
            data-story-id={storyId}
            data-benchmark-variant={benchmarkVariant}
            className={`${className} ${bookmarked ? "border-primary text-primary" : ""}`}
        >
            {bookmarked ? (
                <BookmarkSolidIcon className={iconClassName} />
            ) : (
                <BookmarkOutlineIcon className={iconClassName} />
            )}
            {label && <span>{label}</span>}
        </button>
    );
}

export default StoryBookmarkButton;
