import { consumeAuthToken } from "@/app/_lib/auth-token-service";
import { ResetPasswordSchema } from "@/app/_lib/validate";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(request) {
    const parsed = ResetPasswordSchema.safeParse(
        await request.json().catch(() => ({})),
    );
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" },
            { status: 400 },
        );
    }

    const password = await bcrypt.hash(parsed.data.password, 12);
    const result = await consumeAuthToken({
        token: parsed.data.token,
        type: "PASSWORD_RESET",
        onConsume: (tx, record) =>
            tx.user.update({
                where: { id: record.userId },
                data: {
                    password,
                    authVersion: { increment: 1 },
                },
                select: { id: true },
            }),
    });
    if (!result) {
        return NextResponse.json(
            { error: "Liên kết đã hết hạn hoặc đã được sử dụng" },
            { status: 400 },
        );
    }
    return NextResponse.json({
        success: true,
        reason: "password-reset",
    });
}
