import { getFanStory, getRatings } from "@/app/_lib/data-service";
import { parseNumberParams } from "@/app/_lib/helper-server";
import { NextResponse } from "next/server";
import {
    getRatingComments,
    getStoryDiscussions,
} from "@/app/_lib/story-activity-service";

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

    const pageSize = Math.min(
        Math.max(parseNumberParams(searchParams.get("pageSize"), 20), 1),
        20,
    );

    const isDisplayAll = searchParams.get("isDisplayAll") === "true";

    const rawStoryId = searchParams.get("storyId");

    let ratingId = searchParams.get("ratingId");
    const rawRootCommentId = searchParams.get("rootCommentId");
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
            const { comments, nextCursor } = await getRatingComments(props);
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
            storyId = Number(rawStoryId);
            const rootCommentId = rawRootCommentId
                ? Number(rawRootCommentId)
                : undefined;
            props = { rootCommentId, storyId, ...props };
            const { discuss, nextCursor } = await getStoryDiscussions(props);
            return NextResponse.json({
                success: true,
                discuss,
                nextCursor,
            });
        }
        const { ratings, nextCursor, visibleCount } = await getRatings(props);
        return NextResponse.json({
            success: true,
            ratings,
            nextCursor,
            visibleCount,
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
