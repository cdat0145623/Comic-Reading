import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";

import { SignInSchema } from "@/app/_lib/validate";
import { prisma } from "@/lib/prisma";
import {
    checkAuthRateLimit,
    clearAuthFailures,
    createRateLimitKey,
    recordAuthFailure,
} from "@/app/_lib/auth-rate-limit";
import {
    canUseGoogleAccount,
    googleVerifiesCurrentEmail,
} from "@/app/_lib/google-account";
import {
    hasCurrentAuthVersion,
    normalizeAuthVersion,
} from "@/app/_lib/auth-session-version";

const USER_SESSION_SELECT = {
    id: true,
    email: true,
    password: true,
    name: true,
    image: true,
    imageUpdatedAt: true,
    birthYear: true,
    sex: true,
    role: true,
    emailVerified: true,
    authVersion: true,
};

const authConfig = {
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        Credentials({
            credentials: {
                email: {},
                password: {},
            },
            authorize: async (credentials, request) => {
                const parsed = SignInSchema.safeParse(credentials);
                if (!parsed.success) return null;

                const rateLimitKey = createRateLimitKey({
                    scope: "sign-in",
                    identifier: parsed.data.email,
                    request,
                });
                const rateLimit = await checkAuthRateLimit(rateLimitKey);
                if (!rateLimit.allowed) return null;

                const user = await prisma.user.findUnique({
                    where: { email: parsed.data.email },
                    select: USER_SESSION_SELECT,
                });

                if (!user?.password) {
                    await recordAuthFailure(rateLimitKey);
                    return null;
                }
                const isValid = await compare(
                    parsed.data.password,
                    user.password,
                );
                if (!isValid) {
                    await recordAuthFailure(rateLimitKey);
                    return null;
                }
                await clearAuthFailures(rateLimitKey);
                return user;
            },
        }),
    ],
    trustHost: true,
    session: { strategy: "jwt" },
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account?.provider !== "google") return Boolean(user);
            return canUseGoogleAccount({ user, profile });
        },
        async jwt({ token, user, trigger, session }) {
            if (user) {
                const authVersion = Number.isInteger(user.authVersion)
                    ? user.authVersion
                    : (
                          await prisma.user.findUnique({
                              where: { id: user.id },
                              select: { authVersion: true },
                          })
                      )?.authVersion;
                token.user = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    imageUpdatedAt: user.imageUpdatedAt ?? null,
                    birthYear: user.birthYear ?? null,
                    sex: user.sex ?? null,
                    role: user.role ?? "USER",
                    emailVerified: user.emailVerified ?? null,
                };
                token.authVersion = normalizeAuthVersion(authVersion);
            } else if (token.user?.id) {
                const currentUser = await prisma.user.findUnique({
                    where: { id: token.user.id },
                    select: { authVersion: true },
                });
                if (
                    !currentUser ||
                    !hasCurrentAuthVersion(
                        token.authVersion,
                        currentUser.authVersion,
                    )
                ) {
                    return null;
                }
                token.authVersion = normalizeAuthVersion(
                    currentUser.authVersion,
                );
            }

            if (trigger === "update" && token.user && session?.user) {
                token.user = {
                    ...token.user,
                    name: session.user.name ?? token.user.name,
                    image: session.user.image ?? token.user.image,
                    imageUpdatedAt:
                        session.user.imageUpdatedAt ??
                        token.user.imageUpdatedAt,
                    birthYear:
                        session.user.birthYear ?? token.user.birthYear,
                    sex: session.user.sex ?? token.user.sex,
                    emailVerified:
                        session.user.emailVerified ??
                        token.user.emailVerified,
                };
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.user?.id) session.user = token.user;
            return session;
        },
        async redirect({ url, baseUrl }) {
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            try {
                if (new URL(url).origin === new URL(baseUrl).origin) return url;
            } catch {
                return baseUrl;
            }
            return baseUrl;
        },
    },
    events: {
        async createUser({ user }) {
            await prisma.userSetting.upsert({
                where: { userId: user.id },
                create: { userId: user.id },
                update: {},
            });
        },
        async linkAccount({ user, account, profile }) {
            if (
                account.provider === "google" &&
                googleVerifiesCurrentEmail({ userEmail: user.email, profile })
            ) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: { emailVerified: user.emailVerified ?? new Date() },
                });
            }
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/login",
    },
};

export const {
    handlers: { GET, POST },
    signIn,
    signOut,
    auth,
} = NextAuth(authConfig);
