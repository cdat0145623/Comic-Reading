import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

const TOKEN_TTL = {
    EMAIL_VERIFICATION: 24 * 60 * 60 * 1000,
    EMAIL_CHANGE: 24 * 60 * 60 * 1000,
    PASSWORD_RESET: 30 * 60 * 1000,
};

export function hashAuthToken(token) {
    return createHash("sha256").update(token).digest("hex");
}

export async function createAuthToken({ userId, type, targetEmail = null }) {
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashAuthToken(token);
    const expiresAt = new Date(Date.now() + TOKEN_TTL[type]);

    await prisma.$transaction(async (tx) => {
        await tx.userAuthToken.deleteMany({
            where: { userId, type, usedAt: null },
        });
        await tx.userAuthToken.create({
            data: { userId, type, tokenHash, targetEmail, expiresAt },
        });
    });

    return { token, expiresAt };
}

export async function consumeAuthToken({ token, type, onConsume }) {
    const tokenHash = hashAuthToken(token);

    return prisma.$transaction(async (tx) => {
        const record = await tx.userAuthToken.findUnique({
            where: { tokenHash },
            select: {
                id: true,
                userId: true,
                type: true,
                targetEmail: true,
                usedAt: true,
                expiresAt: true,
            },
        });

        if (
            !record ||
            record.type !== type ||
            record.usedAt ||
            record.expiresAt <= new Date()
        ) {
            return null;
        }

        const claimed = await tx.userAuthToken.updateMany({
            where: {
                id: record.id,
                usedAt: null,
                expiresAt: { gt: new Date() },
            },
            data: { usedAt: new Date() },
        });
        if (claimed.count !== 1) return null;

        return onConsume(tx, record);
    });
}
