import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { getStoryCatalog } from "@/app/_lib/story-catalog-service";

const describeDatabase = process.env.RUN_DB_INTEGRATION === "1" ? describe : describe.skip;

describeDatabase("story catalog PostgreSQL integration", () => {
    afterAll(() => prisma.$disconnect());

    it("uses persistent fixture data", async () => {
        const count = await prisma.story.count({
            where: { slug: { startsWith: "catalog-fixture-" } },
        });
        expect(count).toBeGreaterThanOrEqual(48);
    });

    it("combines accent-insensitive search and tag groups", async () => {
        const result = await getStoryCatalog({
            filters: {
                q: "hanh trinh tinh ha",
                genre: "tien-hiep",
                status: "con-tiep",
            },
            pageSize: 40,
        });

        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items.every((story) => story.genre?.slug === "tien-hiep")).toBe(true);
        expect(result.items.every((story) => story.status?.slug === "con-tiep")).toBe(true);
    });

    it("filters numeric chapter boundaries instead of chapter tags", async () => {
        const [short, medium, long, epic] = await Promise.all(
            ["short", "medium", "long", "epic"].map((chapters) =>
                getStoryCatalog({
                    filters: { q: "demo lọc", chapters },
                    pageSize: 40,
                }),
            ),
        );

        expect(short.items.every((story) => story.totalChapters < 300)).toBe(true);
        expect(
            medium.items.every(
                (story) => story.totalChapters >= 300 && story.totalChapters < 600,
            ),
        ).toBe(true);
        expect(
            long.items.every(
                (story) => story.totalChapters >= 600 && story.totalChapters <= 1000,
            ),
        ).toBe(true);
        expect(epic.items.every((story) => story.totalChapters > 1000)).toBe(true);
    });

    it("returns three cursor pages without duplicate stories", async () => {
        const ids = [];
        let cursor = null;

        for (let page = 0; page < 3; page += 1) {
            const result = await getStoryCatalog({
                filters: { q: "demo lọc", sort: "rating" },
                cursor,
                pageSize: 20,
            });
            ids.push(...result.items.map((story) => story.id));
            cursor = result.nextCursor;
        }

        expect(ids).toHaveLength(48);
        expect(new Set(ids).size).toBe(48);
    });

    it.each(["updated", "rating", "reads", "chapters"])(
        "paginates the %s sort with a valid cursor",
        async (sort) => {
            const first = await getStoryCatalog({
                filters: { q: "demo lọc", sort },
                pageSize: 20,
            });
            const second = await getStoryCatalog({
                filters: { q: "demo lọc", sort },
                cursor: first.nextCursor,
                pageSize: 20,
            });

            const firstIds = new Set(first.items.map((story) => story.id));
            expect(second.items).toHaveLength(20);
            expect(second.items.some((story) => firstIds.has(story.id))).toBe(false);
        },
    );

    it("uses manager_pick as the selected-story source", async () => {
        const [result, expected] = await Promise.all([
            getStoryCatalog({
                filters: { q: "demo lọc", attribute: "chon-loc" },
                pageSize: 40,
            }),
            prisma.story.count({
                where: {
                    slug: { startsWith: "catalog-fixture-" },
                    manager_pick: { gt: 0 },
                },
            }),
        ]);

        expect(result.totalCount).toBe(expected);
    });
});
