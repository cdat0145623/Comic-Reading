import { issueEmailChangeVerification } from "@/app/_lib/auth-email-service";
import {
    checkAuthRateLimit,
    createRateLimitKey,
    recordAuthFailure,
} from "@/app/_lib/auth-rate-limit";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const key = createRateLimitKey({
        scope: "email-change-resend",
        identifier: session.user.id,
        request,
    });
    const state = await checkAuthRateLimit(key);
    if (!state.allowed) {
        return NextResponse.json(
            { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
            { status: 429 },
        );
    }
    await recordAuthFailure(key, 3);

    const pending = await prisma.userAuthToken.findFirst({
        where: {
            userId: session.user.id,
            type: "EMAIL_CHANGE",
            usedAt: null,
            expiresAt: { gt: new Date() },
            targetEmail: { not: null },
        },
        orderBy: { createdAt: "desc" },
        select: { targetEmail: true },
    });
    if (!pending?.targetEmail) {
        return NextResponse.json(
            { error: "Không có yêu cầu đổi email đang chờ" },
            { status: 404 },
        );
    }

    try {
        const delivery = await issueEmailChangeVerification({
            userId: session.user.id,
            email: pending.targetEmail,
        });
        if (!delivery.sent) throw new Error("Email delivery failed");
        return NextResponse.json({
            success: true,
            message: "Đã gửi lại liên kết xác nhận.",
        });
    } catch (error) {
        console.error("[auth] Không thể gửi lại email đổi địa chỉ", error);
        return NextResponse.json(
            { error: "Không thể gửi lại email xác nhận lúc này" },
            { status: 503 },
        );
    }
}
