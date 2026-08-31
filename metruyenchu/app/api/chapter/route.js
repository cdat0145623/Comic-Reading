import { getChapterByStorySlugAndNumber } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const number = searchParams.get("number");

    if (!slug || !number) {
        return NextResponse.json(
            { success: false, message: "Missing slug or number" },
            { status: 400 },
        );
    }

    const { story, error } = await getChapterByStorySlugAndNumber({
        slug,
        number,
    });

    if (error) {
        console.log("ERROR at Server Route getChapterDetail", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }

    if (!story?.chapters?.length) {
        return NextResponse.json({ success: false }, { status: 404 });
    }

    return NextResponse.json(story);
}
