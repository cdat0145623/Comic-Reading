"use client";

import { libraryKeys } from "@/app/_lib/library-query";
import { notify } from "@/lib/toaster";
import { BookmarkIcon as BookmarkOutlineIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as BookmarkSolidIcon } from "@heroicons/react/24/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";

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
    label = "Đánh dấu",
    onChange,
}) {
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const queryClient = useQueryClient();
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
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, enabled);
            onChange?.(enabled);
            return { previous };
        },
        onError: (error, _variables, context) => {
            queryClient.setQueryData(queryKey, context?.previous);
            onChange?.(Boolean(context?.previous));
            notify({ type: "error", message: error.message });
        },
        onSuccess: (value) => {
            queryClient.setQueryData(queryKey, value);
            queryClient.invalidateQueries({ queryKey: libraryKeys.all(userId) });
            queryClient.invalidateQueries({ queryKey: ["story", storyId] });
            notify({
                type: "success",
                message: value ? "Đã thêm vào Tủ truyện" : "Đã bỏ đánh dấu",
            });
        },
    });

    return (
        <button
            type="button"
            disabled={!userId || isStatusPending || mutation.isPending}
            onClick={() => mutation.mutate({ storyId, enabled: !bookmarked })}
            aria-pressed={bookmarked}
            className={`${className} ${bookmarked ? "border-primary text-primary" : ""}`}
        >
            {bookmarked ? (
                <BookmarkSolidIcon className="h-5 w-5" />
            ) : (
                <BookmarkOutlineIcon className="h-5 w-5" />
            )}
            {label && <span>{label}</span>}
        </button>
    );
}

export default StoryBookmarkButton;
