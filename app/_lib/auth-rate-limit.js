import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

function hashKey(value) {
    return createHash("sha256")
        .update(`${process.env.NEXTAUTH_SECRET || "local"}:${value}`)
        .digest("hex");
}

export function getRequestIp(request) {
    const forwarded = request?.headers?.get?.("x-forwarded-for");
    return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function createRateLimitKey({ scope, identifier, request }) {
    return hashKey(
        `${scope}:${getRequestIp(request)}:${String(identifier || "").toLowerCase()}`,
    );
}

export async function checkAuthRateLimit(keyHash) {
    const state = await prisma.authRateLimit.findUnique({
        where: { keyHash },
    });
    if (!state?.lockedUntil || state.lockedUntil <= new Date()) {
        return { allowed: true };
    }
    return {
        allowed: false,
        retryAfter: Math.max(
            1,
            Math.ceil((state.lockedUntil.getTime() - Date.now()) / 1000),
        ),
    };
}

export async function recordAuthFailure(keyHash, limit = 5) {
    const now = new Date();
    const state = await prisma.authRateLimit.findUnique({
        where: { keyHash },
    });
    const expiredWindow =
        !state || now.getTime() - state.windowStartedAt.getTime() >= WINDOW_MS;
    const failures = expiredWindow ? 1 : state.failures + 1;

    await prisma.authRateLimit.upsert({
        where: { keyHash },
        create: {
            keyHash,
            failures,
            windowStartedAt: now,
            lockedUntil:
                failures >= limit ? new Date(now.getTime() + LOCK_MS) : null,
        },
        update: {
            failures,
            ...(expiredWindow && { windowStartedAt: now }),
            lockedUntil:
                failures >= limit ? new Date(now.getTime() + LOCK_MS) : null,
        },
    });
}

export async function clearAuthFailures(keyHash) {
    await prisma.authRateLimit.deleteMany({ where: { keyHash } });
}
