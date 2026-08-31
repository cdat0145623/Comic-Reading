import { getStoryBookmark, setStoryBookmark } from "@/app/_lib/library-service";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

async function updateBookmark(request, params, enabled) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }
    const { storyId } = await params;
    const numericStoryId = Number(storyId);
    if (!Number.isInteger(numericStoryId)) {
        return NextResponse.json({ message: "Truyện không hợp lệ" }, { status: 400 });
    }
    try {
        const value = await setStoryBookmark({
            userId: session.user.id,
            storyId: numericStoryId,
            enabled,
        });
        return NextResponse.json({ success: true, bookmarked: value });
    } catch (error) {
        console.error("Failed to update story bookmark", error);
        return NextResponse.json({ message: "Không thể cập nhật đánh dấu" }, { status: 500 });
    }
}

export async function GET(_request, { params }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ bookmarked: false });
    }
    const { storyId } = await params;
    const numericStoryId = Number(storyId);
    if (!Number.isInteger(numericStoryId)) {
        return NextResponse.json({ message: "Truyện không hợp lệ" }, { status: 400 });
    }
    try {
        const bookmarked = await getStoryBookmark({
            userId: session.user.id,
            storyId: numericStoryId,
        });
        return NextResponse.json({ bookmarked });
    } catch (error) {
        console.error("Failed to read story bookmark", error);
        return NextResponse.json({ message: "Không thể tải đánh dấu" }, { status: 500 });
    }
}

export async function POST(request, { params }) {
    return updateBookmark(request, params, true);
}

export async function DELETE(request, { params }) {
    return updateBookmark(request, params, false);
}
