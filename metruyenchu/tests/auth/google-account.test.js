import { describe, expect, it } from "vitest";

import {
    canUseGoogleAccount,
    googleVerifiesCurrentEmail,
} from "@/app/_lib/google-account";

describe("Google account linking", () => {
    it("allows a verified Google identity with a different email", () => {
        expect(
            canUseGoogleAccount({
                user: { id: "user-1", email: "credentials@example.com" },
                profile: { email: "google@gmail.com", email_verified: true },
            }),
        ).toBe(true);
    });

    it("only verifies the credentials email when both addresses match", () => {
        expect(
            googleVerifiesCurrentEmail({
                userEmail: "credentials@example.com",
                profile: { email: "google@gmail.com", email_verified: true },
            }),
        ).toBe(false);
        expect(
            googleVerifiesCurrentEmail({
                userEmail: "USER@example.com",
                profile: { email: "user@example.com", email_verified: true },
            }),
        ).toBe(true);
    });
});
