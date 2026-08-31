import { cn } from "@/lib/utils";

const variants = {
    neutral: "bg-status-neutral text-status-neutral-foreground",
    warning: "bg-status-warning text-status-warning-foreground",
    danger: "bg-status-danger text-status-danger-foreground",
    success: "bg-status-success text-status-success-foreground",
    info: "bg-status-info text-status-info-foreground",
};

export function Badge({ variant = "neutral", className, children }) {
    return (
        <span
            className={cn(
                "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
                variants[variant],
                className,
            )}
        >
            {children}
        </span>
    );
}
