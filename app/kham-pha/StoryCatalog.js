"use client";

import {
    AdjustmentsHorizontalIcon,
    ChevronDownIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useInfiniteQuery } from "@tanstack/react-query";
import Image from "next/image";
import NavigationLink from "@/app/_component/NavigationLink";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { fetchStoryCatalog } from "@/app/_lib/story-catalog-api";
import {
    STORY_CATALOG_GC_TIME,
    STORY_CATALOG_PAGE_SIZE,
    STORY_CATALOG_STALE_TIME,
    buildCatalogSearchParams,
    canonicalizeCatalogFilters,
    storyCatalogKeys,
} from "@/app/_lib/story-catalog-query";
import styles from "./catalog.module.css";

const GROUP_TO_KEY = {
    "tinh-trang": "status",
    "the-loai": "genre",
    loai: "type",
    "thuoc-tinh": "attribute",
    "tinh-cach-nhan-vat-chinh": "personality",
    "boi-canh-the-gioi": "world",
    "luu-phai": "style",
};
const PRIMARY_GROUPS = ["tinh-trang", "the-loai", "loai", "thuoc-tinh"];
const ADVANCED_GROUPS = [
    "tinh-cach-nhan-vat-chinh",
    "boi-canh-the-gioi",
    "luu-phai",
];
const CHAPTER_OPTIONS = [
    { label: "Dưới 300", slug: "short" },
    { label: "300 đến dưới 600", slug: "medium" },
    { label: "600 đến 1.000", slug: "long" },
    { label: "Trên 1.000", slug: "epic" },
];
const SORT_OPTIONS = [
    { label: "Mới cập nhật", value: "updated" },
    { label: "Đánh giá cao", value: "rating" },
    { label: "Lượt đọc", value: "reads" },
    { label: "Nhiều chương", value: "chapters" },
];

function FilterChoice({ active, children, onClick }) {
    return (
        <button
            type="button"
            className={`${styles.choice} ${active ? styles.choiceActive : ""}`}
            aria-pressed={active}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

function LongOptionGroup({ group, selected, onSelect }) {
    const [query, setQuery] = useState("");
    const options = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase("vi");
        return normalized
            ? group.tags.filter((tag) =>
                  tag.label.toLocaleLowerCase("vi").includes(normalized),
              )
            : group.tags;
    }, [group.tags, query]);

    return (
        <section className={styles.filterGroup}>
            <h3 className={styles.filterLabel}>{group.name}</h3>
            <input
                className={styles.optionSearch}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                type="search"
                placeholder={`Tìm ${group.name.toLocaleLowerCase("vi")}`}
                aria-label={`Tìm trong nhóm ${group.name}`}
            />
            <div className={styles.optionList}>
                {options.map((tag) => (
                    <button
                        key={tag.slug}
                        type="button"
                        className={`${styles.optionRow} ${selected === tag.slug ? styles.optionRowActive : ""}`}
                        onClick={() =>
                            onSelect(selected === tag.slug ? "" : tag.slug)
                        }
                    >
                        <span>{tag.label}</span>
                        {selected === tag.slug && <span>Đã chọn</span>}
                    </button>
                ))}
            </div>
        </section>
    );
}

function ChipGroup({ group, selected, onSelect, collapsible = false }) {
    const [expanded, setExpanded] = useState(false);
    const visible = collapsible && !expanded ? group.tags.slice(0, 6) : group.tags;

    return (
        <section className={styles.filterGroup}>
            <h3 className={styles.filterLabel}>{group.name}</h3>
            <div className={styles.choiceList}>
                {visible.map((tag) => (
                    <FilterChoice
                        key={tag.slug}
                        active={selected === tag.slug}
                        onClick={() =>
                            onSelect(selected === tag.slug ? "" : tag.slug)
                        }
                    >
                        {tag.label}
                    </FilterChoice>
                ))}
            </div>
            {collapsible && group.tags.length > 6 && (
                <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => setExpanded((value) => !value)}
                >
                    {expanded ? "Thu gọn" : `Xem thêm ${group.tags.length - 6}`}
                </button>
            )}
        </section>
    );
}

