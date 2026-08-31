import { hideReadingStory } from "@/app/_lib/library-service";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function DELETE(_request, { params }) {
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
        const hidden = await hideReadingStory({
            userId: session.user.id,
            storyId: numericStoryId,
        });
        return NextResponse.json({ success: true, hidden });
    } catch (error) {
        console.error("Failed to hide reading story", error);
        return NextResponse.json({ message: "Không thể cập nhật danh sách" }, { status: 500 });
    }
}
