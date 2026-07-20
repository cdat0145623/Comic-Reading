"use client";

import { fetchChapterDetail } from "@/app/_lib/api";
import { getChapterDetailQueryKey } from "@/app/_lib/chapter-query";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import Chapter from "./Chapter";
import Content from "./Content";
import Features from "./Features";
import ReadChapterCacheSync from "./ReadChapterCacheSync";
import SubBanner from "../../SubBanner";
import Spinner from "../../Spinner";
import ChapterKeyboardNavigation from "./ChapterKeyboardNavigation";
import ReaderToolbar from "./ReaderToolbar";
import {
    ReaderSettingsProvider,
    useReaderSettings,
} from "./ReaderSettingsContext";
import styles from "./reader.module.css";
import ChapterActivitySection from "./ChapterActivitySection";

function ChapterReaderView({ story, slug, number }) {
    const { settings } = useReaderSettings();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activityMode, setActivityMode] = useState("comment");
    const activitySectionRef = useRef(null);
    const currentChapter = Number(number.replace("chuong-", ""));
    const chapter = story.chapters[0];

    useEffect(() => {
        setIsSettingsOpen(false);
        setActivityMode("comment");
    }, [number]);

    const handleRatingClick = () => {
        setActivityMode("rating");
        window.requestAnimationFrame(() => {
            activitySectionRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        });
    };

    return (
        <>
            <ReadChapterCacheSync
                storyId={story.id}
                chapterId={chapter.id}
                chapterNumber={currentChapter}
            />

            <ChapterKeyboardNavigation
                slug={slug}
                currentChapter={currentChapter}
                totalChapters={story._count.chapters}
                disabled={isSettingsOpen}
            />

            <ReaderToolbar
                storyId={story.id}
                slug={slug}
                storyTitle={story.title}
                totalChapters={story._count.chapters}
                currentChapter={currentChapter}
                isSettingsOpen={isSettingsOpen}
                onSettingsOpenChange={setIsSettingsOpen}
            />

            <div
                className={styles.readerCanvas}
                style={{
                    "--reader-font-size": `${settings.fontSize}px`,
                    "--reader-font-family":
                        settings.fontFamily === "serif"
                            ? "Georgia, 'Times New Roman', serif"
                            : "'Avenir Next', Arial, Helvetica, sans-serif",
                    "--reader-line-height": settings.lineHeight,
                }}
            >
                <div className={styles.readerSurface}>
                    <div className={styles.readerFlow}>
                        <Chapter chapter={story} />
                        <Content chapter={story} slug={slug} />
                        <SubBanner />
                        <Features
                            totalChapter={story._count.chapters}
                            isRatingActive={activityMode === "rating"}
                            onRatingClick={handleRatingClick}
                        />
                    </div>
                </div>
            </div>

            <div ref={activitySectionRef}>
                <ChapterActivitySection
                    initialCommentCount={story._count.discusses}
                    initialRatingCount={story._count.ratings}
                    mode={activityMode}
                    onModeChange={setActivityMode}
                    storyId={story.id}
                />
            </div>
        </>
    );
}

function ChapterReader({ slug, number }) {
    const {
        data: story,
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: getChapterDetailQueryKey({ slug, number }),
        queryFn: () => fetchChapterDetail({ slug, number }),
    });

    if (isPending) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Spinner />
            </div>
        );
    }

    if (isError || !story?.chapters?.length) {
        return (
            <div className="mx-auto max-w-screen-md space-y-3 p-4 text-center text-sm text-gray-500">
                <p>Không tải được chương truyện.</p>
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="rounded bg-primary px-3 py-1.5 text-white"
                >
                    Thử lại
                </button>
            </div>
        );
    }

    return (
        <ReaderSettingsProvider>
            <ChapterReaderView story={story} slug={slug} number={number} />
        </ReaderSettingsProvider>
    );
}

export default ChapterReader;
