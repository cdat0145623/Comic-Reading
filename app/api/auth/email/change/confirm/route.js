import { consumeAuthToken } from "@/app/_lib/auth-token-service";
import { sendEmailChangedNotice } from "@/app/_lib/auth-mail";
import { NextResponse } from "next/server";

export async function POST(request) {
    const { token } = await request.json().catch(() => ({}));
    if (typeof token !== "string") {
        return NextResponse.json({ error: "Liên kết không hợp lệ" }, { status: 400 });
    }

    try {
        const result = await consumeAuthToken({
            token,
            type: "EMAIL_CHANGE",
            onConsume: async (tx, record) => {
                if (!record.targetEmail) return null;

                const user = await tx.user.findUnique({
                    where: { id: record.userId },
                    select: { email: true },
                });
                if (!user) return null;

                const duplicate = await tx.user.findFirst({
                    where: {
                        email: { equals: record.targetEmail, mode: "insensitive" },
                        id: { not: record.userId },
                    },
                    select: { id: true },
                });
                if (duplicate) return { conflict: true };

                await tx.user.update({
                    where: { id: record.userId },
                    data: {
                        email: record.targetEmail,
                        emailVerified: new Date(),
                        authVersion: { increment: 1 },
                    },
                });
                await tx.userAuthToken.deleteMany({
                    where: {
                        userId: record.userId,
                        id: { not: record.id },
                        usedAt: null,
                    },
                });
                return {
                    oldEmail: user.email,
                    newEmail: record.targetEmail,
                };
            },
        });

        if (!result) {
            return NextResponse.json(
                { error: "Liên kết đã hết hạn hoặc đã được sử dụng" },
                { status: 400 },
            );
        }
        if (result.conflict) {
            return NextResponse.json(
                { error: "Email này đã được một tài khoản khác sử dụng" },
                { status: 409 },
            );
        }

        if (result.oldEmail) {
            try {
                await sendEmailChangedNotice({
                    email: result.oldEmail,
                    newEmail: result.newEmail,
                });
            } catch (error) {
                console.error("[auth] Không thể gửi cảnh báo đổi email", error);
            }
        }
        return NextResponse.json({
            success: true,
            reason: "email-changed",
            email: result.newEmail,
        });
    } catch (error) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { error: "Email này đã được một tài khoản khác sử dụng" },
                { status: 409 },
            );
        }
        console.error("[auth] Không thể xác nhận email mới", error);
        return NextResponse.json(
            { error: "Không thể đổi email lúc này" },
            { status: 500 },
        );
    }
}
