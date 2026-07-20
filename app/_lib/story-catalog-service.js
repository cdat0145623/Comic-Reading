import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { normalizeSearchText } from "./search";
import {
    STORY_CATALOG_CHAPTER_RANGES,
    STORY_CATALOG_PAGE_SIZE,
    STORY_CATALOG_TAG_GROUPS,
    canonicalizeCatalogFilters,
} from "./story-catalog-query";

const SORT_FIELDS = {
    updated: { field: "latestChapterAt", relation: null },
    chapters: { field: "totalChapters", relation: null },
    rating: { field: "averageRating", relation: "stats" },
    reads: { field: "totalReads", relation: "stats" },
};

function normalizeCatalogSearch(value) {
    return normalizeSearchText(value).replace(/\s+/g, "-");
}

function encodeCatalogCursor(cursor) {
    return Buffer.from(JSON.stringify({ version: 1, ...cursor })).toString(
        "base64url",
    );
}

function decodeCatalogCursor(value, expectedSort) {
    if (!value) return null;

    try {
        const cursor = JSON.parse(
            Buffer.from(String(value), "base64url").toString("utf8"),
        );
        if (
            cursor.version !== 1 ||
            cursor.sort !== expectedSort ||
            !Number.isInteger(cursor.id) ||
            !(typeof cursor.value === "number" || cursor.value === null)
        ) {
            throw new Error("Invalid catalog cursor");
        }
        return cursor;
    } catch {
        throw new Error("INVALID_CATALOG_CURSOR");
    }
}

function buildTagFilter(groupSlug, tagSlug) {
    return {
        tags: {
            some: {
                slug: tagSlug,
                group: { slug: groupSlug },
            },
        },
    };
}

function buildCatalogWhere(filters, cursor) {
    const conditions = [];

    if (filters.q) {
        const slugQuery = normalizeCatalogSearch(filters.q);
        conditions.push({
            OR: [
                { slug: { contains: slugQuery, mode: "insensitive" } },
                {
                    author: {
                        slug: { contains: slugQuery, mode: "insensitive" },
                    },
                },
            ],
        });
    }

    for (const [key, groupSlug] of Object.entries(
        STORY_CATALOG_TAG_GROUPS,
    )) {
        const value = filters[key];
        if (!value) continue;

        if (key === "attribute" && value === "chon-loc") {
            conditions.push({ manager_pick: { gt: 0 } });
        } else {
            conditions.push(buildTagFilter(groupSlug, value));
        }
    }

    if (filters.chapters) {
        conditions.push({
            totalChapters: STORY_CATALOG_CHAPTER_RANGES[filters.chapters],
        });
    }

    if (cursor) {
        conditions.push(buildCursorWhere(filters.sort, cursor));
    }

    return conditions.length ? { AND: conditions } : {};
}

function buildCursorWhere(sort, cursor) {
    const { field, relation } = SORT_FIELDS[sort];
    const idCondition = { id: { lt: cursor.id } };
    const cursorValue =
        sort === "updated" && cursor.value !== null
            ? new Date(cursor.value)
            : cursor.value;

    if (!relation) {
        if (cursor.value === null) {
            return { AND: [{ [field]: null }, idCondition] };
        }
        return {
            OR: [
                { [field]: { lt: cursorValue } },
                { [field]: null },
                { AND: [{ [field]: cursorValue }, idCondition] },
            ],
        };
    }

    if (cursor.value === null) {
        return { AND: [{ [relation]: { is: null } }, idCondition] };
    }

    return {
        OR: [
            { [relation]: { is: { [field]: { lt: cursorValue } } } },
            { [relation]: { is: null } },
            {
                AND: [
                    { [relation]: { is: { [field]: cursorValue } } },
                    idCondition,
                ],
            },
        ],
    };
}