function FilterPanel({ filterGroups, filters, onChange, onClear }) {
    const [advancedOpen, setAdvancedOpen] = useState(false);
    const groupMap = useMemo(
        () => new Map(filterGroups.map((group) => [group.slug, group])),
        [filterGroups],
    );

    const renderGroup = (slug) => {
        const group = groupMap.get(slug);
        if (!group) return null;
        const key = GROUP_TO_KEY[slug];
        if (slug === "boi-canh-the-gioi" || slug === "luu-phai") {
            return (
                <LongOptionGroup
                    key={slug}
                    group={group}
                    selected={filters[key]}
                    onSelect={(value) => onChange(key, value)}
                />
            );
        }
        return (
            <ChipGroup
                key={slug}
                group={group}
                selected={filters[key]}
                collapsible={slug === "the-loai"}
                onSelect={(value) => onChange(key, value)}
            />
        );
    };

    return (
        <div className={styles.filterPanelInner}>
            <div className={styles.filterHeader}>
                <strong>Bộ lọc</strong>
                <button type="button" className={styles.textButton} onClick={onClear}>
                    Xóa tất cả
                </button>
            </div>
            {PRIMARY_GROUPS.map(renderGroup)}
            <section className={styles.filterGroup}>
                <h3 className={styles.filterLabel}>Số chương</h3>
                <div className={styles.choiceList}>
                    {CHAPTER_OPTIONS.map((option) => (
                        <FilterChoice
                            key={option.slug}
                            active={filters.chapters === option.slug}
                            onClick={() =>
                                onChange(
                                    "chapters",
                                    filters.chapters === option.slug
                                        ? ""
                                        : option.slug,
                                )
                            }
                        >
                            {option.label}
                        </FilterChoice>
                    ))}
                </div>
            </section>
            <button
                type="button"
                className={styles.advancedToggle}
                aria-expanded={advancedOpen}
                onClick={() => setAdvancedOpen((value) => !value)}
            >
                <span>Bộ lọc nâng cao</span>
                <ChevronDownIcon className={advancedOpen ? styles.rotateIcon : ""} />
            </button>
            <div className={`${styles.advancedContent} ${advancedOpen ? styles.advancedOpen : ""}`}>
                <div>{ADVANCED_GROUPS.map(renderGroup)}</div>
            </div>
        </div>
    );
}

function StoryCard({ story }) {
    const elapsedMinutes = story.latestChapterAt
        ? Math.max(
              1,
              Math.floor(
                  (Date.now() - new Date(story.latestChapterAt).getTime()) /
                      60_000,
              ),
          )
        : null;
    const relative = new Intl.RelativeTimeFormat("vi", { numeric: "auto" });
    const updatedLabel =
        elapsedMinutes === null
            ? "Chưa cập nhật"
            : elapsedMinutes < 60
              ? relative.format(-elapsedMinutes, "minute")
              : elapsedMinutes < 1440
                ? relative.format(-Math.floor(elapsedMinutes / 60), "hour")
                : relative.format(-Math.floor(elapsedMinutes / 1440), "day");

    return (
        <article className={styles.storyCard}>
            <NavigationLink href={`/truyen/${story.slug}`} className={styles.coverLink}>
                <Image
                    src={story.stringUrl}
                    alt={`Bìa truyện ${story.title}`}
                    width={88}
                    height={118}
                    className={styles.cover}
                />
            </NavigationLink>
            <div className={styles.storyBody}>
                <NavigationLink href={`/truyen/${story.slug}`} className={styles.storyTitle}>
                    {story.title}
                </NavigationLink>
                <p className={styles.author}>{story.author.name}</p>
                <p className={styles.summary}>{story.introduce}</p>
                <div className={styles.storyMeta}>
                    <span>{story.totalChapters.toLocaleString("vi-VN")} chương</span>
                    <span>{story.stats.totalReads.toLocaleString("vi-VN")} lượt đọc</span>
                    <span>{story.stats.averageRating.toFixed(1)} điểm</span>
                </div>
            </div>
            <div className={styles.storySide}>
                {story.genre && <span className={styles.genre}>{story.genre.label}</span>}
                <span>{updatedLabel}</span>
                {story.status?.slug !== "con-tiep" && (
                    <span className={styles.status}>{story.status?.label}</span>
                )}
            </div>
        </article>
    );
}

