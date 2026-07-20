"use client";

import { useModal } from "@/app/_component/Modal/Modal";
import { useChapterNavigation } from "@/app/hooks/useChapterNavigation";
import { useEffect } from "react";

function isEditableTarget(target) {
    if (!(target instanceof HTMLElement)) return false;

    return Boolean(
        target.closest(
            "input, textarea, select, button, [contenteditable='true'], [role='dialog']",
        ),
    );
}

function ChapterKeyboardNavigation({
    slug,
    currentChapter,
    totalChapters,
    disabled = false,
}) {
    const { openName } = useModal();
    const { navigateToChapter, isNavigatingChapter } = useChapterNavigation();

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (
                disabled ||
                openName ||
                isNavigatingChapter ||
                event.repeat ||
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey ||
                isEditableTarget(event.target)
            ) {
                return;
            }

            const direction =
                event.key === "ArrowLeft"
                    ? -1
                    : event.key === "ArrowRight"
                      ? 1
                      : 0;

            if (!direction) return;

            const nextChapter = currentChapter + direction;
            if (nextChapter < 1 || nextChapter > totalChapters) return;

            event.preventDefault();
            navigateToChapter({ slug, number: nextChapter });
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        currentChapter,
        disabled,
        isNavigatingChapter,
        navigateToChapter,
        openName,
        slug,
        totalChapters,
    ]);

    return null;
}

export default ChapterKeyboardNavigation;
