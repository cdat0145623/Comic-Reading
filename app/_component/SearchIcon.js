"use client";

import { fetchStorySearch } from "@/app/_lib/api";
import {
    findSearchMatchRange,
    normalizeSearchText,
} from "@/app/_lib/search";
import { useNavigationProgress } from "./NavigationProgressBar";
import {
    ArrowPathIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

function HighlightedText({ value, query }) {
    const range = findSearchMatchRange(value, query);

    if (!range) return value;

    return (
        <>
            {value.slice(0, range.start)}
            <mark className="rounded-sm bg-[var(--app-primary-soft)] px-0.5 text-inherit">
                {value.slice(range.start, range.end)}
            </mark>
            {value.slice(range.end)}
        </>
    );
}

function SearchResultSkeleton() {
    return (
        <div className="space-y-1 p-1" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, index) => (
                <div
                    key={index}
                    className="flex h-[72px] items-center gap-3 rounded-md px-3 py-2"
                >
                    <div className="h-14 w-10 shrink-0 animate-pulse rounded bg-slate-100" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                        <div className="h-3 w-1/3 animate-pulse rounded bg-slate-100" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SearchIcon() {
    const router = useRouter();
    const resultListId = useId();
    const rootRef = useRef(null);
    const inputRef = useRef(null);
    const prefersReducedMotion = useReducedMotion();
    const { startNavigationProgress } = useNavigationProgress();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const normalizedInput = normalizeSearchText(query);
    const normalizedQuery = normalizeSearchText(debouncedQuery);
    const canSearch = normalizedInput.length >= 2;
    const isDebouncing = normalizedInput !== normalizedQuery;

    const {
        data,
        isPending,
        isFetching,
        isError,
        refetch,
    } = useQuery({
        queryKey: ["storySearch", normalizedQuery],
        queryFn: ({ signal }) =>
            fetchStorySearch({ query: debouncedQuery, signal }),
        enabled: isOpen && normalizedQuery.length >= 2,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });

    const items = data?.items ?? [];

    useEffect(() => {
        const timeoutId = setTimeout(() => setDebouncedQuery(query), 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        if (!isOpen) return;

        inputRef.current?.focus();

        const handlePointerDown = (event) => {
            if (!rootRef.current?.contains(event.target)) setIsOpen(false);
        };

        document.addEventListener("pointerdown", handlePointerDown);
        return () =>
            document.removeEventListener("pointerdown", handlePointerDown);
    }, [isOpen]);

    useEffect(() => {
        setActiveIndex(0);
    }, [normalizedQuery, items.length]);

    const closeSearch = () => setIsOpen(false);

    const navigateToStory = (story) => {
        if (!story) return;
        closeSearch();
        startNavigationProgress();
        router.push(`/truyen/${story.slug}`);
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            closeSearch();
            return;
        }

        if (!items.length) return;

        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % items.length);
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex(
                (current) => (current - 1 + items.length) % items.length,
            );
        }

        if (event.key === "Enter") {
            event.preventDefault();
            navigateToStory(items[activeIndex] ?? items[0]);
        }
    };

    return (
        <div ref={rootRef} className="contents">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                className="rounded-md p-1.5 text-title-color transition-colors hover:bg-[var(--app-primary-soft)] hover:text-primary"
                aria-label={isOpen ? "Đóng tìm kiếm" : "Tìm kiếm truyện"}
                aria-expanded={isOpen}
                aria-controls={resultListId}
            >
                {isOpen ? (
                    <XMarkIcon className="h-6 w-6" />
                ) : (
                    <MagnifyingGlassIcon className="h-6 w-6" />
                )}
            </button>

            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={
                            prefersReducedMotion
                                ? false
                                : { opacity: 0, y: -6 }
                        }
                        animate={{ opacity: 1, y: 0 }}
                        exit={
                            prefersReducedMotion
                                ? { opacity: 0 }
                                : { opacity: 0, y: -6 }
                        }
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="absolute left-0 right-0 top-full z-50 px-2 pt-2"
                    >
                        <div className="app-panel overflow-hidden rounded-md border shadow-xl">
                            <form
                                className="relative border-b app-border"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    navigateToStory(
                                        items[activeIndex] ?? items[0],
                                    );
                                }}
                            >
                                <MagnifyingGlassIcon className="app-muted pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2" />
                                <input
                                    ref={inputRef}
                                    type="search"
                                    value={query}
                                    onChange={(event) =>
                                        setQuery(event.target.value)
                                    }
                                    onKeyDown={handleKeyDown}
                                    placeholder="Tên truyện hoặc tác giả"
                                    className="h-12 w-full bg-transparent pl-12 pr-12 text-sm outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary"
                                    role="combobox"
                                    aria-label="Tìm kiếm theo tên truyện hoặc tác giả"
                                    aria-controls={resultListId}
                                    aria-expanded={canSearch}
                                    aria-autocomplete="list"
                                    aria-activedescendant={
                                        items[activeIndex]
                                            ? `${resultListId}-${items[activeIndex].id}`
                                            : undefined
                                    }
                                    autoComplete="off"
                                />
                                {query ? (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setQuery("");
                                            inputRef.current?.focus();
                                        }}
                                        className="app-muted absolute right-3 top-1/2 rounded p-1 -translate-y-1/2 hover:text-primary"
                                        aria-label="Xóa từ khóa"
                                    >
                                        <XMarkIcon className="h-5 w-5" />
                                    </button>
                                ) : null}
                            </form>

                            {canSearch ? (
                                <div
                                    id={resultListId}
                                    role="listbox"
                                    className="max-h-[360px] overflow-y-auto p-1"
                                >
                                    {isDebouncing ||
                                    isPending ||
                                    (isFetching && !data) ? (
                                        <SearchResultSkeleton />
                                    ) : isError ? (
                                        <div className="flex min-h-24 items-center justify-between gap-4 px-4 py-3 text-sm text-error">
                                            <span>
                                                Không thể tìm kiếm truyện lúc
                                                này.
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => refetch()}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-current px-3 py-1.5 font-semibold"
                                            >
                                                <ArrowPathIcon className="h-4 w-4" />
                                                Thử lại
                                            </button>
                                        </div>
                                    ) : items.length === 0 ? (
                                        <p className="app-muted px-4 py-6 text-center text-sm">
                                            Không tìm thấy truyện phù hợp
                                        </p>
                                    ) : (
                                        items.map((story, index) => (
                                            <Link
                                                id={`${resultListId}-${story.id}`}
                                                key={story.id}
                                                href={`/truyen/${story.slug}`}
                                                role="option"
                                                aria-selected={
                                                    activeIndex === index
                                                }
                                                onMouseEnter={() =>
                                                    setActiveIndex(index)
                                                }
                                                onFocus={() =>
                                                    setActiveIndex(index)
                                                }
                                                onClick={() => {
                                                    closeSearch();
                                                    startNavigationProgress();
                                                }}
                                                className={`flex min-h-[72px] items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                                                    activeIndex === index
                                                        ? "bg-[var(--app-primary-soft)]"
                                                        : "hover:bg-[var(--app-surface-muted)]"
                                                }`}
                                            >
                                                <Image
                                                    src={story.coverUrl}
                                                    alt=""
                                                    width={40}
                                                    height={56}
                                                    className="h-14 w-10 shrink-0 rounded object-cover"
                                                />
                                                <span className="min-w-0">
                                                    <span className="block truncate font-semibold text-title-color">
                                                        <HighlightedText
                                                            value={story.title}
                                                            query={debouncedQuery}
                                                        />
                                                    </span>
                                                    <span className="app-muted mt-1 block truncate text-xs">
                                                        <HighlightedText
                                                            value={
                                                                story.author
                                                                    ?.name ?? ""
                                                            }
                                                            query={debouncedQuery}
                                                        />
                                                    </span>
                                                </span>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}

export default SearchIcon;
