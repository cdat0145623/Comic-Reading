import { recordChapterRead } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { storyId, chapterId } = await req.json();

    if (!storyId || !chapterId) {
        return NextResponse.json(
            { success: false, message: "Missing storyId or chapterId" },
            { status: 400 },
        );
    }

    const { read, error } = await recordChapterRead({ storyId, chapterId });

    if (error) {
        console.log("ERROR at Server Route recordChapterRead", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }

    return NextResponse.json({ success: true, read });
}
