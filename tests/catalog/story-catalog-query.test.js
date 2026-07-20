import { describe, expect, it } from "vitest";
import {
    buildCatalogSearchParams,
    canonicalizeCatalogFilters,
    getCatalogHrefForTag,
    storyCatalogKeys,
} from "@/app/_lib/story-catalog-query";

describe("story catalog query state", () => {
    it("normalizes unsupported values to catalog defaults", () => {
        expect(
            canonicalizeCatalogFilters({
                q: " a ",
                sort: "unknown",
                genre: "Tiên Hiệp",
                chapters: "other",
            }),
        ).toMatchObject({
            q: "",
            sort: "updated",
            genre: "",
            chapters: "",
        });
    });

    it("builds a stable query key from canonical filters", () => {
        const left = storyCatalogKeys.list({
            q: "  thái hư  ",
            genre: "tien-hiep",
        });
        const right = storyCatalogKeys.list({
            genre: "tien-hiep",
            q: "thái hư",
            sort: "updated",
        });

        expect(left).toEqual(right);
    });

    it("omits empty and default values from the URL", () => {
        const params = buildCatalogSearchParams({
            sort: "updated",
            genre: "tien-hiep",
        });

        expect(params.toString()).toBe("genre=tien-hiep");
    });

    it.each([
        ["the-loai", "genre"],
        ["tinh-trang", "status"],
        ["loai", "type"],
        ["thuoc-tinh", "attribute"],
        ["tinh-cach-nhan-vat-chinh", "personality"],
        ["boi-canh-the-gioi", "world"],
        ["luu-phai", "style"],
    ])("maps tag group %s to filter %s", (groupSlug, filterKey) => {
        expect(
            getCatalogHrefForTag({
                slug: "kiem-hiep",
                group: { slug: groupSlug },
            }),
        ).toBe(`/kham-pha?${filterKey}=kiem-hiep`);
    });

    it("falls back to the catalog for unsupported tags", () => {
        expect(
            getCatalogHrefForTag({
                slug: "khong-ro",
                group: { slug: "group-khong-ro" },
            }),
        ).toBe("/kham-pha");
    });
});
