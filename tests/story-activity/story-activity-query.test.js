import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    activityMutationKeys,
    discussionKeys,
    getActivityInvalidationKeys,
    getDiscussionListParams,
    getRatingListParams,
    ratingKeys,
} from "@/app/_lib/story-activity-query";
import { fetchRatingsByKey } from "@/app/_lib/helper";

const { fetchRatingsMock } = vi.hoisted(() => ({
    fetchRatingsMock: vi.fn(),
}));

vi.mock("@/app/_lib/api", () => ({
    fetchRatings: fetchRatingsMock,
}));

beforeEach(() => {
    fetchRatingsMock.mockReset();
});

describe("story activity query parsers", () => {
    it("keeps the story scope when parsing a rating list key", () => {
        const queryKey = ratingKeys.list({
            storyId: 90,
            pageSize: 10,
            sortOption: "mostLiked",
            isDisplayAll: false,
        });

        expect(getRatingListParams(queryKey)).toEqual({
            storyId: 90,
            pageSize: 10,
            sortOption: "mostLiked",
            isDisplayAll: false,
        });
    });

    it("omits storyId for the global rating list", () => {
        const queryKey = ratingKeys.list({
            pageSize: 4,
            sortOption: "newest",
            isDisplayAll: false,
        });

        expect(getRatingListParams(queryKey)).toEqual({
            pageSize: 4,
            sortOption: "newest",
            isDisplayAll: false,
        });
    });

    it("parses the discussion story and sort option", () => {
        const queryKey = discussionKeys.list({
            storyId: 90,
            sortOption: "oldest",
        });

        expect(getDiscussionListParams(queryKey)).toEqual({
            storyId: 90,
            sortOption: "oldest",
        });
        expect(discussionKeys.lists(90)).toEqual([
            "discussions",
            "story",
            90,
            "list",
        ]);
    });

    it("rejects keys from another query domain", () => {
        expect(() =>
            getDiscussionListParams(["ratings", "story", 90, "list", "newest"]),
        ).toThrow("Invalid discussion list query key");
    });

    it("scopes create mutations to their exact activity owner", () => {
        expect(activityMutationKeys.rating(90)).toEqual([
            "upsert-story-rating",
            90,
        ]);
        expect(activityMutationKeys.rootDiscussion(90)).toEqual([
            "create-story-discussion",
            90,
        ]);
        expect(
            activityMutationKeys.ratingComment({ storyId: 90, ratingId: 12 }),
        ).toEqual(["create-rating-comment", 90, 12]);
        expect(
            activityMutationKeys.discussionReply({
                storyId: 90,
                rootCommentId: 33,
            }),
        ).toEqual(["create-discussion-reply", 90, 33]);
    });

    it("maps committed events to their canonical query scopes", () => {
        expect(
            getActivityInvalidationKeys({
                domain: "discussion-reply",
                rootCommentId: 12,
                storyId: 90,
            }),
        ).toEqual([
            ["discussions", "story", 90, "thread", 12],
            ["discussions", "story", 90, "list"],
        ]);
        expect(
            getActivityInvalidationKeys({
                domain: "rating-comment",
                ratingId: 7,
                storyId: 90,
            }),
        ).toEqual([
            ["rating-comments", 7],
            ["ratings", "story", 90],
        ]);
    });

    it("forwards storyId when the client refetches a rating list", async () => {
        const queryKey = ratingKeys.list({
            storyId: 90,
            pageSize: 10,
            sortOption: "newest",
            isDisplayAll: true,
        });
        fetchRatingsMock.mockResolvedValue({ ratings: [] });

        await fetchRatingsByKey({ queryKey, pageParam: null });

        expect(fetchRatingsMock).toHaveBeenCalledWith({
            storyId: 90,
            pageSize: 10,
            sortOption: "newest",
            isDisplayAll: true,
            paginationCursor: null,
            active: "ratings",
        });
    });
});
