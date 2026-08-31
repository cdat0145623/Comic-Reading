"use client";

import { useModal } from "@/app/_component/Modal/Modal";
import { ListBulletIcon } from "@heroicons/react/24/outline";

function ChapterCatalogButton({
    storyId,
    slug,
    storyTitle,
    totalChapters,
    currentChapter,
    className = "",
    children,
}) {
    const { open } = useModal();

    const openCatalog = () => {
        open("chapterCatalog", {
            storyId,
            slug,
            storyTitle,
            totalChapters,
            currentChapter,
        });
    };

    return (
        <button type="button" onClick={openCatalog} className={className}>
            {children ?? (
                <>
                    <ListBulletIcon className="w-5 h-5" />
                    <span className="sm:block hidden">Mục lục</span>
                </>
            )}
        </button>
    );
}

export default ChapterCatalogButton;
