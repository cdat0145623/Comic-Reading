import { fetchRatings } from "./api";

const parseNumberParams = (value, fallback) => {
    const num = Number(value);
    return isNaN(num) ? fallback : num;
};

const parseBooleanParams = (value) => {
    return value === "true";
};

const fetchRatingsByKey = ({ queryKey, pageParam }) => {
    const [key, params] = queryKey;

    return fetchRatings({
        ...params,
        paginationCursor: pageParam,
        active: key,
    });
};

function getRatingsQueryKey({ storyId, pageSize, sortOption, isDisplayAll }) {
    return ["ratings", { storyId, pageSize, sortOption, isDisplayAll }];
}

function unwrapOrderByEntry(entry) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
        throw new Error("unwrapOrderByEntry: entry must be a plain object");
    }

    const entries = Object.entries(entry);
    if (entries.length !== 1) {
        throw new Error("unwrapOrderByEntry: entry must have only one key");
    }

    const [key, value] = entries[0];

    if (typeof value === "string") {
        return {
            path: [key],
            direction: value,
        };
    }

    if (typeof value === "object" && !Array.isArray(value)) {
        const nested = unwrapOrderByEntry(value);
        return {
            path: [key, ...nested.path],
            direction: nested.direction,
        };
    }

    throw new Error("unwrapOrderByEntry: invalid value type");
}

function buildCursorFilter(cursor, orderBy) {
    if (!cursor || !orderBy?.length) return {};

    const buildConditions = (level = 0, prevEqual = {}) => {
        const currentField = orderBy[level];
        const [fieldName, direction] = Object.entries(currentField)[0]; // ✅ chính xác
        const operator = direction === "asc" ? "gt" : "lt";

        const currentValue = cursor[fieldName];

        const condition = {
            ...prevEqual,
            [fieldName]: { [operator]: currentValue },
        };

        if (level + 1 < orderBy.length) {
            const nextEqual = {
                ...prevEqual,
                [fieldName]: currentValue,
            };
            return {
                OR: [condition, buildConditions(level + 1, nextEqual)],
            };
        }

        return condition;
    };

    return buildConditions(0);
}

function createCursorFromItem(item, orderBy) {
    const cursor = {};
    for (const field of orderBy) {
        const key = Object.keys(field)[0];
        cursor[key] = item[key];
    }
    return cursor;
}

export {
    parseBooleanParams,
    parseNumberParams,
    fetchRatingsByKey,
    getRatingsQueryKey,
    buildCursorFilter,
    createCursorFromItem,
};
