"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from "react";

const NavigationProgressContext = createContext(null);

function NavigationProgressProvider({ children }) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const routeKey = `${pathname}?${searchParams.toString()}`;
    const previousRouteKey = useRef(routeKey);
    const hideTimeout = useRef(null);
    const fallbackTimeout = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [progress, setProgress] = useState(0);

    const clearTimers = useCallback(() => {
        if (hideTimeout.current) clearTimeout(hideTimeout.current);
        if (fallbackTimeout.current) clearTimeout(fallbackTimeout.current);
        hideTimeout.current = null;
        fallbackTimeout.current = null;
    }, []);

    const completeNavigationProgress = useCallback(() => {
        clearTimers();
        setProgress(100);
        hideTimeout.current = setTimeout(() => {
            setIsVisible(false);
            setProgress(0);
            hideTimeout.current = null;
        }, 240);
    }, [clearTimers]);

    const startNavigationProgress = useCallback(() => {
        clearTimers();
        setIsVisible(true);
        setProgress(8);

        requestAnimationFrame(() => {
            setProgress(88);
        });

        fallbackTimeout.current = setTimeout(() => {
            completeNavigationProgress();
        }, 10000);
    }, [clearTimers, completeNavigationProgress]);

    useEffect(() => {
        if (previousRouteKey.current !== routeKey) {
            previousRouteKey.current = routeKey;
            if (isVisible) completeNavigationProgress();
        }
    }, [completeNavigationProgress, isVisible, routeKey]);

    useEffect(() => clearTimers, [clearTimers]);

    return (
        <NavigationProgressContext.Provider
            value={{ startNavigationProgress, completeNavigationProgress }}
        >
            <div
                className="fixed left-0 top-0 z-[9999] h-[3px] bg-primary shadow-[0_0_12px_rgba(183,138,39,0.55)] transition-[width,opacity] duration-300 ease-out"
                style={{
                    width: `${progress}%`,
                    opacity: isVisible ? 1 : 0,
                }}
            />
            {children}
        </NavigationProgressContext.Provider>
    );
}

function useNavigationProgress() {
    const context = useContext(NavigationProgressContext);
    if (!context) {
        throw new Error(
            "useNavigationProgress must be used inside NavigationProgressProvider",
        );
    }

    return context;
}

export { NavigationProgressProvider, useNavigationProgress };
