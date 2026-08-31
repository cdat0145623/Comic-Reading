"use client";

import { fetchChapters, fetchReadChapterIds } from "@/app/_lib/api";
import Spinner from "@/app/_component/Spinner";
import { useModal } from "@/app/_component/Modal/Modal";
import { filterChapters } from "@/app/_lib/search";
import {
    BarsArrowDownIcon,
    BarsArrowUpIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { motion, useReducedMotion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useDeferredValue, useMemo, useState } from "react";
import ChapterCard from "../ChapterCard";

function ModalChapterCatalog({ onCloseModal }) {
    const { payload } = useModal();
    const { data: session } = useSession();
    const [sortOrder, setSortOrder] = useState("desc");
    const [searchTerm, setSearchTerm] = useState("");
    const deferredSearchTerm = useDeferredValue(searchTerm);
    const prefersReducedMotion = useReducedMotion();

    const storyId = payload?.storyId;
    const slug = payload?.slug;
    const storyTitle = payload?.storyTitle;
    const totalChapters = payload?.totalChapters;
    const userId = session?.user?.id;
    const hasCatalogPayload = Boolean(storyId && slug);

    const {
        data: chapters = [],
        isPending,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["chapterCatalog", storyId],
        queryFn: () => fetchChapters({ storyId }),
        enabled: !!storyId,
    });

    const { data: readChapterIds = [] } = useQuery({
        queryKey: ["readChapterIds", storyId, userId],
        queryFn: () => fetchReadChapterIds({ storyId }),
        enabled: Boolean(storyId && userId),
    });

    const filteredAndSortedChapters = useMemo(() => {
        const filteredChaptersResult = filterChapters(
            chapters,
            deferredSearchTerm,
        );

        return [...filteredChaptersResult].sort((a, b) =>
            sortOrder === "asc" ? a.number - b.number : b.number - a.number,
        );
    }, [chapters, deferredSearchTerm, sortOrder]);

    const readChapterIdSet = useMemo(
        () => new Set(readChapterIds),
        [readChapterIds],
    );

    const isAscending = sortOrder === "asc";

    if (!hasCatalogPayload) return null;

    return (
        <div className="app-panel w-[94vw] max-w-4xl overflow-hidden rounded-md border shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-secondary px-4 py-3">
                <div className="min-w-0">
                    <h2 className="text-base font-semibold text-title-color">
                        Mục lục
                    </h2>
                    <h1 className="mt-1 truncate text-lg font-semibold text-primary">
                        {storyTitle}
                        {totalChapters ? ` • ${totalChapters} chương` : ""}
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={onCloseModal}
                    className="rounded p-1 text-gray-500 hover:text-primary"
                    aria-label="Đóng mục lục"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>

            <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <MagnifyingGlassIcon className="app-muted pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2" />
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Tên chương hoặc số chương"
                        className="app-panel h-10 w-full rounded-md border py-2 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-primary focus:ring-1 focus:ring-primary"
                        aria-label="Tìm kiếm chương theo tên hoặc số chương"
                    />
                    {searchTerm ? (
                        <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="app-muted absolute right-2 top-1/2 rounded p-1 -translate-y-1/2 hover:text-primary"
                            aria-label="Xóa tìm kiếm chương"
                        >
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    ) : null}
                </div>

                {deferredSearchTerm ? (
                    <span className="app-muted whitespace-nowrap text-xs">
                        {filteredAndSortedChapters.length} kết quả
                    </span>
                ) : null}

                <button
                    type="button"
                    onClick={() =>
                        setSortOrder((order) =>
                            order === "asc" ? "desc" : "asc",
                        )
                    }
                    className="app-panel inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md border px-3 py-1.5 text-sm text-title-color transition-colors hover:border-primary hover:text-primary"
                >
                    {isAscending ? (
                        <BarsArrowUpIcon className="h-5 w-5" />
                    ) : (
                        <BarsArrowDownIcon className="h-5 w-5" />
                    )}
                    <span>{isAscending ? "Thấp → cao" : "Cao → thấp"}</span>
                </button>
            </div>

            <div className="max-h-[68vh] overflow-y-auto px-4 py-4">
                {isPending ? (
                    <div className="flex min-h-32 items-center justify-center">
                        <Spinner />
                    </div>
                ) : isError ? (
                    <div className="space-y-3 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <p>Không tải được danh sách chương.</p>
                        <button
                            type="button"
                            onClick={() => refetch()}
                            className="rounded bg-primary px-3 py-1.5 text-white"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : filteredAndSortedChapters.length === 0 ? (
                    <div className="rounded-md border border-slate-200 p-5 text-center text-sm text-gray-500">
                        <p>
                            {searchTerm
                                ? "Không tìm thấy chương phù hợp"
                                : "Chưa có chương nào"}
                        </p>
                        {searchTerm ? (
                            <button
                                type="button"
                                onClick={() => setSearchTerm("")}
                                className="mt-3 rounded-md border border-primary px-3 py-1.5 font-semibold text-primary hover:bg-[var(--app-primary-soft)]"
                            >
                                Xóa tìm kiếm
                            </button>
                        ) : null}
                    </div>
                ) : (
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    >
                        {filteredAndSortedChapters.map((chapter) => (
                            <ChapterCard
                                key={chapter.id}
                                chapter={chapter}
                                slug={slug}
                                isRead={readChapterIdSet.has(chapter.id)}
                                onNavigate={onCloseModal}
                                className="rounded border border-slate-200 px-3 py-2 hover:border-primary hover:bg-slate-50"
                            />
                        ))}
                    </motion.div>
                )}
            </div>
        </div>
    );
}

export default ModalChapterCatalog;
