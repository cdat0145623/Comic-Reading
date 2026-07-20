"use client";

import { timeAgo } from "@/app/_lib/helper";
import { useChapterNavigation } from "@/app/hooks/useChapterNavigation";
import Link from "next/link";
import RemoveReadingStoryButton from "./RemoveReadingStoryButton";

function ReadingCard({ story, index, userId }) {
    const {
        id,
        storyId,
        readAt,
        lastReadAt,
        readNumber,
        title,
        totalChapters,
        slug,
    } = story;
    const { navigateToChapter } = useChapterNavigation();

    const handleNavigate = (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigateToChapter({ slug, number: readNumber });
    };

    return (
        <div className="grid" key={id}>
            <div
                className={`grid grid-cols-12 gap-2 py-3 px-3 ${
                    (index - 1) % 2 === 0 ? "bg-slate-100" : ""
                }`}
            >
                <div className="hidden md:grid md:col-span-1">
                    <span className="text-gray-500 text-xs truncate">
                        {timeAgo(lastReadAt ?? readAt)}
                    </span>
                </div>
                <div className="col-span-12 md:col-span-8 sm:col-span-9 truncate">
                    <Link
                        href={`/truyen/${slug}/chuong-${readNumber}`}
                        onClick={handleNavigate}
                    >
                        <span className="text-title-color font-semibold hover:text-primary">
                            {title}
                        </span>
                    </Link>
                </div>
                <div className="col-span-11 sm:col-span-2">
                    <span className="text-gray-500 md:text-xs text-sm truncate">
                        {`Đã đọc: ${readNumber}/${totalChapters}`}
                    </span>
                </div>
                <div className="col-span-1 justify-self-end">
                    <RemoveReadingStoryButton
                        storyId={storyId}
                        title={title}
                        userId={userId}
                    />
                </div>
            </div>
        </div>
    );
}

export default ReadingCard;
