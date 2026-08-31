"use client";

import { fetchChapterDetail } from "@/app/_lib/api";
import {
    getChapterBenchmarkPolicy,
    getChapterDetailQueryKey,
    getChapterHref,
    getChapterNumberParam,
} from "@/app/_lib/chapter-query";
import { useBenchmarkVariant } from "@/app/Providers";
import { useNavigationProgress } from "@/app/_component/NavigationProgressBar";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

function useChapterNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();
    const benchmarkVariant = useBenchmarkVariant();
    const benchmarkPolicy = getChapterBenchmarkPolicy(benchmarkVariant);
    const { startNavigationProgress, completeNavigationProgress } =
        useNavigationProgress();
    const [isTransitionPending, startTransition] = useTransition();
    const [pendingHref, setPendingHref] = useState(null);

    useEffect(() => {
        setPendingHref(null);
    }, [pathname]);

    const navigateToChapter = useCallback(
        async ({ slug, number, onStart }) => {
            const chapterNumber = getChapterNumberParam(number);
            const href = getChapterHref({ slug, number: chapterNumber });

            setPendingHref(href);
            startNavigationProgress();
            onStart?.();

            if (!benchmarkPolicy.navigationPrefetch) {
                startTransition(() => {
                    router.push(href);
                });
                return true;
            }

            try {
                await queryClient.fetchQuery({
                    queryKey: getChapterDetailQueryKey({
                        slug,
                        number: chapterNumber,
                    }),
                    queryFn: () =>
                        fetchChapterDetail({
                            slug,
                            number: chapterNumber,
                        }),
                });

                startTransition(() => {
                    router.push(href);
                });

                return true;
            } catch (error) {
                console.log("Failed to prefetch chapter before navigation", {
                    error,
                    href,
                });
                setPendingHref(null);
                completeNavigationProgress();
                return false;
            }
        },
        [
            completeNavigationProgress,
            benchmarkPolicy.navigationPrefetch,
            queryClient,
            router,
            startNavigationProgress,
        ],
    );

    return {
        navigateToChapter,
        isNavigatingChapter: Boolean(pendingHref) || isTransitionPending,
        pendingHref,
    };
}

export { useChapterNavigation };
