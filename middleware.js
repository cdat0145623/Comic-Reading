import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

export default async function middleware(request) {
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
        secureCookie: process.env.NODE_ENV === "production",
    });

    if (!token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set(
            "callbackUrl",
            `${request.nextUrl.pathname}${request.nextUrl.search}`,
        );
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/tai-khoan/:path*"],
};
