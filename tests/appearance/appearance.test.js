import {
    APPEARANCE_STORAGE_KEY,
    LEGACY_READER_SETTINGS_STORAGE_KEY,
    getStoredSiteTheme,
    sanitizeSiteTheme,
} from "@/app/_lib/appearance";
import { describe, expect, it } from "vitest";

function createStorage(entries = {}) {
    return {
        getItem(key) {
            return entries[key] ?? null;
        },
    };
}

describe("appearance preferences", () => {
    it("falls back when a stored theme is invalid", () => {
        expect(sanitizeSiteTheme("unknown")).toBe("light");
    });

    it("uses the dedicated appearance preference first", () => {
        const storage = createStorage({
            [APPEARANCE_STORAGE_KEY]: "dark",
            [LEGACY_READER_SETTINGS_STORAGE_KEY]: JSON.stringify({
                theme: "sepia",
            }),
        });

        expect(getStoredSiteTheme(storage)).toBe("dark");
    });

    it("migrates the theme value from legacy reader settings", () => {
        const storage = createStorage({
            [LEGACY_READER_SETTINGS_STORAGE_KEY]: JSON.stringify({
                theme: "sepia",
                fontSize: 24,
            }),
        });

        expect(getStoredSiteTheme(storage)).toBe("sepia");
    });
});
