import { getUserLibraryPage } from "@/app/_lib/library-service";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    try {
        const data = await getUserLibraryPage({
            userId: session.user.id,
            tab: searchParams.get("tab"),
            page: searchParams.get("page"),
            sort: searchParams.get("sort"),
        });
        return NextResponse.json(data);
    } catch (error) {
        console.error("Failed to fetch user library", error);
        return NextResponse.json(
            { message: "Không thể tải Tủ truyện" },
            { status: 500 },
        );
    }
}
