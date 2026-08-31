"use client";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-[background-color,color,border-color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
    {
        variants: {
            variant: {
                default: "bg-accent text-on-accent hover:bg-accent-strong",
                secondary:
                    "border border-line-strong bg-surface text-foreground hover:bg-surface-muted",
                ghost: "text-muted hover:bg-surface-muted hover:text-foreground",
                danger: "bg-danger text-on-danger hover:bg-danger-strong",
            },
            size: {
                default: "h-10 px-4",
                sm: "h-8 px-3 text-xs",
                icon: "size-10 px-0",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    },
);

export function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}) {
    const Component = asChild ? Slot : "button";

    return (
        <Component
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
}
