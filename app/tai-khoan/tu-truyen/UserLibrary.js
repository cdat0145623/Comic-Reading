"use client";

import {
    BellIcon,
    BookmarkIcon,
    BookOpenIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { BellIcon as BellSolidIcon } from "@heroicons/react/24/solid";
import { updateUserLibrarySettingsAction } from "@/app/_lib/actions";
import {
    fetchLibraryPage,
    libraryKeys,
    removeLibraryStory,
    updateStorySubscription,
} from "@/app/_lib/library-query";
import { notify } from "@/lib/toaster";
import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import NavigationLink from "@/app/_component/NavigationLink";
import { useEffect, useMemo, useState } from "react";

const sortOptions = {
    reading: [
        ["recent", "Mới đọc"],
        ["chapter", "Chương mới"],
        ["title", "Tên truyện"],
    ],
    bookmarked: [
        ["saved", "Mới lưu"],
        ["chapter", "Chương mới"],
        ["title", "Tên truyện"],
    ],
};

const sortToSetting = {
    recent: "RECENTLYREAD",
    saved: "RECENTLYSAVED",
    chapter: "LATESTCHAPTER",
    title: "TITLE",
};

function getTimeLabel(value, now) {
    if (!value) return "Chưa đọc";
    const minutes = Math.max(0, Math.floor((now - new Date(value)) / 60000));
    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return `${Math.floor(hours / 24)} ngày trước`;
}

function RelativeTime({ value }) {
    const [label, setLabel] = useState(value ? "" : "Chưa đọc");

    useEffect(() => {
        if (!value) return;
        const update = () => setLabel(getTimeLabel(value, Date.now()));
        update();
        const interval = setInterval(update, 60_000);
        return () => clearInterval(interval);
    }, [value]);

    return <span>{label}</span>;
}

function updateItemSubscription(data, storyId, subscribed) {
    if (!data) return data;
    const updateItem = (item) =>
        item?.storyId === storyId ? { ...item, subscribed } : item;
    return {
        ...data,
        items: data.items.map(updateItem),
        lookaheadItem: updateItem(data.lookaheadItem),
    };
}

function removeItemFromPage(data, storyId) {
    if (!data) return data;
    const items = data.items.filter((item) => item.storyId !== storyId);
    if (data.lookaheadItem && data.lookaheadItem.storyId !== storyId) {
        items.push(data.lookaheadItem);
    }
    const totalItems = Math.max(0, data.totalItems - 1);
    return {
        ...data,
        items: items.slice(0, data.pageSize),
        lookaheadItem: null,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / data.pageSize)),
    };
}

