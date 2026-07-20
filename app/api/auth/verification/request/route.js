import { issueVerificationEmail } from "@/app/_lib/auth-email-service";
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
        return NextResponse.json({ error: "Bạn chưa đăng nhập" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, emailVerified: true },
    });
    if (!user?.email) {
        return NextResponse.json({ error: "Tài khoản chưa có email" }, { status: 400 });
    }
    if (user.emailVerified) {
        return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const key = createRateLimitKey({
        scope: "verification-email",
        identifier: user.id,
        request,
    });
    const state = await checkAuthRateLimit(key);
    if (!state.allowed) {
        return NextResponse.json(
            { error: "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau." },
            { status: 429, headers: { "Retry-After": String(state.retryAfter) } },
        );
    }
    await recordAuthFailure(key, 3);

    const result = await issueVerificationEmail(user);
    if (!result.sent) {
        return NextResponse.json(
            { error: "Dịch vụ email chưa được cấu hình" },
            { status: 503 },
        );
    }
    return NextResponse.json({ success: true });
}
