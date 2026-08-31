import { normalizeSearchText } from "@/app/_lib/search";
import { searchStories } from "@/app/_lib/story-search-service";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() ?? "";
    const requestedLimit = Number(searchParams.get("limit") ?? 5);
    const limit = Number.isFinite(requestedLimit)
        ? Math.min(Math.max(Math.trunc(requestedLimit), 1), 5)
        : 5;

    if (query.length < 2 || query.length > 80) {
        return NextResponse.json(
            {
                message: "Từ khóa tìm kiếm phải có từ 2 đến 80 ký tự.",
            },
            { status: 400 },
        );
    }

    try {
        const items = await searchStories(query, limit);

        return NextResponse.json({
            query: normalizeSearchText(query),
            items,
        });
    } catch (error) {
        console.error("Failed to search stories", error);

        return NextResponse.json(
            {
                message: "Không thể tìm kiếm truyện lúc này.",
            },
            { status: 500 },
        );
    }
}
