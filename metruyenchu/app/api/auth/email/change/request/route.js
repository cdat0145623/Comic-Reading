import { issueEmailChangeVerification } from "@/app/_lib/auth-email-service";
import {
    checkAuthRateLimit,
    clearAuthFailures,
    createRateLimitKey,
    recordAuthFailure,
} from "@/app/_lib/auth-rate-limit";
import { ChangeEmailSchema } from "@/app/_lib/validate";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Bạn cần đăng nhập" }, { status: 401 });
    }

    const parsed = ChangeEmailSchema.safeParse(
        await request.json().catch(() => ({})),
    );
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
            { status: 400 },
        );
    }

    const rateLimitKey = createRateLimitKey({
        scope: "email-change",
        identifier: session.user.id,
        request,
    });
    const rateLimit = await checkAuthRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
            { status: 429 },
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, password: true },
    });
    if (!user?.password) {
        return NextResponse.json(
            { error: "Tài khoản Google chưa thể đổi email trong phase này." },
            { status: 409 },
        );
    }

    const passwordMatches = await compare(
        parsed.data.currentPassword,
        user.password,
    );
    if (!passwordMatches) {
        await recordAuthFailure(rateLimitKey);
        return NextResponse.json(
            { error: "Mật khẩu hiện tại không chính xác" },
            { status: 400 },
        );
    }

    if (user.email?.toLowerCase() === parsed.data.email) {
        return NextResponse.json(
            { error: "Email mới phải khác email hiện tại" },
            { status: 400 },
        );
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            email: { equals: parsed.data.email, mode: "insensitive" },
            id: { not: user.id },
        },
        select: { id: true },
    });
    if (existingUser) {
        return NextResponse.json(
            { error: "Email này đã được sử dụng" },
            { status: 409 },
        );
    }

    try {
        const delivery = await issueEmailChangeVerification({
            userId: user.id,
            email: parsed.data.email,
        });
        if (!delivery.sent) {
            await prisma.userAuthToken.deleteMany({
                where: { userId: user.id, type: "EMAIL_CHANGE", usedAt: null },
            });
            return NextResponse.json(
                { error: "Không thể gửi email xác nhận lúc này" },
                { status: 503 },
            );
        }
        await clearAuthFailures(rateLimitKey);
        return NextResponse.json({
            success: true,
            email: parsed.data.email,
            message: "Đã gửi liên kết xác nhận tới email mới.",
        });
    } catch (error) {
        console.error("[auth] Không thể gửi email đổi địa chỉ", error);
        await prisma.userAuthToken.deleteMany({
            where: { userId: user.id, type: "EMAIL_CHANGE", usedAt: null },
        });
        return NextResponse.json(
            { error: "Không thể gửi email xác nhận lúc này" },
            { status: 503 },
        );
    }
}
