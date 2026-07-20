import { describe, expect, it } from "vitest";
import { buildRatingListWhere } from "@/app/_lib/story-activity-filter";

describe("rating list filter", () => {
    it("filters short ratings in the default view", () => {
        expect(
            buildRatingListWhere({ storyId: 90, isDisplayAll: false }),
        ).toEqual({
            storyId: 90,
            wordCount: { gte: 100 },
        });
    });

    it("includes short and star-only ratings when displaying all", () => {
        expect(
            buildRatingListWhere({ storyId: 90, isDisplayAll: true }),
        ).toEqual({
            storyId: 90,
            wordCount: { gte: 0 },
        });
    });

    it("supports the global rating list without a story filter", () => {
        expect(buildRatingListWhere({ isDisplayAll: false })).toEqual({
            wordCount: { gte: 100 },
        });
    });
});