function UserLibrary({
    userId,
    initialTab,
    initialPage,
    initialSort,
    defaultSorts,
    initialSettings,
}) {
    const queryClient = useQueryClient();
    const reduceMotion = useReducedMotion();
    const [tab, setTab] = useState(initialTab);
    const [page, setPage] = useState(initialPage);
    const [sort, setSort] = useState(initialSort);
    const [confirmItem, setConfirmItem] = useState(null);
    const [settings, setSettings] = useState(initialSettings);
    const [savedDefaults, setSavedDefaults] = useState(defaultSorts);

    const queryKey = useMemo(
        () => libraryKeys.list({ userId, tab, page, sort }),
        [page, sort, tab, userId],
    );
    const { data, isPending, isFetching, isError } = useQuery({
        queryKey,
        queryFn: () => fetchLibraryPage({ tab, page, sort }),
        placeholderData: keepPreviousData,
        staleTime: 30_000,
    });

    const syncUrl = (next) => {
        const query = new URLSearchParams({
            tab: next.tab,
            page: String(next.page),
            sort: next.sort,
        });
        window.history.replaceState(
            null,
            "",
            `/tai-khoan/tu-truyen?${query}`,
        );
    };

    const changeTab = (nextTab) => {
        const next = { tab: nextTab, page: 1, sort: savedDefaults[nextTab] };
        setTab(next.tab);
        setPage(next.page);
        setSort(next.sort);
        syncUrl(next);
    };

    const changeSort = (nextSort) => {
        const next = { tab, page: 1, sort: nextSort };
        setSort(nextSort);
        setPage(1);
        syncUrl(next);
    };

    const changePage = (nextPage) => {
        const next = { tab, page: nextPage, sort };
        setPage(nextPage);
        syncUrl(next);
        document.getElementById("library-list")?.scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "start",
        });
    };

    const removeMutation = useMutation({
        mutationFn: removeLibraryStory,
        onMutate: async ({ storyId }) => {
            await queryClient.cancelQueries({ queryKey });
            const previous = queryClient.getQueryData(queryKey);
            queryClient.setQueryData(queryKey, (old) =>
                removeItemFromPage(old, storyId),
            );
            setConfirmItem(null);
            return { previous };
        },
        onError: (error, _variables, context) => {
            queryClient.setQueryData(queryKey, context?.previous);
            notify({ type: "error", message: error.message });
        },
        onSuccess: async () => {
            const current = queryClient.getQueryData(queryKey);
            if (page > 1 && current?.items.length === 0) changePage(page - 1);
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: libraryKeys.all(userId) }),
                queryClient.invalidateQueries({ queryKey: ["readingStories", userId] }),
            ]);
            notify({ type: "success", message: "Đã cập nhật Tủ truyện" });
        },
    });

    useEffect(() => {
        if (!confirmItem) return;
        const closeOnEscape = (event) => {
            if (event.key === "Escape" && !removeMutation.isPending) {
                setConfirmItem(null);
            }
        };
        document.addEventListener("keydown", closeOnEscape);
        return () => document.removeEventListener("keydown", closeOnEscape);
    }, [confirmItem, removeMutation.isPending]);

    const subscriptionMutation = useMutation({
        mutationFn: updateStorySubscription,
        onMutate: async ({ storyId, enabled }) => {
            await queryClient.cancelQueries({ queryKey: libraryKeys.all(userId) });
            const snapshots = queryClient.getQueriesData({
                queryKey: libraryKeys.all(userId),
            });
            queryClient.setQueriesData(
                { queryKey: libraryKeys.all(userId) },
                (old) => updateItemSubscription(old, storyId, enabled),
            );
            return { snapshots };
        },
        onError: (error, _variables, context) => {
            context?.snapshots?.forEach(([key, value]) =>
                queryClient.setQueryData(key, value),
            );
            notify({ type: "error", message: error.message });
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: libraryKeys.all(userId) }),
    });

    const defaultMutation = useMutation({
        mutationFn: async () => {
            const nextSettings = {
                ...settings,
                ...(tab === "reading"
                    ? { sortReading: sortToSetting[sort] }
                    : { sortMarked: sortToSetting[sort] }),
            };
            const result = await updateUserLibrarySettingsAction(nextSettings);
            if (!result?.success) throw new Error(result?.error || "Không thể lưu");
            return result.settings;
        },
        onSuccess: (nextSettings) => {
            setSettings(nextSettings);
            setSavedDefaults({
                reading:
                nextSettings.sortReading === "RECENTLYREAD"
                    ? "recent"
                    : nextSettings.sortReading === "LATESTCHAPTER"
                      ? "chapter"
                      : "title",
                bookmarked:
                nextSettings.sortMarked === "RECENTLYSAVED"
                    ? "saved"
                    : nextSettings.sortMarked === "LATESTCHAPTER"
                      ? "chapter"
                      : "title",
            });
            notify({ type: "success", message: "Đã đặt làm mặc định" });
        },
        onError: (error) => notify({ type: "error", message: error.message }),
    });

    const currentDefault = savedDefaults[tab];
    const totalItems = data?.totalItems ?? 0;

    return (
        <main className="app-surface px-4 py-8 sm:px-7 sm:py-10">
            <header className="app-border flex items-end justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-2xl font-semibold sm:text-3xl">Tủ truyện</h1>
                    <p className="app-muted mt-2 max-w-xl text-sm">
                        Tiếp tục hành trình đang đọc hoặc quản lý những truyện bạn đã đánh dấu.
                    </p>
                </div>
                <p className="app-muted hidden text-right text-xs sm:block">
                    <strong className="block text-xl text-[var(--app-text)]">{totalItems}</strong>
                    truyện
                </p>
            </header>

            <section id="library-list" className="scroll-mt-4">
                <div className="app-border flex flex-col border-b sm:flex-row sm:items-stretch sm:justify-between">
                    <div className="grid grid-cols-2 sm:flex" role="tablist">
                        <LibraryTab active={tab === "reading"} onClick={() => changeTab("reading")}>
                            <BookOpenIcon className="h-5 w-5" /> Đang đọc
                        </LibraryTab>
                        <LibraryTab active={tab === "bookmarked"} onClick={() => changeTab("bookmarked")}>
                            <BookmarkIcon className="h-5 w-5" /> Đánh dấu
                        </LibraryTab>
                    </div>
                    <div className="flex items-center justify-between gap-3 py-3 sm:py-0">
                        <label className="app-muted text-xs" htmlFor="library-sort">Sắp xếp</label>
                        <select
                            id="library-sort"
                            value={sort}
                            onChange={(event) => changeSort(event.target.value)}
                            className="app-panel min-h-10 rounded border border-[var(--app-border)] px-3 text-sm font-semibold"
                        >
                            {sortOptions[tab].map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            disabled={sort === currentDefault || defaultMutation.isPending}
                            onClick={() => defaultMutation.mutate()}
                            className="min-h-10 rounded border border-[var(--app-border)] px-3 text-xs font-semibold disabled:opacity-40"
                        >
                            Đặt mặc định
                        </button>
                    </div>
                </div>

                <div className="relative min-h-[640px]">
                    {isFetching && !isPending && (
                        <div className="absolute inset-x-0 top-0 z-10 h-[2px] overflow-hidden bg-[var(--app-primary-soft)]">
                            <div className="h-full w-1/3 animate-pulse bg-primary" />
                        </div>
                    )}
                    {isPending ? (
                        <LibrarySkeleton />
                    ) : isError ? (
                        <LibraryState title="Không thể tải Tủ truyện" description="Vui lòng tải lại trang và thử lại." />
                    ) : data.items.length === 0 ? (
                        <LibraryState
                            title={tab === "reading" ? "Chưa có truyện đang đọc" : "Chưa có truyện đánh dấu"}
                            description={tab === "reading" ? "Truyện sẽ xuất hiện sau khi bạn đọc một chương." : "Hãy đánh dấu truyện để lưu vào danh sách này."}
                        />
                    ) : (
                        <motion.div
                            key={`${tab}-${page}-${sort}`}
                            initial={reduceMotion ? false : { opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <AnimatePresence initial={false}>
                                {data.items.map((item) => (
                                    <LibraryRow
                                        key={item.storyId}
                                        item={item}
                                        tab={tab}
                                        reduceMotion={reduceMotion}
                                        onRemove={() => setConfirmItem(item)}
                                        onToggleSubscription={() =>
                                            subscriptionMutation.mutate({
                                                storyId: item.storyId,
                                                enabled: !item.subscribed,
                                            })
                                        }
                                    />
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>

                {data && data.totalItems > 0 && (
                    <LibraryPagination data={data} onChange={changePage} />
                )}
            </section>

            {confirmItem && (
                <ConfirmRemove
                    tab={tab}
                    title={confirmItem.title}
                    pending={removeMutation.isPending}
                    onCancel={() => setConfirmItem(null)}
                    onConfirm={() =>
                        removeMutation.mutate({ tab, storyId: confirmItem.storyId })
                    }
                />
            )}
        </main>
    );
}

function LibraryTab({ active, onClick, children }) {
    return (
        <button
            type="button"
            role="tab"
            aria-selected={active}
            onClick={onClick}
            className={`relative flex min-h-14 items-center justify-center gap-2 px-5 text-sm font-semibold ${active ? "text-primary" : "app-muted"}`}
        >
            {children}
            <span className={`absolute inset-x-3 bottom-0 h-[3px] origin-center bg-primary transition-transform duration-200 ${active ? "scale-x-100" : "scale-x-0"}`} />
        </button>
    );
}

function LibraryRow({ item, tab, reduceMotion, onRemove, onToggleSubscription }) {
    const readNumber = item.lastChapter?.number ?? 1;
    const progress = item.totalChapters
        ? Math.min(100, Math.round((readNumber / item.totalChapters) * 100))
        : 0;
    return (
        <motion.article
            layout={!reduceMotion}
            exit={reduceMotion ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="app-border grid min-h-24 grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-3 border-b py-4 sm:grid-cols-[56px_minmax(0,1fr)_minmax(150px,190px)_auto] sm:gap-4"
        >
            <Image
                src={item.coverUrl}
                alt={`Bìa ${item.title}`}
                width={56}
                height={74}
                className="h-[68px] w-[52px] rounded-sm border border-[var(--app-border)] object-cover sm:h-[74px] sm:w-14"
            />
            <div className="min-w-0">
                <NavigationLink href={`/truyen/${item.slug}`} className="block truncate text-sm font-semibold hover:text-primary sm:text-base">
                    {item.title}
                </NavigationLink>
                <div className="app-muted mt-1 flex flex-wrap gap-x-3 text-xs">
                    <span>Đã đọc {readNumber}/{item.totalChapters}</span>
                    <RelativeTime
                        value={
                            tab === "reading"
                                ? item.lastReadAt
                                : item.bookmarkedAt
                        }
                    />
                </div>
                <div className="mt-3 h-[3px] max-w-60 overflow-hidden bg-[var(--app-surface-muted)]">
                    <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                </div>
            </div>
            <div className="hidden min-w-0 sm:block">
                <span className="app-muted text-xs">Chương mới nhất</span>
                {item.latestChapter ? (
                    <NavigationLink href={`/truyen/${item.slug}/chuong-${item.latestChapter.number}`} className="mt-1 block truncate text-xs font-semibold hover:text-primary">
                        Chương {item.latestChapter.number}: {item.latestChapter.name}
                    </NavigationLink>
                ) : <span className="app-muted mt-1 block text-xs">Chưa có chương</span>}
            </div>
            <div className="flex items-center gap-2">
                <NavigationLink
                    href={`/truyen/${item.slug}/chuong-${readNumber}`}
                    className="hidden min-h-10 items-center rounded border border-primary px-3 text-xs font-semibold text-primary hover:bg-[var(--app-primary-soft)] sm:flex"
                >
                    Đọc tiếp
                </NavigationLink>
                <button
                    type="button"
                    onClick={onToggleSubscription}
                    title={item.subscribed ? "Tắt thông báo chương mới" : "Bật thông báo chương mới"}
                    className={`grid h-10 w-10 place-items-center rounded border ${item.subscribed ? "border-primary bg-[var(--app-primary-soft)] text-primary" : "border-[var(--app-border)] app-muted"}`}
                >
                    {item.subscribed ? <BellSolidIcon className="h-5 w-5" /> : <BellIcon className="h-5 w-5" />}
                </button>
                <button
                    type="button"
                    onClick={onRemove}
                    title={tab === "reading" ? "Xóa khỏi danh sách đang đọc" : "Bỏ đánh dấu"}
                    className="grid h-10 w-10 place-items-center rounded border border-[var(--app-border)] text-[var(--app-muted)] hover:border-error hover:text-error"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>
            </div>
        </motion.article>
    );
}

function LibraryPagination({ data, onChange }) {
    const start = (data.page - 1) * data.pageSize + 1;
    const end = Math.min(data.page * data.pageSize, data.totalItems);
    const pageItems = getPaginationItems(data.page, data.totalPages);
    return (
        <nav className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between" aria-label="Phân trang Tủ truyện">
            <p className="app-muted text-xs">Hiển thị {start}–{end} trong {data.totalItems} truyện</p>
            <div className="flex gap-1">
                <PageButton disabled={data.page === 1} onClick={() => onChange(data.page - 1)} label="Trang trước"><ChevronLeftIcon className="h-4 w-4" /></PageButton>
                {pageItems.map((value, index) =>
                    value === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="grid h-9 min-w-7 place-items-center app-muted">…</span>
                    ) : (
                        <PageButton key={value} active={value === data.page} onClick={() => onChange(value)} label={`Trang ${value}`}>{value}</PageButton>
                    ),
                )}
                <PageButton disabled={data.page === data.totalPages} onClick={() => onChange(data.page + 1)} label="Trang sau"><ChevronRightIcon className="h-4 w-4" /></PageButton>
            </div>
        </nav>
    );
}

function getPaginationItems(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
    if (current <= 4) return [1, 2, 3, 4, 5, "ellipsis", total];
    if (current >= total - 3) {
        return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total];
}

function PageButton({ active, disabled, onClick, label, children }) {
    return <button type="button" aria-label={label} disabled={disabled} onClick={onClick} className={`grid h-9 min-w-9 place-items-center rounded border px-2 text-xs font-semibold disabled:opacity-30 ${active ? "border-primary bg-primary text-white" : "border-[var(--app-border)]"}`}>{children}</button>;
}

function ConfirmRemove({ tab, title, pending, onCancel, onConfirm }) {
    return (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-gray-500/50 px-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onCancel()}>
            <div role="dialog" aria-modal="true" aria-labelledby="remove-title" className="app-panel w-full max-w-sm rounded-md border border-[var(--app-border)] p-5 shadow-xl">
                <h2 id="remove-title" className="text-base font-semibold">{tab === "reading" ? "Xóa khỏi danh sách đang đọc?" : "Bỏ đánh dấu truyện?"}</h2>
                <p className="app-muted mt-2 text-sm"><strong className="text-[var(--app-text)]">{title}</strong>{tab === "reading" && " sẽ được ẩn nhưng tiến độ đọc vẫn được giữ."}</p>
                <div className="mt-5 flex justify-end gap-2">
                    <button type="button" onClick={onCancel} disabled={pending} className="min-h-10 rounded border border-[var(--app-border)] px-4 text-sm font-semibold">Hủy</button>
                    <button type="button" onClick={onConfirm} disabled={pending} className="min-h-10 rounded bg-error px-4 text-sm font-semibold text-white">{pending ? "Đang xử lý" : "Xác nhận"}</button>
                </div>
            </div>
        </div>
    );
}

function LibrarySkeleton() {
    return <div>{Array.from({ length: 6 }, (_, index) => <div key={index} className="app-border flex min-h-24 animate-pulse items-center gap-4 border-b py-4"><div className="h-[68px] w-[52px] bg-[var(--app-surface-muted)]" /><div className="flex-1"><div className="h-4 w-1/2 bg-[var(--app-surface-muted)]" /><div className="mt-3 h-3 w-1/3 bg-[var(--app-surface-muted)]" /></div></div>)}</div>;
}

function LibraryState({ title, description }) {
    return <div className="flex min-h-80 flex-col items-center justify-center text-center"><BookOpenIcon className="app-muted h-9 w-9" /><h2 className="mt-4 text-base font-semibold">{title}</h2><p className="app-muted mt-1 max-w-sm text-sm">{description}</p></div>;
}

export default UserLibrary;
