function buildRatingListWhere({ storyId, isDisplayAll }) {
    return {
        ...(storyId !== undefined ? { storyId: Number(storyId) } : {}),
        wordCount: {
            gte: isDisplayAll ? 0 : 100,
        },
    };
}

export { buildRatingListWhere };
