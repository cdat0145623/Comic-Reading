import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
    return (
        <input
            className={cn(
                "h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-muted focus:border-accent focus:ring-2 focus:ring-focus-soft",
                className,
            )}
            {...props}
        />
    );
}
