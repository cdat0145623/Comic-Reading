import {
    AlertCircle,
    DatabaseZap,
    RotateCcw,
    ServerCrash,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SYSTEM_CATEGORIES = new Set(["DATABASE", "INTERNAL"]);

function ErrorIcon({ category }) {
    if (category === "DATABASE") {
        return <DatabaseZap className="shrink-0" size={17} />;
    }
    if (category === "INTERNAL") {
        return <ServerCrash className="shrink-0" size={17} />;
    }
    return <AlertCircle className="shrink-0" size={17} />;
}

export function ImportErrorNotice({
    error,
    onRetry,
    className,
}) {
    if (!error) return null;

    const normalizedError =
        typeof error === "string"
            ? {
                  code: "IMPORT_ERROR",
                  category: "INTERNAL",
                  message: error,
                  retryable: false,
                  supportId: null,
              }
            : error;
    const isSystemError = SYSTEM_CATEGORIES.has(
        normalizedError.category,
    );

    return (
        <div
            className={cn(
                "border border-danger/30 bg-status-danger p-3 text-status-danger-foreground",
                className,
            )}
            role="alert"
        >
            <div className="flex items-start gap-2.5">
                <ErrorIcon category={normalizedError.category} />
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-5">
                        {normalizedError.message}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-80">
                        <span>Mã lỗi: {normalizedError.code}</span>
                        {isSystemError &&
                        normalizedError.supportId ? (
                            <span>
                                Mã hỗ trợ:{" "}
                                {normalizedError.supportId}
                            </span>
                        ) : null}
                    </div>
                </div>
                {normalizedError.retryable && onRetry ? (
                    <Button
                        className="shrink-0"
                        size="sm"
                        variant="secondary"
                        onClick={onRetry}
                    >
                        <RotateCcw size={14} />
                        Thử lại
                    </Button>
                ) : null}
            </div>
        </div>
    );
}
