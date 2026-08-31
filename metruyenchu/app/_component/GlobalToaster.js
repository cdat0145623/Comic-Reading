"use client";

import { Toaster } from "sonner";

export function GlobalToaster() {
    return (
        <Toaster
            position="top-right"
            richColors
            toastOptions={{
                duration: 1000,
                classNames: {
                    loading: "toast-loading",
                },
                success: {
                    classNames: "!bg-green-400 !text-white !border-none",
                    duration: 1500,
                },
                error: {
                    classNames: "!bg-red-400 !text-white !border-none",
                    duration: 3000,
                },
            }}
        />
    );
}