function StorySkeleton({ count = 3 }) {
    return Array.from({ length: count }, (_, index) => (
        <div className={styles.skeletonRow} key={index} aria-hidden="true">
            <span className={styles.skeletonCover} />
            <span className={styles.skeletonLines} />
        </div>
    ));
}

export default function StoryCatalog({ initialFilters, filterGroups }) {
    const [filters, setFilters] = useState(() =>
        canonicalizeCatalogFilters(initialFilters),
    );
    const [searchValue, setSearchValue] = useState(filters.q);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [mobileDraft, setMobileDraft] = useState(filters);
    const sentinelRef = useRef(null);

    const writeUrl = useCallback((nextFilters) => {
        const params = buildCatalogSearchParams(nextFilters);
        const url = params.size ? `/kham-pha?${params}` : "/kham-pha";
        window.history.replaceState(null, "", url);
    }, []);

    const commitFilters = useCallback(
        (next) => {
            const canonical = canonicalizeCatalogFilters(next);
            setFilters(canonical);
            writeUrl(canonical);
        },
        [writeUrl],
    );

    const updateFilter = useCallback(
        (key, value) => commitFilters({ ...filters, [key]: value }),
        [commitFilters, filters],
    );

    useEffect(() => {
        const trimmed = searchValue.trim();
        if (trimmed.length === 1 || trimmed === filters.q) return;
        const timeout = window.setTimeout(() => {
            commitFilters({ ...filters, q: trimmed });
        }, 300);
        return () => window.clearTimeout(timeout);
    }, [commitFilters, filters, searchValue]);

    useEffect(() => {
        if (!mobileOpen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === "Escape") setMobileOpen(false);
        };
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = "";
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [mobileOpen]);

    const query = useInfiniteQuery({
        queryKey: storyCatalogKeys.list(filters),
        queryFn: ({ pageParam, signal }) =>
            fetchStoryCatalog({
                filters,
                cursor: pageParam,
                pageSize: STORY_CATALOG_PAGE_SIZE,
                signal,
            }),
        initialPageParam: null,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: STORY_CATALOG_STALE_TIME,
        gcTime: STORY_CATALOG_GC_TIME,
    });
    const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel || !hasNextPage) return undefined;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { rootMargin: "280px" },
        );
        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

    const stories = useMemo(() => {
        const unique = new Map();
        for (const page of query.data?.pages ?? []) {
            for (const story of page.items) unique.set(story.id, story);
        }
        return [...unique.values()];
    }, [query.data]);
    const totalCount = query.data?.pages?.[0]?.totalCount ?? stories.length;

    const labelMap = useMemo(() => {
        const labels = new Map();
        for (const group of filterGroups) {
            for (const tag of group.tags) labels.set(tag.slug, tag.label);
        }
        for (const range of CHAPTER_OPTIONS) labels.set(range.slug, range.label);
        return labels;
    }, [filterGroups]);
    const activeFilters = Object.entries(filters).filter(
        ([key, value]) => value && key !== "sort" && key !== "q",
    );

    const clearAll = () => {
        setSearchValue("");
        commitFilters({ sort: filters.sort });
    };

    return (
        <div className={styles.page}>
            <header className={styles.heading}>
                <div>
                    <h1>Khám phá truyện</h1>
                    <p>Lọc theo trạng thái, thể loại và cách bạn muốn đọc.</p>
                </div>
                <button
                    type="button"
                    className={styles.mobileFilterButton}
                    onClick={() => {
                        setMobileDraft(filters);
                        setMobileOpen(true);
                    }}
                >
                    <AdjustmentsHorizontalIcon />
                    Bộ lọc
                </button>
            </header>

            <div className={styles.layout}>
                <aside className={styles.desktopFilters} aria-label="Bộ lọc truyện">
                    <FilterPanel
                        filterGroups={filterGroups}
                        filters={filters}
                        onChange={updateFilter}
                        onClear={clearAll}
                    />
                </aside>

                <section className={styles.results} aria-label="Kết quả truyện">
                    <div className={styles.searchRow}>
                        <label className={styles.searchBox}>
                            <MagnifyingGlassIcon />
                            <span className={styles.srOnly}>Tìm truyện hoặc tác giả</span>
                            <input
                                type="search"
                                value={searchValue}
                                onChange={(event) => setSearchValue(event.target.value)}
                                placeholder="Tìm theo tên truyện hoặc tác giả"
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    aria-label="Xóa từ khóa"
                                    onClick={() => {
                                        setSearchValue("");
                                        commitFilters({ ...filters, q: "" });
                                    }}
                                >
                                    <XMarkIcon />
                                </button>
                            )}
                        </label>
                        <label className={styles.sortControl}>
                            <span className={styles.srOnly}>Sắp xếp truyện</span>
                            <select
                                value={filters.sort}
                                onChange={(event) => updateFilter("sort", event.target.value)}
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {searchValue.trim().length === 1 && (
                        <p className={styles.searchHint}>Nhập ít nhất 2 ký tự để tìm.</p>
                    )}

                    <div className={styles.toolbar}>
                        <p><strong>{totalCount.toLocaleString("vi-VN")}</strong> truyện phù hợp</p>
                    </div>
                    <div className={styles.activeFilters}>
                        {filters.q && (
                            <span className={styles.activeChip}>
                                Tên: {filters.q}
                                <button type="button" onClick={() => {
                                    setSearchValue("");
                                    updateFilter("q", "");
                                }} aria-label="Xóa từ khóa"><XMarkIcon /></button>
                            </span>
                        )}
                        {activeFilters.map(([key, value]) => (
                            <span className={styles.activeChip} key={key}>
                                {labelMap.get(value) ?? value}
                                <button type="button" onClick={() => updateFilter(key, "")} aria-label={`Xóa ${labelMap.get(value) ?? value}`}><XMarkIcon /></button>
                            </span>
                        ))}
                    </div>

                    <div className={styles.storyList} aria-live="polite">
                        {query.isPending ? (
                            <StorySkeleton count={5} />
                        ) : query.isError ? (
                            <div className={styles.statePanel}>
                                <strong>Không thể tải danh sách truyện</strong>
                                <span>{query.error.message}</span>
                                <button type="button" onClick={() => query.refetch()}>Thử lại</button>
                            </div>
                        ) : stories.length === 0 ? (
                            <div className={styles.statePanel}>
                                <strong>Không có truyện phù hợp</strong>
                                <span>Thử bỏ bớt điều kiện lọc hoặc đổi từ khóa.</span>
                                <button type="button" onClick={clearAll}>Xóa bộ lọc</button>
                            </div>
                        ) : (
                            stories.map((story) => <StoryCard key={story.id} story={story} />)
                        )}
                        {query.isFetchingNextPage && <StorySkeleton count={3} />}
                    </div>

                    <div ref={sentinelRef} className={styles.loadMoreArea}>
                        {query.hasNextPage && (
                            <button
                                type="button"
                                disabled={query.isFetchingNextPage}
                                onClick={() => query.fetchNextPage()}
                            >
                                {query.isFetchingNextPage ? "Đang tải" : "Xem thêm"}
                            </button>
                        )}
                    </div>
                </section>
            </div>

            <div
                className={`${styles.mobileBackdrop} ${mobileOpen ? styles.mobileBackdropOpen : ""}`}
                onClick={() => setMobileOpen(false)}
            />
            <aside
                className={`${styles.mobileDrawer} ${mobileOpen ? styles.mobileDrawerOpen : ""}`}
                aria-hidden={!mobileOpen}
                aria-label="Bộ lọc truyện trên di động"
            >
                <div className={styles.drawerTitle}>
                    <strong>Bộ lọc truyện</strong>
                    <button type="button" onClick={() => setMobileOpen(false)} aria-label="Đóng bộ lọc"><XMarkIcon /></button>
                </div>
                <FilterPanel
                    filterGroups={filterGroups}
                    filters={mobileDraft}
                    onChange={(key, value) => setMobileDraft((current) => ({ ...current, [key]: value }))}
                    onClear={() => setMobileDraft(canonicalizeCatalogFilters({}))}
                />
                <div className={styles.drawerActions}>
                    <button type="button" onClick={() => setMobileOpen(false)}>Hủy</button>
                    <button type="button" onClick={() => {
                        commitFilters(mobileDraft);
                        setSearchValue(mobileDraft.q);
                        setMobileOpen(false);
                    }}>Áp dụng</button>
                </div>
            </aside>
        </div>
    );
}
