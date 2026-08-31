const ACTIVITY_LIST_PAGE_SIZE = 10;
const ACTIVITY_LIST_STALE_TIME = 30 * 1000;
const ACTIVITY_THREAD_PAGE_SIZE = 5;
const ACTIVITY_THREAD_STALE_TIME = 2 * 60 * 1000;

const ratingKeys = {
    all: ["ratings"],
    story: (storyId) => ["ratings", "story", Number(storyId)],
    list: ({ storyId, pageSize, sortOption, isDisplayAll }) => [
        "ratings",
        "story",
        storyId === undefined ? "all" : Number(storyId),
        "list",
        {
            pageSize,
            sortOption,
            isDisplayAll,
        },
    ],
    comments: (ratingId) => ["rating-comments", Number(ratingId)],
};

const discussionKeys = {
    all: ["discussions"],
    story: (storyId) => ["discussions", "story", Number(storyId)],
    lists: (storyId) => [
        ...discussionKeys.story(storyId),
        "list",
    ],
    list: ({ storyId, sortOption }) => [
        ...discussionKeys.lists(storyId),
        sortOption,
    ],
    thread: ({ storyId, rootCommentId }) => [
        "discussions",
        "story",
        Number(storyId),
        "thread",
        Number(rootCommentId),
    ],
};

const activityMutationKeys = {
    rating: (storyId) => ["upsert-story-rating", Number(storyId)],
    rootDiscussion: (storyId) => [
        "create-story-discussion",
        Number(storyId),
    ],
    ratingComment: ({ storyId, ratingId }) => [
        "create-rating-comment",
        Number(storyId),
        Number(ratingId),
    ],
    discussionReply: ({ storyId, rootCommentId }) => [
        "create-discussion-reply",
        Number(storyId),
        Number(rootCommentId),
    ],
};

function getActivityInvalidationKeys(context) {
    switch (context?.domain) {
        case "rating":
            return [ratingKeys.story(context.storyId), ratingKeys.all];
        case "rating-comment":
            return [
                ratingKeys.comments(context.ratingId),
                ratingKeys.story(context.storyId),
            ];
        case "root-discussion":
            return [discussionKeys.lists(context.storyId)];
        case "discussion-reply":
            return [
                discussionKeys.thread({
                    storyId: context.storyId,
                    rootCommentId: context.rootCommentId,
                }),
                discussionKeys.lists(context.storyId),
            ];
        default:
            return [];
    }
}

function getRatingListParams(queryKey) {
    const [domain, scope, storyScope, queryType] = queryKey;
    const params = queryKey.at(-1);

    if (
        domain !== "ratings" ||
        scope !== "story" ||
        queryType !== "list" ||
        !params ||
        typeof params !== "object" ||
        (storyScope !== "all" && !Number.isFinite(Number(storyScope)))
    ) {
        throw new Error("Invalid rating list query key");
    }

    return {
        ...params,
        ...(storyScope !== "all" ? { storyId: Number(storyScope) } : {}),
    };
}

function getDiscussionListParams(queryKey) {
    const [domain, scope, storyId, queryType, sortOption] = queryKey;

    if (
        domain !== "discussions" ||
        scope !== "story" ||
        queryType !== "list" ||
        !Number.isFinite(Number(storyId))
    ) {
        throw new Error("Invalid discussion list query key");
    }

    return {
        storyId: Number(storyId),
        sortOption,
    };
}

export {
    ACTIVITY_LIST_PAGE_SIZE,
    ACTIVITY_LIST_STALE_TIME,
    ACTIVITY_THREAD_PAGE_SIZE,
    ACTIVITY_THREAD_STALE_TIME,
    activityMutationKeys,
    discussionKeys,
    getActivityInvalidationKeys,
    getDiscussionListParams,
    getRatingListParams,
    ratingKeys,
};
