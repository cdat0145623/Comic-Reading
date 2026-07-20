import {
    filterChapters,
    findSearchMatchRange,
    normalizeSearchText,
    searchStoryCorpus,
} from "@/app/_lib/search";
import { describe, expect, it } from "vitest";

const stories = [
    {
        id: 1,
        title: "Tụ Bảo Tiên Bồn",
        author: { name: "Hướng Quả Vị Nãi Trà" },
    },
    {
        id: 2,
        title: "Thủ Tự Bạo Quân",
        author: { name: "Bất Tại Ý Trung Nhân" },
    },
    {
        id: 3,
        title: "Mạnh Lên Từ Huyện Lệnh Bắt Đầu",
        author: { name: "Tụ Bảo" },
    },
    {
        id: 4,
        title: "Tụ Bảo",
        author: { name: "Tác Giả Khác" },
    },
];

describe("normalizeSearchText", () => {
    it("normalizes Vietnamese accents, đ and whitespace", () => {
        expect(normalizeSearchText("  Tụ   BẢO Đỉnh  ")).toBe("tu bao dinh");
    });
});

describe("searchStoryCorpus", () => {
    it("finds stories without accents and ranks exact title first", () => {
        const result = searchStoryCorpus(stories, "tu bao", 5);

        expect(result.map((story) => story.id)).toEqual([4, 1, 2, 3]);
    });

    it("limits results", () => {
        expect(searchStoryCorpus(stories, "tu", 2)).toHaveLength(2);
    });
});

describe("findSearchMatchRange", () => {
    it("maps an accent-insensitive match back to the original text", () => {
        const value = "Tụ Bảo Tiên Bồn";
        const range = findSearchMatchRange(value, "tu bao");

        expect(value.slice(range.start, range.end)).toBe("Tụ Bảo");
    });
});

describe("filterChapters", () => {
    const chapters = [
        { id: 1, number: 12, name: "Khởi đầu hành trình" },
        { id: 2, number: 53, name: "Tụ Bảo xuất thế" },
        { id: 3, number: 105, name: "Vô Tội Phân Phối Linh Hành" },
    ];

    it.each(["53", "chương 53", "chuong #53"])(
        "finds an exact chapter number from %s",
        (query) => {
            expect(filterChapters(chapters, query)).toEqual([chapters[1]]);
        },
    );

    it("finds a chapter name without accents", () => {
        expect(filterChapters(chapters, "vo toi")).toEqual([chapters[2]]);
    });
});
