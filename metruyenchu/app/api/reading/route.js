import { getReadingStories } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams?.get("userId");

    if (!userId) return NextResponse.json("undefined");

    try {
        const stories = await getReadingStories(userId);
        return NextResponse.json(stories);
    } catch (e) {
        console.log("Error:", e);
        return NextResponse.json({ message: "Could not find any Story" });
    }
}
