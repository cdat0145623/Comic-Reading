import NextAuth from "next-auth";
import { createAuthConfig } from "@mtc/auth";

import { prisma } from "@/lib/prisma";

const authConfig = createAuthConfig({
    prisma,
    secret: process.env.NEXTAUTH_SECRET,
    mode: "reader",
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
});

export const {
    handlers: { GET, POST },
    signIn,
    signOut,
    auth,
} = NextAuth(authConfig);
