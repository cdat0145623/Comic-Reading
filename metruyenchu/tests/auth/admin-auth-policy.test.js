import { describe, expect, it } from "vitest";
import {
    ADMIN_SESSION_MAX_AGE_SECONDS,
    hasAdminAccess,
    isAdminSessionToken,
} from "@mtc/auth";

describe("admin auth policy", () => {
    it.each(["ADMIN", "UPLOADER"])("allows %s sessions", (role) => {
        expect(
            hasAdminAccess({
                user: {
                    id: "user-id",
                    role,
                },
            }),
        ).toBe(true);
    });

    it("rejects regular users", () => {
        expect(
            hasAdminAccess({
                user: {
                    id: "user-id",
                    role: "USER",
                },
            }),
        ).toBe(false);
    });

    it("enforces the absolute session lifetime", () => {
        const now = Date.now();
        expect(
            isAdminSessionToken({
                user: { id: "user-id", role: "ADMIN" },
                adminSessionStartedAt: now,
            }),
        ).toBe(true);
        expect(
            isAdminSessionToken({
                user: { id: "user-id", role: "ADMIN" },
                adminSessionStartedAt:
                    now - ADMIN_SESSION_MAX_AGE_SECONDS * 1000 - 1,
            }),
        ).toBe(false);
    });
});
