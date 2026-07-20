import { createUser, getUser } from "@/app/_lib/data-service";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { SignUpSchema } from "@/app/_lib/validate";
import { issueVerificationEmail } from "@/app/_lib/auth-email-service";
import {
    checkAuthRateLimit,
    createRateLimitKey,
    recordAuthFailure,
} from "@/app/_lib/auth-rate-limit";

export async function POST(req) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Dữ liệu đăng ký không hợp lệ" },
            { status: 400 },
        );
    }

    const validatedFields = SignUpSchema.safeParse(body);

    if (!validatedFields.success) {
        const errorField = validatedFields.error.flatten().fieldErrors;
        return NextResponse.json(
            {
                error: errorField,
            },
            { status: 400 },
        );
    }

    const { email, password } = validatedFields.data;
    const rateLimitKey = createRateLimitKey({
        scope: "sign-up",
        identifier: email,
        request: req,
    });
    const rateLimit = await checkAuthRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: "Bạn thao tác quá nhanh. Vui lòng thử lại sau." },
            {
                status: 429,
                headers: { "Retry-After": String(rateLimit.retryAfter) },
            },
        );
    }

    try {
        const existingUser = await getUser(email);

        if (existingUser) {
            await recordAuthFailure(rateLimitKey, 3);
            return NextResponse.json(
                {
                    message:
                        "Email này đã được sử dụng",
                },
                { status: 409 },
            );
        }

        const passwordHashed = await bcrypt.hash(password, 10);

        const randomName = nanoid(10);

        const newUser = await createUser(randomName, email, passwordHashed);
        const verification = await issueVerificationEmail(newUser).catch(
            (error) => {
                console.error("[auth] Không thể gửi email xác minh", error);
                return { sent: false };
            },
        );

        return NextResponse.json(
            {
                user: newUser,
                verificationEmailSent: verification.sent,
            },
            { status: 201 },
        );
    } catch (error) {
        if (error?.code === "P2002") {
            return NextResponse.json(
                { message: "Email này đã được sử dụng" },
                { status: 409 },
            );
        }
        console.error("[auth] Không thể tạo tài khoản", error);
        return NextResponse.json(
            {
                error: "Không thể tạo tài khoản. Vui lòng thử lại.",
            },
            {
                status: 500,
            },
        );
    }
}
