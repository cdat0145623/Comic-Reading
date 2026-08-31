import { randomUUID } from "node:crypto";

import { hash } from "bcryptjs";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { verifyCredentials } from "@mtc/auth";

import { prisma } from "@/lib/prisma";

const runDbIntegration = process.env.RUN_DB_INTEGRATION === "1";
const describeDb = runDbIntegration ? describe : describe.skip;
const password = "AdminPass123";
const testId = randomUUID();
const emails = {
    admin: `admin-${testId}@example.test`,
    uploader: `uploader-${testId}@example.test`,
    user: `user-${testId}@example.test`,
    unverified: `unverified-${testId}@example.test`,
};

describeDb("admin credentials with PostgreSQL", () => {
    beforeAll(async () => {
        const passwordHash = await hash(password, 10);
        await prisma.user.createMany({
            data: [
                {
                    email: emails.admin,
                    password: passwordHash,
                    role: "ADMIN",
                    emailVerified: new Date(),
                },
                {
                    email: emails.uploader,
                    password: passwordHash,
                    role: "UPLOADER",
                    emailVerified: new Date(),
                },
                {
                    email: emails.user,
                    password: passwordHash,
                    role: "USER",
                    emailVerified: new Date(),
                },
                {
                    email: emails.unverified,
                    password: passwordHash,
                    role: "ADMIN",
                    emailVerified: null,
                },
            ],
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: {
                email: {
                    in: Object.values(emails),
                },
            },
        });
    });

    it.each([emails.admin, emails.uploader])(
        "accepts an authorized account: %s",
        async (email) => {
            const user = await verifyCredentials({
                prisma,
                credentials: { email, password },
                mode: "admin",
            });
            expect(user?.email).toBe(email);
        },
    );

    it.each([emails.user, emails.unverified])(
        "rejects an unauthorized account: %s",
        async (email) => {
            const user = await verifyCredentials({
                prisma,
                credentials: { email, password },
                mode: "admin",
            });
            expect(user).toBeNull();
        },
    );

    it("rejects an invalid password", async () => {
        const user = await verifyCredentials({
            prisma,
            credentials: {
                email: emails.admin,
                password: "wrong-password",
            },
            mode: "admin",
        });
        expect(user).toBeNull();
    });
});
