"use client";

import { libraryKeys, removeLibraryStory } from "@/app/_lib/library-query";
import { notify } from "@/lib/toaster";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

function RemoveReadingStoryButton({ storyId, title, userId }) {
    const [isConfirming, setIsConfirming] = useState(false);
    const queryClient = useQueryClient();
    const queryKey = ["readingStories", userId];
    const mutation = useMutation({
        mutationFn: () => removeLibraryStory({ tab: "reading", storyId }),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old = []) =>
                old.filter((story) => story.storyId !== storyId),
            );
            setIsConfirming(false);
            return { previous };
        },
        onError: (error, _variables, context) => {
            queryClient.setQueryData(queryKey, context?.previous);
            notify({ type: "error", message: error.message });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: libraryKeys.all(userId) });
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return (
        <>
            <button
                type="button"
                onClick={() => setIsConfirming(true)}
                aria-label={`Xóa ${title} khỏi danh sách đang đọc`}
                className="grid h-8 w-8 place-items-center rounded border border-[var(--app-border)] text-primary"
            >
                <XMarkIcon className="h-4 w-4" />
            </button>
            {isConfirming && (
                <div
                    className="fixed inset-0 z-[70] grid place-items-center bg-gray-500/50 px-4"
                    onMouseDown={(event) =>
                        event.target === event.currentTarget &&
                        setIsConfirming(false)
                    }
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="app-panel w-full max-w-sm rounded-md border border-[var(--app-border)] p-5 shadow-xl"
                    >
                        <h2 className="font-semibold">
                            Xóa khỏi danh sách đang đọc?
                        </h2>
                        <p className="app-muted mt-2 text-sm">
                            <strong className="text-[var(--app-text)]">
                                {title}
                            </strong>{" "}
                            sẽ được ẩn nhưng tiến độ đọc vẫn được giữ.
                        </p>
                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setIsConfirming(false)}
                                className="min-h-10 rounded border border-[var(--app-border)] px-4 text-sm font-semibold"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => mutation.mutate()}
                                className="min-h-10 rounded bg-error px-4 text-sm font-semibold text-white"
                            >
                                Xác nhận
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default RemoveReadingStoryButton;
