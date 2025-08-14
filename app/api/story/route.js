import { getChaptersByStoryId, getStoryBySlug } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const storyId = searchParams?.get("storyId");
    const slug = searchParams.get("slug");
    let story;
    let chapters;
    try {
        if (slug) {
            story = await getStoryBySlug(slug);
        } else {
            chapters = await getChaptersByStoryId(storyId);
        }
        return NextResponse.json(chapters ?? story);
    } catch (error) {
        console.log("ERROR at Server Route getChaptersByStoryId", error);
        return NextResponse.json(
            {
                success: false,
            },
            { status: 500 }
        );
    }
}
