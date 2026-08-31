import { describe, expect, it } from "vitest";
import { hasMeaningfulActivityDraft } from "@/app/hooks/useActivityDraft";

describe("story activity draft", () => {
    it("does not persist an empty comment or default rating form", () => {
        expect(hasMeaningfulActivityDraft({ content: "   " })).toBe(false);
        expect(
            hasMeaningfulActivityDraft({
                character: "",
                content: "",
                onlyStar: false,
                plot: "",
                stars: 5,
                world: "",
            }),
        ).toBe(false);
    });

    it("persists comment content and changed rating values", () => {
        expect(hasMeaningfulActivityDraft({ content: "Bình luận mới" })).toBe(
            true,
        );
        expect(hasMeaningfulActivityDraft({ stars: 4.5 })).toBe(true);
        expect(hasMeaningfulActivityDraft({ onlyStar: true, stars: 5 })).toBe(
            true,
        );
    });
});
