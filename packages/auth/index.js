import { createHash } from "node:crypto";

import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { z } from "zod";
import {
    ADMIN_ROLES,
    ADMIN_SESSION_MAX_AGE_SECONDS,
    getAdminCookieNames,
    hasAdminAccess,
    hasSystemAdminAccess,
    isAdminRole,
    isAdminSessionToken,
} from "./policy.js";

export {
    ADMIN_ROLES,
    ADMIN_SESSION_MAX_AGE_SECONDS,
    getAdminCookieNames,
    hasAdminAccess,
    hasSystemAdminAccess,
    isAdminSessionToken,
};

const signInSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
});

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

function normalizeAuthVersion(value) {
    return Number.isInteger(value) && value >= 0 ? value : 0;
}

function hasCurrentAuthVersion(tokenVersion, currentVersion) {
    return (
        normalizeAuthVersion(tokenVersion) ===
        normalizeAuthVersion(currentVersion)
    );
}

function canAccessAdmin(user) {
    return Boolean(
        user?.id &&
            user.emailVerified &&
            isAdminRole(user.role),
    );
}

export async function verifyCredentials({
    prisma,
    credentials,
    mode = "reader",
}) {
    const parsed = signInSchema.safeParse(credentials);
    if (!parsed.success) return null;

    const user = await prisma.user.findUnique({
        where: { email: parsed.data.email },
        select: USER_SESSION_SELECT,
    });
    const validPassword = Boolean(
        user?.password &&
            (await compare(parsed.data.password, user.password)),
    );
    if (!validPassword) return null;
    if (mode === "admin" && !canAccessAdmin(user)) return null;
    return user;
}

function toSessionUser(user, mode) {
    const common = {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role ?? "USER",
    };

    if (mode === "admin") return common;

    return {
        ...common,
        imageUpdatedAt: user.imageUpdatedAt ?? null,
        birthYear: user.birthYear ?? null,
        sex: user.sex ?? null,
        emailVerified: user.emailVerified ?? null,
    };
}

