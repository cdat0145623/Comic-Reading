import { describe, expect, it } from "vitest";
import { getLibraryRowDisplay } from "../../app/_lib/library-display";

describe("library row display", () => {
    it("does not invent reading progress for an unread bookmark", () => {
        expect(
            getLibraryRowDisplay({
                slug: "truyen-a",
                totalChapters: 56,
                latestChapter: { number: 56 },
                lastChapter: null,
            }),
        ).toEqual({
            hasChapters: true,
            hasReadingProgress: false,
            progress: 0,
            readHref: "/truyen/truyen-a/chuong-1",
            readLabel: "Đọc từ đầu",
            readNumber: null,
        });
    });

    it("uses the last read chapter for progress and continue navigation", () => {
        expect(
            getLibraryRowDisplay({
                slug: "truyen-a",
                totalChapters: 56,
                latestChapter: { number: 56 },
                lastChapter: { number: 14 },
            }),
        ).toMatchObject({
            hasReadingProgress: true,
            progress: 25,
            readHref: "/truyen/truyen-a/chuong-14",
            readLabel: "Đọc tiếp",
            readNumber: 14,
        });
    });

    it("does not create a chapter-one link for a story without chapters", () => {
        expect(
            getLibraryRowDisplay({
                slug: "truyen-rong",
                totalChapters: 0,
                latestChapter: null,
                lastChapter: null,
            }),
        ).toMatchObject({
            hasChapters: false,
            readHref: null,
        });
    });
});
