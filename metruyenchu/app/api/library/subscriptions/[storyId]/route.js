import { setStorySubscription } from "@/app/_lib/library-service";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PUT(request, { params }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }
    const { enabled } = await request.json();
    if (typeof enabled !== "boolean") {
        return NextResponse.json({ message: "Trạng thái không hợp lệ" }, { status: 400 });
    }
    const { storyId } = await params;
    const numericStoryId = Number(storyId);
    if (!Number.isInteger(numericStoryId)) {
        return NextResponse.json({ message: "Truyện không hợp lệ" }, { status: 400 });
    }
    try {
        const subscribed = await setStorySubscription({
            userId: session.user.id,
            storyId: numericStoryId,
            enabled,
        });
        return NextResponse.json({ success: true, subscribed });
    } catch (error) {
        console.error("Failed to update story subscription", error);
        return NextResponse.json({ message: "Không thể cập nhật thông báo" }, { status: 500 });
    }
}
