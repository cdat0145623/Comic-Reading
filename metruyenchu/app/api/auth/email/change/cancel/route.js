import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
    }

    await prisma.userAuthToken.deleteMany({
        where: {
            userId: session.user.id,
            type: "EMAIL_CHANGE",
            usedAt: null,
        },
    });
    return NextResponse.json({ success: true, message: "Đã hủy yêu cầu đổi email." });
}
