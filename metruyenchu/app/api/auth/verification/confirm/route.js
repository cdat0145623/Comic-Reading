import { consumeAuthToken } from "@/app/_lib/auth-token-service";
import { NextResponse } from "next/server";

export async function POST(request) {
    const { token } = await request.json().catch(() => ({}));
    if (typeof token !== "string") {
        return NextResponse.json({ error: "Liên kết không hợp lệ" }, { status: 400 });
    }

    const result = await consumeAuthToken({
        token,
        type: "EMAIL_VERIFICATION",
        onConsume: (tx, record) =>
            tx.user.update({
                where: { id: record.userId },
                data: { emailVerified: new Date() },
                select: { id: true, emailVerified: true },
            }),
    });

    if (!result) {
        return NextResponse.json(
            { error: "Liên kết đã hết hạn hoặc đã được sử dụng" },
            { status: 400 },
        );
    }
    return NextResponse.json({ success: true });
}
