import { getTopStoriesRead } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const minutes = parseInt(searchParams?.get("minutes") || "15", 10);
    const limit = parseInt(searchParams?.get("limit") || "10", 10);

    try {
        const topStories = await getTopStoriesRead(minutes, limit);

        return NextResponse.json({
            success: true,
            data: topStories.map(({ story, ...rest }) => ({
                ...rest,
                title: story.title,
                author: story.author.name,
                totalChapters: story.totalChapters,
                stringUrl: story.stringUrl,
                introduce: story.introduce,
                tag: story.tags.find((tag) => tag.groupId === 5)?.label,
            })),
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            {
                success: false,
            },
            { status: 500 }
        );
    }
}
