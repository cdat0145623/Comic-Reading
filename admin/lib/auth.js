import NextAuth from "next-auth";
import { createAuthConfig } from "@mtc/auth";
import { prisma } from "@mtc/database";

if (
    process.env.NODE_ENV === "production" &&
    !process.env.AUTH_URL &&
    process.env.ADMIN_APP_URL
) {
    process.env.AUTH_URL = process.env.ADMIN_APP_URL;
}

const authConfig = createAuthConfig({
    prisma,
    secret: process.env.ADMIN_AUTH_SECRET,
    mode: "admin",
});

export const {
    handlers: { GET, POST },
    signIn,
    signOut,
    auth,
} = NextAuth(authConfig);
