"use client";

import {
    APPEARANCE_STORAGE_KEY,
    DEFAULT_SITE_THEME,
    applySiteTheme,
    getStoredSiteTheme,
    sanitizeSiteTheme,
} from "@/app/_lib/appearance";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

const AppearanceContext = createContext(null);

function AppearanceProvider({ children }) {
    const [theme, setThemeState] = useState(DEFAULT_SITE_THEME);

    useEffect(() => {
        try {
            const storedTheme = getStoredSiteTheme();
            setThemeState(applySiteTheme(storedTheme));
            window.localStorage.setItem(APPEARANCE_STORAGE_KEY, storedTheme);
        } catch {
            setThemeState(
                applySiteTheme(
                    document.documentElement.dataset.siteTheme ??
                        DEFAULT_SITE_THEME,
                ),
            );
        }
    }, []);

    useEffect(() => {
        const handleStorage = (event) => {
            if (event.key !== APPEARANCE_STORAGE_KEY) return;

            const nextTheme = sanitizeSiteTheme(event.newValue);
            setThemeState(nextTheme);
            applySiteTheme(nextTheme);
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const setTheme = useCallback((nextTheme) => {
        const sanitizedTheme = applySiteTheme(nextTheme);
        setThemeState(sanitizedTheme);
        try {
            window.localStorage.setItem(
                APPEARANCE_STORAGE_KEY,
                sanitizedTheme,
            );
        } catch {
            // The in-memory theme still works when browser storage is blocked.
        }
    }, []);

    const resetTheme = useCallback(() => {
        try {
            window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
        } catch {
            // Ignore blocked storage and still reset the active theme.
        }
        setTheme(DEFAULT_SITE_THEME);
    }, [setTheme]);

    const value = useMemo(
        () => ({ theme, setTheme, resetTheme }),
        [resetTheme, setTheme, theme],
    );

    return (
        <AppearanceContext.Provider value={value}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (!context) {
        throw new Error(
            "useAppearance must be used inside AppearanceProvider",
        );
    }
    return context;
}

export default AppearanceProvider;
