import { getFanStory, getRatings } from "@/app/_lib/data-service";
import { parseNumberParams } from "@/app/_lib/helper-server";
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
    const { active } = await params;
    console.log("active::", active);
    const { searchParams } = new URL(request.url);
    console.log("SearchParams:::", searchParams);

    const sortOption = searchParams.get("sortOption") || "newest";
    const rawPaginationCursor = searchParams.get("paginationCursor");
    const paginationCursor = rawPaginationCursor
        ? JSON.parse(rawPaginationCursor)
        : undefined;

    const pageSize = parseNumberParams(searchParams.get("pageSize"), 20);

    const isDisplayAll = searchParams.get("isDisplayAll") === "true";

    const rawStoryId = searchParams.get("storyId");

    let ratingId = searchParams.get("ratingId");
    let storyId;
    storyId =
        rawStoryId === null || rawStoryId === "false"
            ? undefined
            : Number(rawStoryId);

    let props = { active, sortOption, pageSize };
    if (paginationCursor) props = { ...props, paginationCursor };

    try {
        if (ratingId && active === "ratings") {
            ratingId = Number(ratingId);
            props = { ratingId, ...props };
            const { comments, nextCursor } = await getRatings(props);
            return NextResponse.json({
                success: true,
                comments,
                nextCursor,
            });
        }
        if (rawStoryId && active === "ratings") {
            console.log("have storyId:", rawStoryId);
            storyId =
                rawStoryId === null || rawStoryId === "false"
                    ? undefined
                    : Number(rawStoryId);

            props = { storyId, isDisplayAll, ...props };
        }
        if (active === "fans") {
            const top = await getFanStory(storyId);
            return NextResponse.json({
                success: true,
                top,
            });
        }
        if (active === "comments") {
            ratingId = Number(ratingId);
            storyId = Number(rawStoryId);
            props = { ratingId, storyId, ...props };
            const { discuss, nextCursor } = await getRatings(props);
            return NextResponse.json({
                success: true,
                discuss,
                nextCursor,
            });
        }
        const { ratings, nextCursor, count } = await getRatings(props);
        return NextResponse.json({
            success: true,
            ratings,
            nextCursor,
            count,
        });
    } catch (e) {
        console.log("Server API Error:::", e);
        return NextResponse.json(
            {
                success: false,
            },
            {
                status: 500,
            },
            {
                message: "Loi tai Server API",
            }
        );
    }
}
