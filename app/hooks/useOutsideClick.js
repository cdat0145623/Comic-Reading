"use client";
import { useEffect, useRef } from "react";

function useOutsideClick(handler, enabled = true, listenCapturing = true) {
    const ref = useRef();

    useEffect(() => {
        if (!enabled) return;

        function handleClick(e) {
            const isInsideToast = e.target.closest(".custom-toast-error");

            if (isInsideToast) return;

            if (ref.current && !ref.current.contains(e.target)) handler();
        }
        document.addEventListener("click", handleClick, listenCapturing);

        return () => {
            document.removeEventListener("click", handleClick, listenCapturing);
        };
    }, [handler, enabled, listenCapturing]);

    return ref;
}

export default useOutsideClick;
