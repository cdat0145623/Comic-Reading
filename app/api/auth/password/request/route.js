import { issuePasswordResetEmail } from "@/app/_lib/auth-email-service";
import {
    checkAuthRateLimit,
    createRateLimitKey,
    recordAuthFailure,
} from "@/app/_lib/auth-rate-limit";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const RequestSchema = z.object({ email: z.string().trim().toLowerCase().email() });
const GENERIC_MESSAGE = "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.";

export async function POST(request) {
    const parsed = RequestSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
        return NextResponse.json({ message: GENERIC_MESSAGE });
    }

    const key = createRateLimitKey({
        scope: "password-reset",
        identifier: parsed.data.email,
        request,
    });
    const state = await checkAuthRateLimit(key);
    if (!state.allowed) {
        return NextResponse.json({ message: GENERIC_MESSAGE });
    }
    await recordAuthFailure(key, 3);

    const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: { id: true, email: true },
    });
    if (user) {
        await issuePasswordResetEmail(user).catch((error) =>
            console.error("[auth] Không thể gửi email reset mật khẩu", error),
        );
    }
    return NextResponse.json({ message: GENERIC_MESSAGE });
}
