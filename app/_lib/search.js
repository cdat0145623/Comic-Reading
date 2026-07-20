function normalizeSearchText(value = "") {
    return String(value)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[đĐ]/g, "d")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");
}

function getStorySearchRank(story, query) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return Number.POSITIVE_INFINITY;

    const title = normalizeSearchText(story.title);
    const authorName = normalizeSearchText(story.author?.name);

    if (title === normalizedQuery) return 0;
    if (title.startsWith(normalizedQuery)) return 1;
    if (title.split(" ").some((word) => word.startsWith(normalizedQuery))) {
        return 2;
    }
    if (title.includes(normalizedQuery)) return 3;
    if (authorName.startsWith(normalizedQuery)) return 4;
    if (authorName.includes(normalizedQuery)) return 5;

    return Number.POSITIVE_INFINITY;
}

function searchStoryCorpus(stories, query, limit = 5) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return [];

    return stories
        .map((story) => ({
            story,
            rank: getStorySearchRank(story, normalizedQuery),
        }))
        .filter(({ rank }) => Number.isFinite(rank))
        .sort(
            (left, right) =>
                left.rank - right.rank ||
                left.story.title.localeCompare(right.story.title, "vi"),
        )
        .slice(0, limit)
        .map(({ story }) => story);
}

function findSearchMatchRange(value, query) {
    const normalizedQuery = normalizeSearchText(query);

    if (!value || !normalizedQuery) return null;

    let normalizedValue = "";
    const sourceIndexes = [];

    Array.from(String(value)).forEach((character, sourceIndex) => {
        const normalizedCharacter = character
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .toLowerCase();

        Array.from(normalizedCharacter).forEach((normalizedPart) => {
            const part = /\s/.test(normalizedPart) ? " " : normalizedPart;

            if (
                part === " " &&
                (!normalizedValue || normalizedValue.endsWith(" "))
            ) {
                return;
            }

            normalizedValue += part;
            sourceIndexes.push(sourceIndex);
        });
    });

    const matchIndex = normalizedValue.indexOf(normalizedQuery);
    if (matchIndex === -1) return null;

    return {
        start: sourceIndexes[matchIndex],
        end: sourceIndexes[matchIndex + normalizedQuery.length - 1] + 1,
    };
}

function filterChapters(chapters, query) {
    const normalizedQuery = normalizeSearchText(query);

    if (!normalizedQuery) return chapters;

    const chapterNumberMatch = normalizedQuery.match(
        /^(?:chuong\s*)?#?\s*(\d+)$/,
    );

    if (chapterNumberMatch) {
        const chapterNumber = Number(chapterNumberMatch[1]);
        return chapters.filter((chapter) => chapter.number === chapterNumber);
    }

    return chapters.filter((chapter) =>
        normalizeSearchText(chapter.name).includes(normalizedQuery),
    );
}

export {
    filterChapters,
    findSearchMatchRange,
    getStorySearchRank,
    normalizeSearchText,
    searchStoryCorpus,
};
