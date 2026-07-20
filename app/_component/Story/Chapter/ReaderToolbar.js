"use client";

import { useModal } from "@/app/_component/Modal/Modal";
import ChapterCatalogButton from "@/app/_component/Story/ChapterCatalog/ChapterCatalogButton";
import {
    BookmarkIcon,
    Cog6ToothIcon,
    ListBulletIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import ReaderSettingsPanel from "./ReaderSettingsPanel";

function ReaderToolbar({
    storyId,
    slug,
    storyTitle,
    totalChapters,
    currentChapter,
    isSettingsOpen,
    onSettingsOpenChange,
}) {
    const { openName } = useModal();
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollYRef = useRef(0);
    const scrollDistanceRef = useRef(0);
    const lastDirectionRef = useRef(null);
    const isPinned = isSettingsOpen || openName === "chapterCatalog";

    useEffect(() => {
        if (isPinned) setIsVisible(true);
    }, [isPinned]);

    useEffect(() => {
        const handleScroll = () => {
            if (isPinned) return;

            const currentScrollY = Math.max(window.scrollY, 0);
            const delta = currentScrollY - lastScrollYRef.current;
            const direction = delta > 0 ? "down" : delta < 0 ? "up" : null;

            if (currentScrollY < 80) {
                setIsVisible(true);
                scrollDistanceRef.current = 0;
            } else if (direction) {
                if (lastDirectionRef.current !== direction) {
                    scrollDistanceRef.current = 0;
                    lastDirectionRef.current = direction;
                }

                scrollDistanceRef.current += Math.abs(delta);

                if (direction === "down" && scrollDistanceRef.current >= 24) {
                    setIsVisible(false);
                    scrollDistanceRef.current = 0;
                }

                if (direction === "up" && scrollDistanceRef.current >= 16) {
                    setIsVisible(true);
                    scrollDistanceRef.current = 0;
                }
            }

            lastScrollYRef.current = currentScrollY;
        };

        lastScrollYRef.current = window.scrollY;
        window.addEventListener("scroll", handleScroll, { passive: true });

        return () => window.removeEventListener("scroll", handleScroll);
    }, [isPinned]);

    if (isSettingsOpen) {
        return (
            <ReaderSettingsPanel
                onClose={() => onSettingsOpenChange(false)}
            />
        );
    }

    const toolbarButtonClass =
        "flex h-11 w-11 items-center justify-center rounded text-gray-600 hover:bg-secondary hover:text-primary";
    const visibilityClass = isVisible
        ? "translate-y-0 opacity-100 sm:translate-x-0"
        : "translate-y-[140%] opacity-0 sm:translate-x-[160%] sm:translate-y-0";
    return (
        <div
            className={`app-panel fixed bottom-3 left-1/2 right-auto z-30 flex -translate-x-1/2 items-center gap-1 rounded-md border p-1.5 shadow-xl transition-all duration-300 sm:bottom-auto sm:left-auto sm:right-[var(--reader-toolbar-right)] sm:top-1/2 sm:-translate-y-1/2 sm:flex-col ${visibilityClass}`}
            style={{
                "--reader-toolbar-right":
                    "max(1rem, calc((100vw - 1024px) / 2 - 4.5rem))",
            }}
            aria-label="Công cụ đọc truyện"
        >
            <button
                type="button"
                className={toolbarButtonClass}
                aria-label="Đánh dấu chương"
                title="Đánh dấu"
            >
                <BookmarkIcon className="h-6 w-6" />
            </button>

            <ChapterCatalogButton
                storyId={storyId}
                slug={slug}
                storyTitle={storyTitle}
                totalChapters={totalChapters}
                currentChapter={currentChapter}
                className={toolbarButtonClass}
            >
                <ListBulletIcon className="h-6 w-6" />
                <span className="sr-only">Mục lục</span>
            </ChapterCatalogButton>

            <button
                type="button"
                onClick={() => onSettingsOpenChange(true)}
                className={toolbarButtonClass}
                aria-label="Mở cấu hình đọc"
                title="Cấu hình đọc"
            >
                <Cog6ToothIcon className="h-6 w-6" />
            </button>
        </div>
    );
}

export default ReaderToolbar;
