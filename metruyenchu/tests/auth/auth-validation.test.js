import { describe, expect, it } from "vitest";

import {
    ChangeEmailSchema,
    ChangePasswordSchema,
    ResetPasswordSchema,
    SignInSchema,
    SignUpSchema,
} from "@/app/_lib/validate";

describe("auth validation", () => {
    it("normalizes credential email without applying signup password rules", () => {
        const result = SignInSchema.parse({
            email: "  USER@Example.COM ",
            password: "legacy-password",
        });
        expect(result.email).toBe("user@example.com");
    });

    it("requires stronger passwords for new accounts", () => {
        expect(
            SignUpSchema.safeParse({ email: "user@example.com", password: "weak" })
                .success,
        ).toBe(false);
        expect(
            SignUpSchema.safeParse({ email: "user@example.com", password: "Secure1" })
                .success,
        ).toBe(true);
    });

    it("validates password reset token and password", () => {
        expect(
            ResetPasswordSchema.safeParse({ token: "a".repeat(64), password: "Secure123" })
                .success,
        ).toBe(true);
    });

    it("normalizes a requested replacement email", () => {
        const result = ChangeEmailSchema.parse({
            email: "  NEW@Example.COM ",
            currentPassword: "Current1",
        });
        expect(result.email).toBe("new@example.com");
    });

    it("requires matching strong passwords when changing password", () => {
        expect(
            ChangePasswordSchema.safeParse({
                currentPassword: "Current1",
                password: "Secure123",
                confirmPassword: "Secure123",
            }).success,
        ).toBe(true);
        expect(
            ChangePasswordSchema.safeParse({
                currentPassword: "Current1",
                password: "Secure123",
                confirmPassword: "Different123",
            }).success,
        ).toBe(false);
    });
});
