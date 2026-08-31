import { NextResponse } from "next/server";
import { z } from "zod";
import {
    getStoryCatalog,
    getStoryCatalogFilterGroups,
} from "@/app/_lib/story-catalog-service";
import {
    STORY_CATALOG_MAX_PAGE_SIZE,
    STORY_CATALOG_SORTS,
    canonicalizeCatalogFilters,
} from "@/app/_lib/story-catalog-query";

const requestSchema = z.object({
    q: z.string().max(80).optional(),
    sort: z.enum(STORY_CATALOG_SORTS).optional(),
    status: z.string().regex(/^[a-z0-9-]+$/).optional(),
    genre: z.string().regex(/^[a-z0-9-]+$/).optional(),
    type: z.string().regex(/^[a-z0-9-]+$/).optional(),
    attribute: z.string().regex(/^[a-z0-9-]+$/).optional(),
    chapters: z.enum(["short", "medium", "long", "epic"]).optional(),
    personality: z.string().regex(/^[a-z0-9-]+$/).optional(),
    world: z.string().regex(/^[a-z0-9-]+$/).optional(),
    style: z.string().regex(/^[a-z0-9-]+$/).optional(),
    cursor: z.string().max(500).optional(),
    limit: z.coerce.number().int().min(1).max(STORY_CATALOG_MAX_PAGE_SIZE).optional(),
});

export async function GET(request) {
    const raw = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = requestSchema.safeParse(raw);

    if (!parsed.success) {
        return NextResponse.json(
            { message: "Bộ lọc truyện không hợp lệ." },
            { status: 400 },
        );
    }

    const query = parsed.data.q?.trim() ?? "";
    if (query.length === 1) {
        return NextResponse.json(
            { message: "Từ khóa tìm kiếm cần ít nhất 2 ký tự." },
            { status: 400 },
        );
    }

    try {
        const groups = await getStoryCatalogFilterGroups();
        const allowedTags = new Set(
            groups.flatMap((group) => group.tags.map((tag) => tag.slug)),
        );
        const requestedTags = [
            parsed.data.status,
            parsed.data.genre,
            parsed.data.type,
            parsed.data.attribute,
            parsed.data.personality,
            parsed.data.world,
            parsed.data.style,
        ].filter(Boolean);
        if (requestedTags.some((slug) => !allowedTags.has(slug))) {
            return NextResponse.json(
                { message: "Tag lọc truyện không tồn tại." },
                { status: 400 },
            );
        }

        const result = await getStoryCatalog({
            filters: canonicalizeCatalogFilters(parsed.data),
            cursor: parsed.data.cursor,
            pageSize: parsed.data.limit,
        });
        return NextResponse.json(result, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        if (error?.message === "INVALID_CATALOG_CURSOR") {
            return NextResponse.json(
                { message: "Vị trí tải tiếp không hợp lệ." },
                { status: 400 },
            );
        }
        console.error("Failed to load story catalog", error);
        return NextResponse.json(
            { message: "Không thể tải danh sách truyện lúc này." },
            { status: 500 },
        );
    }
}
