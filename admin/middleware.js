import { NextResponse } from "next/server";
import { getAdminCookieNames } from "@mtc/auth/policy";

export default function middleware(request) {
    const names = getAdminCookieNames();

    if (request.cookies.has(names.sessionToken)) {
        return NextResponse.next();
    }

    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("mtc-admin.flash", "login-required", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15,
        path: "/",
        secure: process.env.NODE_ENV === "production",
    });
    return response;
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
