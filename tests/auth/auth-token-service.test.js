import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
    $transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));

import {
    createAuthToken,
    hashAuthToken,
} from "@/app/_lib/auth-token-service";

beforeEach(() => {
    prismaMock.$transaction.mockReset();
});

describe("auth token hashing", () => {
    it("is deterministic and does not store the raw token", () => {
        const token = "raw-secret-token";
        const hash = hashAuthToken(token);
        expect(hash).toHaveLength(64);
        expect(hash).not.toContain(token);
        expect(hashAuthToken(token)).toBe(hash);
    });

    it("produces different hashes for different tokens", () => {
        expect(hashAuthToken("token-a")).not.toBe(hashAuthToken("token-b"));
    });

    it("keeps only the latest pending email-change token", async () => {
        const activeTokens = [];
        const tx = {
            userAuthToken: {
                deleteMany: vi.fn(async () => {
                    activeTokens.length = 0;
                }),
                create: vi.fn(async ({ data }) => {
                    activeTokens.push(data);
                }),
            },
        };
        prismaMock.$transaction.mockImplementation((callback) => callback(tx));

        await createAuthToken({
            userId: "user-1",
            type: "EMAIL_CHANGE",
            targetEmail: "first@example.com",
        });
        await createAuthToken({
            userId: "user-1",
            type: "EMAIL_CHANGE",
            targetEmail: "second@example.com",
        });

        expect(activeTokens).toHaveLength(1);
        expect(activeTokens[0].targetEmail).toBe("second@example.com");
        expect(tx.userAuthToken.deleteMany).toHaveBeenCalledTimes(2);
    });
});