function getRequestIp(request) {
    const forwarded = request?.headers?.get?.("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || "unknown";
}

function createRateLimitKey({ secret, scope, identifier, request }) {
    return createHash("sha256")
        .update(
            `${secret || "local"}:${scope}:${getRequestIp(request)}:${String(
                identifier || "",
            ).toLowerCase()}`,
        )
        .digest("hex");
}

async function checkRateLimit(prisma, keyHash) {
    const state = await prisma.authRateLimit.findUnique({
        where: { keyHash },
    });
    if (!state?.lockedUntil || state.lockedUntil <= new Date()) {
        return true;
    }
    return false;
}

async function recordFailure(prisma, keyHash, limit = 5) {
    const windowMs = 15 * 60 * 1000;
    const lockMs = 15 * 60 * 1000;
    const now = new Date();
    const state = await prisma.authRateLimit.findUnique({
        where: { keyHash },
    });
    const expiredWindow =
        !state || now.getTime() - state.windowStartedAt.getTime() >= windowMs;
    const failures = expiredWindow ? 1 : state.failures + 1;

    await prisma.authRateLimit.upsert({
        where: { keyHash },
        create: {
            keyHash,
            failures,
            windowStartedAt: now,
            lockedUntil:
                failures >= limit ? new Date(now.getTime() + lockMs) : null,
        },
        update: {
            failures,
            ...(expiredWindow && { windowStartedAt: now }),
            lockedUntil:
                failures >= limit ? new Date(now.getTime() + lockMs) : null,
        },
    });
}

function createCredentialsProvider({ prisma, secret, mode }) {
    return Credentials({
        credentials: {
            email: {},
            password: {},
        },
        authorize: async (credentials, request) => {
            const parsed = signInSchema.safeParse(credentials);
            if (!parsed.success) return null;

            const rateLimitKey = createRateLimitKey({
                secret,
                scope: mode === "admin" ? "admin-sign-in" : "sign-in",
                identifier: parsed.data.email,
                request,
            });
            if (!(await checkRateLimit(prisma, rateLimitKey))) return null;

            const user = await verifyCredentials({
                prisma,
                credentials: parsed.data,
                mode,
            });

            if (!user) {
                await recordFailure(prisma, rateLimitKey);
                return null;
            }

            await prisma.authRateLimit.deleteMany({
                where: { keyHash: rateLimitKey },
            });
            return user;
        },
    });
}

function createAdminCookies() {
    const secure = process.env.NODE_ENV === "production";
    const names = getAdminCookieNames();
    const baseOptions = {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure,
    };

    return {
        sessionToken: {
            name: names.sessionToken,
            options: baseOptions,
        },
        callbackUrl: {
            name: names.callbackUrl,
            options: baseOptions,
        },
        csrfToken: {
            name: names.csrfToken,
            options: baseOptions,
        },
    };
}

function googleVerifiesCurrentEmail({ userEmail, profile }) {
    return Boolean(
        profile?.email_verified === true &&
            userEmail &&
            profile.email &&
            userEmail.toLowerCase() === profile.email.toLowerCase(),
    );
}

export function createAuthConfig({
    prisma,
    secret,
    mode = "reader",
    google,
}) {
    const adminMode = mode === "admin";
    const providers = [
        ...(adminMode
            ? []
            : [
                  Google({
                      clientId: google?.clientId,
                      clientSecret: google?.clientSecret,
                  }),
              ]),
        createCredentialsProvider({ prisma, secret, mode }),
    ];

    return {
        adapter: PrismaAdapter(prisma),
        providers,
        trustHost: true,
        secret,
        session: {
            strategy: "jwt",
            ...(adminMode && {
                maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
            }),
        },
        ...(adminMode && { cookies: createAdminCookies() }),
        callbacks: {
            async signIn({ user, account, profile }) {
                if (adminMode) return canAccessAdmin(user);
                if (account?.provider !== "google") return Boolean(user);
                return Boolean(user && profile?.email_verified === true);
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
                    token.user = toSessionUser(user, mode);
                    token.authVersion = normalizeAuthVersion(authVersion);
                    if (adminMode) {
                        token.adminSessionStartedAt = Date.now();
                    }
                } else if (token.user?.id) {
                    const currentUser = await prisma.user.findUnique({
                        where: { id: token.user.id },
                        select: USER_SESSION_SELECT,
                    });
                    const invalidVersion =
                        !currentUser ||
                        !hasCurrentAuthVersion(
                            token.authVersion,
                            currentUser.authVersion,
                        );
                    const invalidAdmin =
                        adminMode && !canAccessAdmin(currentUser);
                    if (invalidVersion || invalidAdmin) return null;

                    token.authVersion = normalizeAuthVersion(
                        currentUser.authVersion,
                    );
                    if (adminMode) {
                        const startedAt = Number(
                            token.adminSessionStartedAt,
                        );
                        const absoluteExpiry =
                            startedAt +
                            ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
                        if (
                            !Number.isFinite(startedAt) ||
                            Date.now() >= absoluteExpiry
                        ) {
                            return null;
                        }
                        token.user = toSessionUser(currentUser, mode);
                    }
                }

                if (
                    !adminMode &&
                    trigger === "update" &&
                    token.user &&
                    session?.user
                ) {
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
                    if (new URL(url).origin === new URL(baseUrl).origin) {
                        return url;
                    }
                } catch {
                    return baseUrl;
                }
                return baseUrl;
            },
        },
        ...(!adminMode && {
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
                        googleVerifiesCurrentEmail({
                            userEmail: user.email,
                            profile,
                        })
                    ) {
                        await prisma.user.update({
                            where: { id: user.id },
                            data: {
                                emailVerified:
                                    user.emailVerified ?? new Date(),
                            },
                        });
                    }
                },
            },
        }),
        pages: {
            signIn: "/login",
        },
    };
}
