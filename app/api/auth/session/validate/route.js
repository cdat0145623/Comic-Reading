import { hasCurrentAuthVersion } from "@/app/_lib/auth-session-version";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET(request) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
    });
    if (!token?.user?.id) {
        return NextResponse.json(
            { valid: false, code: "UNAUTHENTICATED" },
            { status: 401 },
        );
    }

    const user = await prisma.user.findUnique({
        where: { id: token.user.id },
        select: { authVersion: true },
    });
    if (
        !user ||
        !hasCurrentAuthVersion(token.authVersion, user.authVersion)
    ) {
        return NextResponse.json(
            { valid: false, code: "SESSION_REVOKED" },
            { status: 401 },
        );
    }

    return NextResponse.json({ valid: true });
}
