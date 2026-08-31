"use client";

import { fetchContinueChapter } from "@/app/_lib/api";
import { useModal } from "@/app/_component/Modal/Modal";
import { BookOpenIcon } from "@heroicons/react/24/outline";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useChapterNavigation } from "@/app/hooks/useChapterNavigation";

function ContinueReadingButton({ storyId, slug, className = "" }) {
    const { navigateToChapter, isNavigatingChapter } = useChapterNavigation();
    const { open } = useModal();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const { refetch, isFetching } = useQuery({
        queryKey: ["continueChapter", storyId, userId],
        queryFn: () => fetchContinueChapter({ storyId }),
        enabled: false,
    });

    const handleClick = async () => {
        if (!session) {
            open("signIn", { callbackUrl: `/truyen/${slug}` });
            return;
        }

        const { data } = await refetch();
        const chapterNumber = data?.chapterNumber;

        if (!chapterNumber) return;

        await navigateToChapter({ slug, number: chapterNumber });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={isFetching || isNavigatingChapter}
            className={`${className} disabled:cursor-wait disabled:opacity-70`}
        >
            <BookOpenIcon className="w-5 h-5" />
            <span>
                {isFetching || isNavigatingChapter ? "Đang mở" : "Đọc Tiếp"}
            </span>
        </button>
    );
}

export default ContinueReadingButton;
