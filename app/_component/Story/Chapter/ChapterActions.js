"use client";

import ChapterCatalogButton from "../ChapterCatalog/ChapterCatalogButton";
import {
    Cog6ToothIcon,
    ListBulletIcon,
} from "@heroicons/react/24/outline";
import StoryBookmarkButton from "../StoryBookmarkButton";

function ChapterActions({
    storyId,
    slug,
    storyTitle,
    totalChapters,
    currentChapter,
}) {
    return (
        <div className="space-x-4 flex items-center justify-center">
            <button className="flex px-2 py-1 border rounded border-title-color hover:text-primary">
                <div className="flex space-x-2 items-center justify-center text-sm">
                    <Cog6ToothIcon className="w-5 h-5" />
                    <span>Cấu hình</span>
                </div>
            </button>
            <ChapterCatalogButton
                storyId={storyId}
                slug={slug}
                storyTitle={storyTitle}
                totalChapters={totalChapters}
                currentChapter={currentChapter}
                className="flex px-2 py-1 border rounded border-title-color hover:text-primary"
            >
                <div className="flex space-x-2 items-center justify-center text-sm">
                    <ListBulletIcon className="w-5 h-5" />
                    <span>Mục lục</span>
                </div>
            </ChapterCatalogButton>
            <StoryBookmarkButton
                storyId={storyId}
                className="flex items-center gap-2 px-2 py-1 border rounded border-title-color hover:text-primary text-sm"
                label="Đánh dấu"
            />
        </div>
    );
}

export default ChapterActions;
