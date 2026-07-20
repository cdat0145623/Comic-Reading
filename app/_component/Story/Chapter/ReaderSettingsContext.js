"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

const READER_SETTINGS_STORAGE_KEY = "metruyenchu:reader-settings:v1";

const DEFAULT_READER_SETTINGS = {
    fontSize: 20,
    fontFamily: "serif",
    lineHeight: 1.8,
};

const ReaderSettingsContext = createContext(null);

function clamp(value, min, max) {
    return Math.min(Math.max(Number(value), min), max);
}

function sanitizeSettings(settings = {}) {
    const fontFamilies = new Set(["sans", "serif"]);

    return {
        fontSize: clamp(
            settings.fontSize ?? DEFAULT_READER_SETTINGS.fontSize,
            16,
            32,
        ),
        fontFamily: fontFamilies.has(settings.fontFamily)
            ? settings.fontFamily
            : DEFAULT_READER_SETTINGS.fontFamily,
        lineHeight: clamp(
            settings.lineHeight ?? DEFAULT_READER_SETTINGS.lineHeight,
            1.4,
            2.4,
        ),
    };
}

function loadReaderSettings() {
    const savedSettingsJson = window.localStorage.getItem(
        READER_SETTINGS_STORAGE_KEY,
    );

    if (!savedSettingsJson) return DEFAULT_READER_SETTINGS;

    return sanitizeSettings({
        ...DEFAULT_READER_SETTINGS,
        ...JSON.parse(savedSettingsJson),
    });
}

function ReaderSettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULT_READER_SETTINGS);
    const [hasLoadedSettings, setHasLoadedSettings] = useState(false);
    const skipNextPersistRef = useRef(false);

    useEffect(() => {
        try {
            setSettings(loadReaderSettings());
        } catch (error) {
            console.log("Failed to load reader settings", error);
            window.localStorage.removeItem(READER_SETTINGS_STORAGE_KEY);
        } finally {
            setHasLoadedSettings(true);
        }
    }, []);

    // Wait until stored preferences are loaded so defaults never overwrite them.
    useEffect(() => {
        if (!hasLoadedSettings) return;

        // Reset intentionally removes persistence instead of saving defaults.
        if (skipNextPersistRef.current) {
            skipNextPersistRef.current = false;
            return;
        }

        // Slider inputs update UI immediately; persistence waits for 200ms idle.
        const timeoutId = setTimeout(() => {
            try {
                window.localStorage.setItem(
                    READER_SETTINGS_STORAGE_KEY,
                    JSON.stringify(settings),
                );
            } catch (error) {
                console.log("Failed to save reader settings", error);
            }
        }, 200);

        return () => clearTimeout(timeoutId);
    }, [hasLoadedSettings, settings]);

    const updateSetting = useCallback((field, value) => {
        setSettings((currentSettings) =>
            sanitizeSettings({
                ...currentSettings,
                [field]: value,
            }),
        );
    }, []);

    const resetSettings = useCallback(() => {
        skipNextPersistRef.current = true;
        window.localStorage.removeItem(READER_SETTINGS_STORAGE_KEY);
        setSettings(DEFAULT_READER_SETTINGS);
    }, []);

    const value = useMemo(
        () => ({
            settings,
            updateSetting,
            resetSettings,
        }),
        [resetSettings, settings, updateSetting],
    );

    return (
        <ReaderSettingsContext.Provider value={value}>
            {children}
        </ReaderSettingsContext.Provider>
    );
}

function useReaderSettings() {
    const context = useContext(ReaderSettingsContext);

    if (!context) {
        throw new Error(
            "useReaderSettings must be used inside ReaderSettingsProvider",
        );
    }

    return context;
}

export {
    DEFAULT_READER_SETTINGS,
    READER_SETTINGS_STORAGE_KEY,
    ReaderSettingsProvider,
    useReaderSettings,
};
