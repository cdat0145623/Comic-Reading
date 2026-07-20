"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { getTabId } from "../_lib/story-activity-sync";

const DRAFT_TTL = 7 * 24 * 60 * 60 * 1000;

function useActivityDraft({ reset, scope, userId, watch }) {
    const saveTimeoutRef = useRef();
    const storageKey = useMemo(() => {
        if (!userId || typeof window === "undefined") return null;
        return `metruyenchu:story-activity:draft:v1:${userId}:${getTabId()}:${JSON.stringify(scope)}`;
    }, [scope, userId]);

    useEffect(() => {
        if (!storageKey) return;
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved.updatedAt < Date.now() - DRAFT_TTL) {
                window.localStorage.removeItem(storageKey);
                return;
            }
            if (saved.value && typeof saved.value === "object") {
                reset(saved.value);
            }
        } catch {
            window.localStorage.removeItem(storageKey);
        }
    }, [reset, storageKey]);

    useEffect(() => {
        if (!storageKey) return;
        const subscription = watch((value) => {
            window.clearTimeout(saveTimeoutRef.current);
            if (!hasMeaningfulActivityDraft(value)) {
                window.localStorage.removeItem(storageKey);
                return;
            }
            saveTimeoutRef.current = window.setTimeout(() => {
                try {
                    window.localStorage.setItem(
                        storageKey,
                        JSON.stringify({ updatedAt: Date.now(), value }),
                    );
                } catch {
                    // Draft persistence is best effort; form state remains usable.
                }
            }, 300);
        });
        return () => {
            window.clearTimeout(saveTimeoutRef.current);
            subscription.unsubscribe();
        };
    }, [storageKey, watch]);

    return useCallback(() => {
        if (!storageKey) return;
        window.clearTimeout(saveTimeoutRef.current);
        window.localStorage.removeItem(storageKey);
    }, [storageKey]);
}

function hasMeaningfulActivityDraft(value) {
    if (!value || typeof value !== "object") return false;
    return Object.entries(value).some(([key, fieldValue]) => {
        if (["content", "character", "plot", "world"].includes(key)) {
            return typeof fieldValue === "string" && fieldValue.trim() !== "";
        }
        if (key === "stars") return Number(fieldValue) !== 5;
        if (key === "onlyStar") return fieldValue === true;
        return false;
    });
}

export { hasMeaningfulActivityDraft, useActivityDraft };
