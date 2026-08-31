import { NextResponse } from "next/server";
import { getAdminCookieNames } from "@mtc/auth/policy";

export function GET(request) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    const names = getAdminCookieNames();

    response.cookies.delete(names.sessionToken);
    response.cookies.set("mtc-admin.flash", "session-ended", {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 15,
        path: "/",
        secure: process.env.NODE_ENV === "production",
    });
    return response;
}
