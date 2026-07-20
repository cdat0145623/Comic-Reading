"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { forwardRef } from "react";
import { useNavigationProgress } from "./NavigationProgressBar";

const NavigationLink = forwardRef(function NavigationLink(
    { onNavigate, ...props },
    ref,
) {
    const { startNavigationProgress } = useNavigationProgress();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const handleNavigate = (event) => {
        let prevented = false;
        onNavigate?.({
            preventDefault: () => {
                prevented = true;
                event.preventDefault();
            },
        });
        if (prevented) return;

        if (typeof props.href === "string") {
            const target = new URL(props.href, "http://navigation.local");
            const currentSearch = searchParams.toString();
            const current = `${pathname}${currentSearch ? `?${currentSearch}` : ""}`;
            const destination = `${target.pathname}${target.search}`;
            if (destination === current) return;
        }

        startNavigationProgress();
    };

    return (
        <Link
            {...props}
            ref={ref}
            onNavigate={handleNavigate}
        />
    );
});

export default NavigationLink;
