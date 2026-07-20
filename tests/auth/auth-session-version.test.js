import { describe, expect, it } from "vitest";

import {
    hasCurrentAuthVersion,
    normalizeAuthVersion,
} from "@/app/_lib/auth-session-version";

describe("auth session version", () => {
    it("treats legacy JWTs without a version as version zero", () => {
        expect(normalizeAuthVersion(undefined)).toBe(0);
        expect(hasCurrentAuthVersion(undefined, 0)).toBe(true);
    });

    it("accepts a JWT whose version matches the database", () => {
        expect(hasCurrentAuthVersion(3, 3)).toBe(true);
    });

    it("rejects a JWT after a security change increments the database", () => {
        expect(hasCurrentAuthVersion(3, 4)).toBe(false);
        expect(hasCurrentAuthVersion(undefined, 1)).toBe(false);
    });

    it("does not accept malformed or negative versions", () => {
        expect(normalizeAuthVersion("2")).toBe(0);
        expect(normalizeAuthVersion(-1)).toBe(0);
    });
});
