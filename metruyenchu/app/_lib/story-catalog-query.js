const STORY_CATALOG_PAGE_SIZE = 20;
const STORY_CATALOG_MAX_PAGE_SIZE = 40;
const STORY_CATALOG_STALE_TIME = 30 * 1000;
const STORY_CATALOG_GC_TIME = 10 * 60 * 1000;

const STORY_CATALOG_SORTS = ["updated", "rating", "reads", "chapters"];
const STORY_CATALOG_FILTER_KEYS = [
    "q",
    "sort",
    "status",
    "genre",
    "type",
    "attribute",
    "chapters",
    "personality",
    "world",
    "style",
];

const STORY_CATALOG_TAG_GROUPS = {
    status: "tinh-trang",
    genre: "the-loai",
    type: "loai",
    attribute: "thuoc-tinh",
    personality: "tinh-cach-nhan-vat-chinh",
    world: "boi-canh-the-gioi",
    style: "luu-phai",
};

const STORY_CATALOG_FILTER_BY_TAG_GROUP = Object.fromEntries(
    Object.entries(STORY_CATALOG_TAG_GROUPS).map(([filterKey, groupSlug]) => [
        groupSlug,
        filterKey,
    ]),
);

const STORY_CATALOG_CHAPTER_RANGES = {
    short: { lt: 300 },
    medium: { gte: 300, lt: 600 },
    long: { gte: 600, lte: 1000 },
    epic: { gt: 1000 },
};

function readParam(source, key) {
    if (source instanceof URLSearchParams) return source.get(key);
    const value = source?.[key];
    return Array.isArray(value) ? value[0] : value;
}

function sanitizeSlug(value) {
    const text = String(value ?? "").trim().toLowerCase();
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text) ? text : "";
}

function canonicalizeCatalogFilters(source = {}) {
    const q = String(readParam(source, "q") ?? "").trim().slice(0, 80);
    const requestedSort = readParam(source, "sort");
    const filters = {
        q: q.length >= 2 ? q : "",
        sort: STORY_CATALOG_SORTS.includes(requestedSort)
            ? requestedSort
            : "updated",
    };

    for (const key of Object.keys(STORY_CATALOG_TAG_GROUPS)) {
        filters[key] = sanitizeSlug(readParam(source, key));
    }

    const chapters = readParam(source, "chapters");
    filters.chapters = STORY_CATALOG_CHAPTER_RANGES[chapters]
        ? chapters
        : "";

    return filters;
}

function buildCatalogSearchParams(filters, extra = {}) {
    const canonical = canonicalizeCatalogFilters(filters);
    const params = new URLSearchParams();

    for (const key of STORY_CATALOG_FILTER_KEYS) {
        const value = canonical[key];
        if (!value || (key === "sort" && value === "updated")) continue;
        params.set(key, value);
    }

    for (const [key, value] of Object.entries(extra)) {
        if (value !== undefined && value !== null && value !== "") {
            params.set(key, String(value));
        }
    }

    return params;
}

function getCatalogHrefForTag(tag) {
    const filterKey = STORY_CATALOG_FILTER_BY_TAG_GROUP[tag?.group?.slug];
    const tagSlug = sanitizeSlug(tag?.slug);
    if (!filterKey || !tagSlug) return "/kham-pha";

    return `/kham-pha?${filterKey}=${encodeURIComponent(tagSlug)}`;
}

const storyCatalogKeys = {
    all: ["storyCatalog"],
    list: (filters) => [
        ...storyCatalogKeys.all,
        canonicalizeCatalogFilters(filters),
    ],
};

export {
    STORY_CATALOG_CHAPTER_RANGES,
    STORY_CATALOG_FILTER_KEYS,
    STORY_CATALOG_GC_TIME,
    STORY_CATALOG_MAX_PAGE_SIZE,
    STORY_CATALOG_PAGE_SIZE,
    STORY_CATALOG_SORTS,
    STORY_CATALOG_STALE_TIME,
    STORY_CATALOG_TAG_GROUPS,
    buildCatalogSearchParams,
    canonicalizeCatalogFilters,
    getCatalogHrefForTag,
    storyCatalogKeys,
};
