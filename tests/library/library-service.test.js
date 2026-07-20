import { describe, expect, it } from "vitest";
import { normalizeLibraryParams } from "../../app/_lib/library-service";
import { libraryKeys } from "../../app/_lib/library-query";

describe("library params", () => {
    it("uses stable defaults for the reading tab", () => {
        expect(normalizeLibraryParams({})).toEqual({
            tab: "reading",
            page: 1,
            pageSize: 10,
            sort: "recent",
        });
    });

    it("normalizes bookmarked pagination and sort", () => {
        expect(
            normalizeLibraryParams({
                tab: "bookmarked",
                page: "3",
                sort: "title",
            }),
        ).toEqual({
            tab: "bookmarked",
            page: 3,
            pageSize: 10,
            sort: "title",
        });
    });

    it("rejects a sort that belongs to the other tab", () => {
        expect(
            normalizeLibraryParams({
                tab: "bookmarked",
                page: -2,
                sort: "recent",
            }),
        ).toMatchObject({ page: 1, sort: "saved" });
    });
});

describe("library query keys", () => {
    it("scopes list data by user and controls", () => {
        expect(
            libraryKeys.list({
                userId: "user-1",
                tab: "reading",
                page: 2,
                sort: "chapter",
            }),
        ).toEqual([
            "library",
            "user-1",
            "list",
            { tab: "reading", page: 2, sort: "chapter" },
        ]);
    });
});