function getCatalogOrderBy(sort) {
    const { field, relation } = SORT_FIELDS[sort];
    const primary = relation
        ? { [relation]: { [field]: "desc" } }
        : { [field]: { sort: "desc", nulls: "last" } };
    return [primary, { id: "desc" }];
}

function getSortValue(story, sort) {
    if (sort === "updated") {
        return story.latestChapterAt?.getTime?.() ?? null;
    }
    if (sort === "chapters") return story.totalChapters ?? null;
    if (sort === "rating") return story.stats?.averageRating ?? null;
    return story.stats?.totalReads ?? null;
}

function serializeStory(story) {
    const genre = story.tags.find(
        (tag) => tag.group.slug === STORY_CATALOG_TAG_GROUPS.genre,
    );
    const status = story.tags.find(
        (tag) => tag.group.slug === STORY_CATALOG_TAG_GROUPS.status,
    );

    return {
        id: story.id,
        slug: story.slug,
        title: story.title,
        stringUrl: story.stringUrl,
        introduce: story.introduce,
        totalChapters: story.totalChapters ?? 0,
        latestChapterAt: story.latestChapterAt?.toISOString() ?? null,
        author: story.author,
        stats: {
            totalReads: story.stats?.totalReads ?? 0,
            averageRating: story.stats?.averageRating ?? 0,
        },
        genre: genre ? { label: genre.label, slug: genre.slug } : null,
        status: status ? { label: status.label, slug: status.slug } : null,
    };
}

async function getStoryCatalog({
    filters: rawFilters = {},
    cursor: rawCursor = null,
    pageSize = STORY_CATALOG_PAGE_SIZE,
} = {}) {
    const filters = canonicalizeCatalogFilters(rawFilters);
    const cursor = decodeCatalogCursor(rawCursor, filters.sort);
    const where = buildCatalogWhere(filters, cursor);
    const take = Math.max(1, Math.min(Number(pageSize), 40));

    const query = prisma.story.findMany({
        where,
        orderBy: getCatalogOrderBy(filters.sort),
        take: take + 1,
        select: {
            id: true,
            slug: true,
            title: true,
            stringUrl: true,
            introduce: true,
            totalChapters: true,
            latestChapterAt: true,
            author: { select: { name: true, slug: true } },
            stats: {
                select: { totalReads: true, averageRating: true },
            },
            tags: {
                where: {
                    group: {
                        slug: {
                            in: [
                                STORY_CATALOG_TAG_GROUPS.genre,
                                STORY_CATALOG_TAG_GROUPS.status,
                            ],
                        },
                    },
                },
                select: {
                    label: true,
                    slug: true,
                    group: { select: { slug: true } },
                },
            },
        },
    });

    const [rows, totalCount] = await Promise.all([
        query,
        cursor ? Promise.resolve(null) : prisma.story.count({ where }),
    ]);
    const hasMore = rows.length > take;
    const pageRows = hasMore ? rows.slice(0, take) : rows;
    const last = pageRows.at(-1);
    const nextCursor =
        hasMore && last
            ? encodeCatalogCursor({
                  sort: filters.sort,
                  id: last.id,
                  value: getSortValue(last, filters.sort),
              })
            : null;

    return {
        items: pageRows.map(serializeStory),
        nextCursor,
        hasMore,
        totalCount,
    };
}

const getStoryCatalogFilterGroups = unstable_cache(
    async () =>
        prisma.tagGroup.findMany({
            where: { slug: { not: "so-chuong" } },
            orderBy: { id: "asc" },
            select: {
                name: true,
                slug: true,
                tags: {
                    orderBy: { label: "asc" },
                    select: { label: true, slug: true },
                },
            },
        }),
    ["story-catalog-filter-groups-v1"],
    { revalidate: 3600, tags: ["story-catalog-filter-groups"] },
);

export {
    buildCatalogWhere,
    decodeCatalogCursor,
    encodeCatalogCursor,
    getStoryCatalog,
    getStoryCatalogFilterGroups,
    normalizeCatalogSearch,
};
