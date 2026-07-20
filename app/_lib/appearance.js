export const APPEARANCE_STORAGE_KEY = "metruyenchu:appearance:v1";
export const LEGACY_READER_SETTINGS_STORAGE_KEY =
    "metruyenchu:reader-settings:v1";
export const DEFAULT_SITE_THEME = "light";
export const SITE_THEMES = ["light", "sepia", "dark"];

export function sanitizeSiteTheme(theme) {
    return SITE_THEMES.includes(theme) ? theme : DEFAULT_SITE_THEME;
}

export function getStoredSiteTheme(storage = window.localStorage) {
    const storedTheme = storage.getItem(APPEARANCE_STORAGE_KEY);
    if (storedTheme) return sanitizeSiteTheme(storedTheme);

    const legacySettings = storage.getItem(
        LEGACY_READER_SETTINGS_STORAGE_KEY,
    );
    if (!legacySettings) return DEFAULT_SITE_THEME;

    try {
        return sanitizeSiteTheme(JSON.parse(legacySettings)?.theme);
    } catch {
        return DEFAULT_SITE_THEME;
    }
}

export function applySiteTheme(theme) {
    const sanitizedTheme = sanitizeSiteTheme(theme);
    document.documentElement.dataset.siteTheme = sanitizedTheme;
    document.documentElement.style.colorScheme =
        sanitizedTheme === "dark" ? "dark" : "light";
    return sanitizedTheme;
}

export function getAppearanceBootstrapScript() {
    return `(() => {
        try {
            const appearanceKey = ${JSON.stringify(APPEARANCE_STORAGE_KEY)};
            const legacyKey = ${JSON.stringify(LEGACY_READER_SETTINGS_STORAGE_KEY)};
            const allowed = new Set(${JSON.stringify(SITE_THEMES)});
            let theme = localStorage.getItem(appearanceKey);

            if (!allowed.has(theme)) {
                const legacySettings = localStorage.getItem(legacyKey);
                if (legacySettings) theme = JSON.parse(legacySettings)?.theme;
            }

            if (!allowed.has(theme)) theme = ${JSON.stringify(DEFAULT_SITE_THEME)};
            document.documentElement.dataset.siteTheme = theme;
            document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
        } catch {
            document.documentElement.dataset.siteTheme = ${JSON.stringify(DEFAULT_SITE_THEME)};
        }
    })();`;
}
