import { NextResponse } from "next/server";
import { auth } from "./lib/auth";
// import { getToken } from "next-auth/jwt";

export default auth(async (req) => {
    console.log("🔍 Middleware chạy tại:", req.nextUrl.pathname);
    console.log("req.auth:::", req.auth);
    // console.log(
    //     "🔍 token::: middleware:::",
    //     await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    // );
    if (!req.auth) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
});

export const config = {
    // matcher: ["/truyen/:slug*", "/xep-hang/de-cu"],
    matcher: ["/xep-hang/de-cu"],
};
