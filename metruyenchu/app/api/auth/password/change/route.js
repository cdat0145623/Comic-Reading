import {
    checkAuthRateLimit,
    clearAuthFailures,
    createRateLimitKey,
    recordAuthFailure,
} from "@/app/_lib/auth-rate-limit";
import { ChangePasswordSchema } from "@/app/_lib/validate";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const parsed = ChangePasswordSchema.safeParse(
        await request.json().catch(() => ({})),
    );
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
            { status: 400 },
        );
    }

    const key = createRateLimitKey({
        scope: "password-change",
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

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { password: true },
    });
    if (!user?.password) {
        return NextResponse.json(
            { error: "Tài khoản Google chưa hỗ trợ tạo mật khẩu trong phase này." },
            { status: 409 },
        );
    }

    const matches = await bcrypt.compare(parsed.data.currentPassword, user.password);
    if (!matches) {
        await recordAuthFailure(key);
        return NextResponse.json(
            { error: "Mật khẩu hiện tại không chính xác" },
            { status: 400 },
        );
    }
    if (await bcrypt.compare(parsed.data.password, user.password)) {
        return NextResponse.json(
            { error: "Mật khẩu mới phải khác mật khẩu hiện tại" },
            { status: 400 },
        );
    }

    const password = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction([
        prisma.user.update({
            where: { id: session.user.id },
            data: {
                password,
                authVersion: { increment: 1 },
            },
        }),
        prisma.userAuthToken.deleteMany({
            where: {
                userId: session.user.id,
                type: "PASSWORD_RESET",
                usedAt: null,
            },
        }),
    ]);
    await clearAuthFailures(key);
    return NextResponse.json({
        success: true,
        reason: "password-changed",
    });
}
